import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { crmService } from './crm.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const leadSchema = z.object({
  stageId: z.string().optional(),
  customerId: z.string().optional(),
  titulo: z.string().min(2, 'Título do Lead é obrigatório'),
  contatoNome: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  valorEstimado: z.number().min(0).default(0),
  probabilidade: z.number().min(0).max(100).default(50),
  observacoes: z.string().optional(),
});

export class CrmController {
  async pipeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stages = await crmService.getPipeline(req.user!.companyId);
      return res.json({ success: true, data: stages });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = leadSchema.parse(req.body);
      const lead = await crmService.createLead(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: lead, message: 'Lead/Oportunidade criada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async moveStage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stageId } = req.body;
      if (!stageId) {
        return res.status(400).json({ success: false, message: 'stageId é obrigatório' });
      }
      const updated = await crmService.updateLeadStage(id, req.user!.companyId, stageId);
      return res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async setStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await crmService.updateLeadStatus(id, req.user!.companyId, status);
      return res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export const crmController = new CrmController();
