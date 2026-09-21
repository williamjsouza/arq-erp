import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { inventoryService } from '../inventory/inventory.service.js';

export class PurchasesService {
  async listPurchases(companyId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (status) where.status = status;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, nomeRazao: true, cpfCnpj: true } },
          items: { include: { product: { select: { id: true, nome: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count({ where }),
    ]);

    return {
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPurchase(id: string, companyId: string) {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    if (!purchase || purchase.companyId !== companyId) {
      throw new AppError('Pedido de compra não encontrado', 404, 'NOT_FOUND');
    }

    return purchase;
  }

  async createPurchase(companyId: string, data: { supplierId: string; observacoes?: string; items: Array<{ productId: string; quantidade: number; valorUnitario: number }> }) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.companyId !== companyId) {
      throw new AppError('Fornecedor não encontrado', 404, 'NOT_FOUND');
    }

    let valorTotalPedido = 0;
    const itemsData = data.items.map((item) => {
      const itemTotal = item.quantidade * item.valorUnitario;
      valorTotalPedido += itemTotal;
      return {
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: itemTotal,
      };
    });

    const count = await prisma.purchase.count({ where: { companyId } });
    const numero = `COM-${(count + 1).toString().padStart(5, '0')}`;

    return prisma.purchase.create({
      data: {
        companyId,
        supplierId: data.supplierId,
        numero,
        status: 'REQUESTED',
        valorTotal: valorTotalPedido,
        observacoes: data.observacoes,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async receivePurchase(id: string, companyId: string, usuarioId: string) {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true, supplier: true },
    });

    if (!purchase || purchase.companyId !== companyId) {
      throw new AppError('Pedido de compra não encontrado', 404, 'NOT_FOUND');
    }

    if (purchase.status === 'RECEIVED') {
      throw new AppError('Este pedido de compra já foi recebido anteriormente', 400, 'ALREADY_RECEIVED');
    }

    // 1. Dar entrada no estoque para cada item do pedido
    for (const item of purchase.items) {
      await inventoryService.addMovement({
        companyId,
        productId: item.productId,
        tipo: 'IN',
        quantidade: item.quantidade,
        motivo: `Recebimento da Compra #${purchase.numero}`,
        documentoRef: purchase.numero,
        origem: 'PURCHASE',
        usuarioId,
      });
    }

    // 2. Gerar conta a pagar no financeiro
    const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias de prazo padrão

    await prisma.accountPayable.create({
      data: {
        companyId,
        supplierId: purchase.supplierId,
        descricao: `Compra #${purchase.numero} - ${purchase.supplier.nomeRazao}`,
        valor: purchase.valorTotal,
        dataVencimento,
        status: 'PENDING',
      },
    });

    // 3. Atualizar status da compra para RECEIVED
    return prisma.purchase.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        dataEntrega: new Date(),
      },
      include: { items: true },
    });
  }
}

export const purchasesService = new PurchasesService();
