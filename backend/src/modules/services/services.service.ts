import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class ServicesService {
  async listServices(companyId: string, page = 1, limit = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { codigo: { contains: search } },
        { categoria: { contains: search } },
        { descricao: { contains: search } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    return {
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getService(id: string, companyId: string) {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service || service.companyId !== companyId) {
      throw new AppError('Serviço não encontrado', 404, 'NOT_FOUND');
    }

    return service;
  }

  async createService(companyId: string, data: {
    codigo?: string | null;
    nome: string;
    descricao?: string | null;
    categoria?: string | null;
    preco?: number;
    duracaoHoras?: number | null;
    status?: string;
  }) {
    return prisma.service.create({
      data: {
        companyId,
        codigo: data.codigo || null,
        nome: data.nome,
        descricao: data.descricao || null,
        categoria: data.categoria || null,
        preco: Number(data.preco) || 0,
        duracaoHoras: data.duracaoHoras ? Number(data.duracaoHoras) : null,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async updateService(id: string, companyId: string, data: any) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service || service.companyId !== companyId) {
      throw new AppError('Serviço não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.service.update({
      where: { id },
      data: {
        ...data,
        preco: data.preco !== undefined ? Number(data.preco) : undefined,
        duracaoHoras: data.duracaoHoras !== undefined ? (data.duracaoHoras ? Number(data.duracaoHoras) : null) : undefined,
      },
    });
  }

  async deleteService(id: string, companyId: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service || service.companyId !== companyId) {
      throw new AppError('Serviço não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.service.delete({ where: { id } });
    return { message: 'Serviço excluído com sucesso' };
  }
}

export const servicesService = new ServicesService();
