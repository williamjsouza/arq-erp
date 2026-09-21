import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export interface QuoteItemInput {
  tipo: 'PRODUCT' | 'SERVICE';
  productId?: string | null;
  serviceId?: string | null;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto?: number;
}

export class QuotesService {
  async listQuotes(companyId: string, page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { customer: { nomeRazao: { contains: search } } },
        { customer: { cpfCnpj: { contains: search } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, nomeRazao: true, nomeFantasia: true, cpfCnpj: true, telefone: true, celular: true, email: true },
          },
          items: {
            include: {
              product: { select: { id: true, nome: true, sku: true, precoVenda: true } },
              service: { select: { id: true, nome: true, codigo: true, preco: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQuote(id: string, companyId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });

    if (!quote || quote.companyId !== companyId) {
      throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
    }

    return quote;
  }

  async createQuote(companyId: string, data: {
    customerId: string;
    validadeDias?: number;
    formaPagamento?: string | null;
    valorDesconto?: number;
    observacoes?: string | null;
    items: QuoteItemInput[];
  }) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer || customer.companyId !== companyId) {
      throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND');
    }

    if (!data.items || data.items.length === 0) {
      throw new AppError('O orçamento deve conter ao menos um produto ou serviço', 400, 'EMPTY_ITEMS');
    }

    let valorSubtotal = 0;
    const itemsData = data.items.map((item) => {
      const desc = Number(item.desconto) || 0;
      const qtd = Number(item.quantidade) || 1;
      const unit = Number(item.valorUnitario) || 0;
      const itemTotal = Math.max(0, qtd * unit - desc);
      valorSubtotal += itemTotal;

      return {
        tipo: item.tipo,
        productId: item.tipo === 'PRODUCT' ? (item.productId || null) : null,
        serviceId: item.tipo === 'SERVICE' ? (item.serviceId || null) : null,
        descricao: item.descricao,
        quantidade: qtd,
        valorUnitario: unit,
        desconto: desc,
        valorTotal: itemTotal,
      };
    });

    const valorDescontoGeral = Number(data.valorDesconto) || 0;
    const valorTotal = Math.max(0, valorSubtotal - valorDescontoGeral);

    const count = await prisma.quote.count({ where: { companyId } });
    const numero = `ORC-${(count + 1).toString().padStart(5, '0')}`;

    const validadeDias = data.validadeDias ? Number(data.validadeDias) : 15;
    const dataValidade = new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000);

    return prisma.quote.create({
      data: {
        companyId,
        customerId: data.customerId,
        numero,
        status: 'OPEN',
        validadeDias,
        dataValidade,
        valorSubtotal,
        valorDesconto: valorDescontoGeral,
        valorTotal,
        formaPagamento: data.formaPagamento || null,
        observacoes: data.observacoes || null,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });
  }

  async updateQuote(id: string, companyId: string, data: {
    customerId?: string;
    validadeDias?: number;
    status?: string;
    formaPagamento?: string | null;
    valorDesconto?: number;
    observacoes?: string | null;
    items?: QuoteItemInput[];
  }) {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
    }

    let valorSubtotal = existing.valorSubtotal;
    let valorDescontoGeral = data.valorDesconto !== undefined ? Number(data.valorDesconto) : existing.valorDesconto;
    let valorTotal = existing.valorTotal;

    // Se novos itens forem enviados, recalcula e substitui
    if (data.items && data.items.length > 0) {
      valorSubtotal = 0;
      const itemsData = data.items.map((item) => {
        const desc = Number(item.desconto) || 0;
        const qtd = Number(item.quantidade) || 1;
        const unit = Number(item.valorUnitario) || 0;
        const itemTotal = Math.max(0, qtd * unit - desc);
        valorSubtotal += itemTotal;

        return {
          quoteId: id,
          tipo: item.tipo,
          productId: item.tipo === 'PRODUCT' ? (item.productId || null) : null,
          serviceId: item.tipo === 'SERVICE' ? (item.serviceId || null) : null,
          descricao: item.descricao,
          quantidade: qtd,
          valorUnitario: unit,
          desconto: desc,
          valorTotal: itemTotal,
        };
      });

      valorTotal = Math.max(0, valorSubtotal - valorDescontoGeral);

      // Deleta itens anteriores e recria
      await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
      await prisma.quoteItem.createMany({ data: itemsData });
    } else {
      valorTotal = Math.max(0, valorSubtotal - valorDescontoGeral);
    }

    return prisma.quote.update({
      where: { id },
      data: {
        customerId: data.customerId,
        status: data.status,
        validadeDias: data.validadeDias ? Number(data.validadeDias) : undefined,
        valorSubtotal,
        valorDesconto: valorDescontoGeral,
        valorTotal,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, companyId: string, status: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote || quote.companyId !== companyId) {
      throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.quote.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
  }

  async deleteQuote(id: string, companyId: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote || quote.companyId !== companyId) {
      throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.quote.delete({ where: { id } });
    return { message: 'Orçamento excluído com sucesso' };
  }
}

export const quotesService = new QuotesService();
