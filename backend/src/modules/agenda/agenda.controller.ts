import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { agendaService } from './agenda.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const appointmentSchema = z.object({
  titulo: z.string().min(2, 'Título é obrigatório'),
  descricao: z.string().optional(),
  dataInicio: z.string().min(1, 'Data inicial é obrigatória'),
  dataFim: z.string().min(1, 'Data final é obrigatória'),
  local: z.string().optional(),
});

const taskSchema = z.object({
  titulo: z.string().min(2, 'Título da tarefa é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().optional(),
  dataVencimento: z.string().optional(),
});

export class AgendaController {
  async appointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await agendaService.listAppointments(req.user!.id);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async storeAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = appointmentSchema.parse(req.body);
      const appt = await agendaService.createAppointment(req.user!.id, data);
      return res.status(201).json({ success: true, data: appt, message: 'Compromisso agendado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async tasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await agendaService.listTasks(req.user!.id);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async storeTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = taskSchema.parse(req.body);
      const task = await agendaService.createTask(req.user!.id, data);
      return res.status(201).json({ success: true, data: task, message: 'Tarefa cadastrada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const task = await agendaService.updateTaskStatus(id, req.user!.id, status);
      return res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }
}

export const agendaController = new AgendaController();
