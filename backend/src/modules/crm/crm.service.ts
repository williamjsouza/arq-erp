import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class CrmService {
  async getPipeline(companyId: string) {
    const stages = await prisma.crmPipelineStage.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        leads: {
          where: { companyId },
          include: { customer: { select: { id: true, nomeRazao: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return stages;
  }

  async createLead(companyId: string, data: any) {
    let stageId = data.stageId;
    if (!stageId) {
      const firstStage = await prisma.crmPipelineStage.findFirst({ orderBy: { ordem: 'asc' } });
      if (!firstStage) {
        throw new AppError('Nenhum estágio de funil cadastrado no sistema', 400, 'NO_STAGE');
      }
      stageId = firstStage.id;
    }

    return prisma.crmLead.create({
      data: {
        ...data,
        stageId,
        companyId,
      },
      include: { stage: true, customer: true },
    });
  }

  async updateLeadStage(id: string, companyId: string, stageId: string) {
    const lead = await prisma.crmLead.findUnique({ where: { id } });
    if (!lead || lead.companyId !== companyId) {
      throw new AppError('Oportunidade/Lead não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.crmLead.update({
      where: { id },
      data: { stageId },
      include: { stage: true },
    });
  }

  async updateLeadStatus(id: string, companyId: string, status: 'OPEN' | 'WON' | 'LOST') {
    const lead = await prisma.crmLead.findUnique({ where: { id } });
    if (!lead || lead.companyId !== companyId) {
      throw new AppError('Oportunidade/Lead não encontrado', 404, 'NOT_FOUND');
    }

    return prisma.crmLead.update({
      where: { id },
      data: { status },
    });
  }
}

export const crmService = new CrmService();
