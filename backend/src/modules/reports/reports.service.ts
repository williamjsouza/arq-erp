import { prisma } from '../../config/prisma.js';

export class ReportsService {
  async getSalesReport(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId, status: 'BILLED' };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: { select: { nomeRazao: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const total = sales.reduce((acc, s) => acc + s.valorTotal, 0);
    return { summary: { totalVendas: sales.length, valorTotal: total }, sales };
  }

  async getInventoryReport(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { category: true, unit: true },
      orderBy: { estoqueAtual: 'asc' },
    });

    const totalItens = products.reduce((acc, p) => acc + p.estoqueAtual, 0);
    const valorEstoqueCusto = products.reduce((acc, p) => acc + (p.estoqueAtual * p.precoCusto), 0);
    const valorEstoqueVenda = products.reduce((acc, p) => acc + (p.estoqueAtual * p.precoVenda), 0);

    return {
      summary: { totalProdutos: products.length, totalQuantidade: totalItens, valorCusto: valorEstoqueCusto, valorVenda: valorEstoqueVenda },
      products,
    };
  }

  async getFinancialReport(companyId: string, startDate?: string, endDate?: string) {
    const wherePayable: any = { companyId, status: 'PAID' };
    const whereReceivable: any = { companyId, status: 'RECEIVED' };

    if (startDate && endDate) {
      wherePayable.dataPagamento = { gte: new Date(startDate), lte: new Date(endDate) };
      whereReceivable.dataRecebimento = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [payables, receivables] = await Promise.all([
      prisma.accountPayable.findMany({ where: wherePayable, include: { supplier: { select: { nomeRazao: true } } } }),
      prisma.accountReceivable.findMany({ where: whereReceivable, include: { customer: { select: { nomeRazao: true } } } }),
    ]);

    const totalPago = payables.reduce((acc, p) => acc + p.valor, 0);
    const totalRecebido = receivables.reduce((acc, r) => acc + r.valor, 0);

    return {
      summary: { totalPago, totalRecebido, saldoLiquido: totalRecebido - totalPago },
      payables,
      receivables,
    };
  }
}

export const reportsService = new ReportsService();
