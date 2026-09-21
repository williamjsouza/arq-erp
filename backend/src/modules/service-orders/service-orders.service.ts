import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class ServiceOrdersService {
  async listOrders(companyId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, nomeRazao: true, celular: true } },
          technician: { select: { id: true, nome: true } },
          items: { include: { product: { select: { id: true, nome: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceOrder.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(id: string, companyId: string) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        items: { include: { product: true } },
      },
    });

    if (!order || order.companyId !== companyId) {
      throw new AppError('Ordem de serviço não encontrada', 404, 'NOT_FOUND');
    }

    return order;
  }

  async createOrder(companyId: string, data: {
    customerId: string;
    technicianId?: string;
    equipamento?: string;
    problema?: string;
    servicoPrestado?: string;
    valorServicos?: number;
    items?: Array<{ productId: string; quantidade: number; valorUnitario: number }>;
  }) {
    let valorPecas = 0;
    const itemsData = (data.items || []).map((item) => {
      const itemTotal = item.quantidade * item.valorUnitario;
      valorPecas += itemTotal;
      return {
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: itemTotal,
      };
    });

    const valorServicos = data.valorServicos || 0;
    const valorTotal = valorServicos + valorPecas;

    const count = await prisma.serviceOrder.count({ where: { companyId } });
    const numero = `OS-${(count + 1).toString().padStart(5, '0')}`;

    return prisma.serviceOrder.create({
      data: {
        companyId,
        customerId: data.customerId,
        technicianId: data.technicianId,
        numero,
        equipamento: data.equipamento,
        problema: data.problema,
        servicoPrestado: data.servicoPrestado,
        valorServicos,
        valorPecas,
        valorTotal,
        status: 'OPEN',
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async updateOrderStatus(id: string, companyId: string, status: string, servicoPrestado?: string) {
    const order = await prisma.serviceOrder.findUnique({ where: { id } });
    if (!order || order.companyId !== companyId) {
      throw new AppError('Ordem de Serviço não encontrada', 404, 'NOT_FOUND');
    }

    const updateData: any = { status };
    if (servicoPrestado) updateData.servicoPrestado = servicoPrestado;
    if (status === 'COMPLETED') updateData.dataConclusao = new Date();

    return prisma.serviceOrder.update({
      where: { id },
      data: updateData,
    });
  }
}

export const serviceOrdersService = new ServiceOrdersService();
