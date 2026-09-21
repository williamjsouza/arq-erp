import { prisma } from '../../config/prisma.js';

export class DashboardService {
  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      receitaMes,
      despesasMes,
      contasPagarPending,
      contasReceberPending,
      vendasDiaCount,
      vendasMes,
      totalClientes,
      novosClientesMes,
      totalProdutos,
      produtosSemEstoque,
      leadsCount,
    ] = await Promise.all([
      // Financeiro
      prisma.accountReceivable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'RECEIVED', dataRecebimento: { gte: firstDayOfMonth } },
      }),
      prisma.accountPayable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PAID', dataPagamento: { gte: firstDayOfMonth } },
      }),
      prisma.accountPayable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PENDING' },
      }),
      prisma.accountReceivable.aggregate({
        _sum: { valor: true },
        where: { companyId, status: 'PENDING' },
      }),
      // Comercial
      prisma.sale.count({
        where: { companyId, status: 'BILLED', createdAt: { gte: today } },
      }),
      prisma.sale.aggregate({
        _sum: { valorTotal: true },
        _count: { id: true },
        where: { companyId, status: 'BILLED', createdAt: { gte: firstDayOfMonth } },
      }),
      prisma.customer.count({ where: { companyId } }),
      prisma.customer.count({
        where: { companyId, createdAt: { gte: firstDayOfMonth } },
      }),
      // Estoque
      prisma.product.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.product.count({ where: { companyId, status: 'ACTIVE', estoqueAtual: 0 } }),
      // CRM
      prisma.crmLead.count({ where: { companyId, status: 'OPEN' } }),
    ]);

    const totalVendasMesVal = vendasMes._sum.valorTotal || 0;
    const qtdVendasMesVal = vendasMes._count.id || 0;
    const ticketMedio = qtdVendasMesVal > 0 ? totalVendasMesVal / qtdVendasMesVal : 0;

    const receitaVal = receitaMes._sum.valor || 0;
    const despesasVal = despesasMes._sum.valor || 0;
    const saldoVal = receitaVal - despesasVal;

    // Calcular estoque baixo
    const allProducts = await prisma.product.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { estoqueAtual: true, estoqueMinimo: true },
    });
    const estoqueBaixoCount = allProducts.filter((p) => p.estoqueAtual <= p.estoqueMinimo).length;

    return {
      financeiro: {
        receitaMes: receitaVal,
        despesasMes: despesasVal,
        saldo: saldoVal,
        contasPagarPendente: contasPagarPending._sum.valor || 0,
        contasReceberPendente: contasReceberPending._sum.valor || 0,
      },
      comercial: {
        vendasDia: vendasDiaCount,
        vendasMesTotal: totalVendasMesVal,
        ticketMedio,
        totalClientes,
        novosClientesMes,
      },
      estoque: {
        totalProdutos,
        estoqueBaixo: estoqueBaixoCount,
        semEstoque: produtosSemEstoque,
      },
      crm: {
        leadsAbertos: leadsCount,
      },
    };
  }
}

export const dashboardService = new DashboardService();
