import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class SuppliersService {
  async listSuppliers(companyId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (search) {
      where.OR = [
        { nomeRazao: { contains: search } },
        { nomeFantasia: { contains: search } },
        { cpfCnpj: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSupplier(id: string, companyId: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, nome: true, sku: true, precoCusto: true } },
        purchases: { take: 5, orderBy: { createdAt: 'desc' } },
        accountsPayable: { take: 5, orderBy: { dataVencimento: 'desc' } },
      },
    });

    if (!supplier || supplier.companyId !== companyId) {
      throw new AppError('Fornecedor não encontrado', 404, 'NOT_FOUND');
    }

    return supplier;
  }

  async createSupplier(companyId: string, data: any) {
    return prisma.supplier.create({
      data: { ...data, companyId },
    });
  }

  async updateSupplier(id: string, companyId: string, data: any) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.companyId !== companyId) {
      throw new AppError('Fornecedor não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: string, companyId: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.companyId !== companyId) {
      throw new AppError('Fornecedor não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.supplier.delete({ where: { id } });
    return { message: 'Fornecedor excluído com sucesso' };
  }
}

export const suppliersService = new SuppliersService();
