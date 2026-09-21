import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class AgendaService {
  async listAppointments(userId: string) {
    return prisma.appointment.findMany({
      where: { userId },
      orderBy: { dataInicio: 'asc' },
    });
  }

  async createAppointment(userId: string, data: any) {
    return prisma.appointment.create({
      data: {
        ...data,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        userId,
      },
    });
  }

  async listTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
      include: {
        assignedTo: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(createdById: string, data: any) {
    return prisma.task.create({
      data: {
        ...data,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        createdById,
      },
    });
  }

  async updateTaskStatus(taskId: string, userId: string, status: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new AppError('Tarefa não encontrada', 404, 'NOT_FOUND');
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }
}

export const agendaService = new AgendaService();
