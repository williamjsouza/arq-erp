import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class CustomersService {
  async listCustomers(companyId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (search) {
      where.OR = [
        { nomeRazao: { contains: search } },
        { nomeFantasia: { contains: search } },
        { cpfCnpj: { contains: search } },
        { email: { contains: search } },
        { celular: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerWithHistory(id: string, companyId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, numero: true, valorTotal: true, status: true, createdAt: true },
        },
        accountsReceivable: {
          take: 5,
          orderBy: { dataVencimento: 'desc' },
          select: { id: true, descricao: true, valor: true, status: true, dataVencimento: true },
        },
        serviceOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, numero: true, status: true, valorTotal: true, createdAt: true },
        },
        crmLeads: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, titulo: true, status: true, valorEstimado: true },
        },
      },
    });

    if (!customer || customer.companyId !== companyId) {
      throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND');
    }

    return customer;
  }

  async createCustomer(companyId: string, data: any) {
    return prisma.customer.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async updateCustomer(id: string, companyId: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.companyId !== companyId) {
      throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async deleteCustomer(id: string, companyId: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.companyId !== companyId) {
      throw new AppError('Cliente não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.customer.delete({ where: { id } });
    return { message: 'Cliente excluído com sucesso' };
  }
}

export const customersService = new CustomersService();
