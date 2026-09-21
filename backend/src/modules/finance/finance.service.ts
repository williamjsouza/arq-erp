import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class FinanceService {
  // ==================== CONTAS A PAGAR ====================
  async listAccountsPayable(companyId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (status) where.status = status;

    const [accounts, total] = await Promise.all([
      prisma.accountPayable.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, nomeRazao: true } },
          category: { select: { id: true, nome: true } },
          costCenter: { select: { id: true, nome: true } },
        },
        orderBy: { dataVencimento: 'asc' },
      }),
      prisma.accountPayable.count({ where }),
    ]);

    return {
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createAccountPayable(companyId: string, data: any) {
    return prisma.accountPayable.create({
      data: {
        ...data,
        dataVencimento: new Date(data.dataVencimento),
        companyId,
      },
    });
  }

  async payAccount(id: string, companyId: string, formaPagamento?: string) {
    const account = await prisma.accountPayable.findUnique({ where: { id } });
    if (!account || account.companyId !== companyId) {
      throw new AppError('Conta a pagar não encontrada', 404, 'NOT_FOUND');
    }

    return prisma.accountPayable.update({
      where: { id },
      data: {
        status: 'PAID',
        dataPagamento: new Date(),
        formaPagamento: formaPagamento || account.formaPagamento,
      },
    });
  }

  // ==================== CONTAS A RECEBER ====================
  async listAccountsReceivable(companyId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (status) where.status = status;

    const [accounts, total] = await Promise.all([
      prisma.accountReceivable.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, nomeRazao: true } },
          category: { select: { id: true, nome: true } },
          costCenter: { select: { id: true, nome: true } },
        },
        orderBy: { dataVencimento: 'asc' },
      }),
      prisma.accountReceivable.count({ where }),
    ]);

    return {
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createAccountReceivable(companyId: string, data: any) {
    return prisma.accountReceivable.create({
      data: {
        ...data,
        dataVencimento: new Date(data.dataVencimento),
        companyId,
      },
    });
  }

  async receiveAccount(id: string, companyId: string, formaPagamento?: string) {
    const account = await prisma.accountReceivable.findUnique({ where: { id } });
    if (!account || account.companyId !== companyId) {
      throw new AppError('Conta a receber não encontrada', 404, 'NOT_FOUND');
    }

    return prisma.accountReceivable.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        dataRecebimento: new Date(),
        formaPagamento: formaPagamento || account.formaPagamento,
      },
    });
  }

  // ==================== FLUXO DE CAIXA ====================
  async getCashFlow(companyId: string, period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const [received, paid, pendingReceivable, pendingPayable] = await Promise.all([
      prisma.accountReceivable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'RECEIVED', dataRecebimento: { gte: startDate } },
      }),
      prisma.accountPayable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PAID', dataPagamento: { gte: startDate } },
      }),
      prisma.accountReceivable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PENDING', dataVencimento: { gte: startDate } },
      }),
      prisma.accountPayable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PENDING', dataVencimento: { gte: startDate } },
      }),
    ]);

    const entradasRealizadas = received._sum.valor || 0;
    const saídasRealizadas = paid._sum.valor || 0;
    const saldoRealizado = entradasRealizadas - saídasRealizadas;

    const entradasPrevistas = pendingReceivable._sum.valor || 0;
    const saídasPrevistas = pendingPayable._sum.valor || 0;
    const saldoPrevisto = (entradasRealizadas + entradasPrevistas) - (saídasRealizadas + saídasPrevistas);

    return {
      period,
      realizado: {
        entradas: entradasRealizadas,
        saidas: saídasRealizadas,
        saldo: saldoRealizado,
      },
      previsto: {
        entradas: entradasPrevistas,
        saidas: saídasPrevistas,
        saldo: saldoPrevisto,
      },
    };
  }

  // ==================== CENTROS DE CUSTO ====================
  async listCostCenters(companyId: string) {
    return prisma.costCenter.findMany({
      where: { companyId },
      include: { children: true },
      orderBy: { nome: 'asc' },
    });
  }

  async createCostCenter(companyId: string, data: { nome: string; codigo?: string; parentId?: string }) {
    return prisma.costCenter.create({
      data: {
        ...data,
        companyId,
      },
    });
  }
}

export const financeService = new FinanceService();
