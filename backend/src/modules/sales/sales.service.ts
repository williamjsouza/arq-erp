import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { inventoryService } from '../inventory/inventory.service.js';

export class SalesService {
  async listSales(companyId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (status) where.status = status;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, nomeRazao: true, cpfCnpj: true } },
          items: { include: { product: { select: { id: true, nome: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSale(id: string, companyId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!sale || sale.companyId !== companyId) {
      throw new AppError('Venda/Orçamento não encontrado', 404, 'NOT_FOUND');
    }

    return sale;
  }

  async createSale(companyId: string, data: {
    customerId: string;
    tipo?: 'QUOTE' | 'ORDER' | 'SALE';
    formaPagamento?: string;
    parcelas?: number;
    valorDesconto?: number;
    observacoes?: string;
    items: Array<{ productId: string; quantidade: number; valorUnitario: number; desconto?: number }>;
  }) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer || customer.companyId !== companyId) {
      throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND');
    }

    let valorSubtotal = 0;
    const itemsData = data.items.map((item) => {
      const desc = item.desconto || 0;
      const itemTotal = item.quantidade * item.valorUnitario - desc;
      valorSubtotal += itemTotal;
      return {
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        desconto: desc,
        valorTotal: itemTotal,
      };
    });

    const valorDescontoGeral = data.valorDesconto || 0;
    const valorTotal = Math.max(0, valorSubtotal - valorDescontoGeral);

    const count = await prisma.sale.count({ where: { companyId } });
    const numero = `VEN-${(count + 1).toString().padStart(5, '0')}`;

    return prisma.sale.create({
      data: {
        companyId,
        customerId: data.customerId,
        numero,
        tipo: data.tipo || 'ORDER',
        status: 'OPEN',
        valorSubtotal,
        valorDesconto: valorDescontoGeral,
        valorTotal,
        formaPagamento: data.formaPagamento,
        parcelas: data.parcelas || 1,
        observacoes: data.observacoes,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async finalizeSale(id: string, companyId: string, usuarioId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });

    if (!sale || sale.companyId !== companyId) {
      throw new AppError('Venda não encontrada', 404, 'NOT_FOUND');
    }

    if (sale.status === 'BILLED') {
      throw new AppError('Esta venda já foi faturada anteriormente', 400, 'ALREADY_BILLED');
    }

    // 1. Baixa automática no estoque para cada item da venda
    for (const item of sale.items) {
      await inventoryService.addMovement({
        companyId,
        productId: item.productId,
        tipo: 'OUT',
        quantidade: item.quantidade,
        motivo: `Faturamento da Venda #${sale.numero}`,
        documentoRef: sale.numero,
        origem: 'SALE',
        usuarioId,
      });
    }

    // 2. Gerar parcelas no Contas a Receber
    const parcelas = Math.max(1, sale.parcelas);
    const valorParcela = sale.valorTotal / parcelas;

    for (let i = 1; i <= parcelas; i++) {
      const dataVencimento = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000);

      await prisma.accountReceivable.create({
        data: {
          companyId,
          customerId: sale.customerId,
          descricao: `Venda #${sale.numero} (Parcela ${i}/${parcelas}) - ${sale.customer.nomeRazao}`,
          valor: valorParcela,
          dataVencimento,
          status: 'PENDING',
          formaPagamento: sale.formaPagamento,
        },
      });
    }

    // 3. Atualizar status da venda para BILLED
    return prisma.sale.update({
      where: { id },
      data: {
        status: 'BILLED',
      },
      include: { items: true },
    });
  }
}

export const salesService = new SalesService();
