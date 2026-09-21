import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class ProductsService {
  async listProducts(companyId: string, page = 1, limit = 20, search?: string, categoryId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { sku: { contains: search } },
        { codigoBarras: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          brand: true,
          unit: true,
          supplier: { select: { id: true, nomeRazao: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProduct(id: string, companyId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        unit: true,
        supplier: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || product.companyId !== companyId) {
      throw new AppError('Produto não encontrado', 404, 'NOT_FOUND');
    }

    return product;
  }

  async createProduct(companyId: string, data: any) {
    if (data.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        throw new AppError('Já existe um produto cadastrado com este SKU', 400, 'SKU_EXISTS');
      }
    }

    return prisma.product.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async updateProduct(id: string, companyId: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.companyId !== companyId) {
      throw new AppError('Produto não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: string, companyId: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.companyId !== companyId) {
      throw new AppError('Produto não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.product.delete({ where: { id } });
    return { message: 'Produto excluído com sucesso' };
  }

  // Métodos auxiliares para Categorias, Marcas e Unidades
  async listCategories() {
    return prisma.category.findMany({ orderBy: { nome: 'asc' } });
  }

  async createCategory(nome: string, descricao?: string) {
    return prisma.category.create({ data: { nome, descricao } });
  }

  async listBrands() {
    return prisma.brand.findMany({ orderBy: { nome: 'asc' } });
  }

  async createBrand(nome: string) {
    return prisma.brand.create({ data: { nome } });
  }

  async listUnits() {
    return prisma.unit.findMany({ orderBy: { sigla: 'asc' } });
  }
}

export const productsService = new ProductsService();
