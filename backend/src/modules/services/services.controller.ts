import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { servicesService } from './services.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const serviceSchema = z.object({
  codigo: z.string().optional().nullable(),
  nome: z.string().min(2, 'Nome do serviço é obrigatório'),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  preco: z.number().min(0, 'Preço deve ser positivo').default(0),
  duracaoHoras: z.number().min(0).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export class ServicesController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await servicesService.listServices(req.user!.companyId, page, limit, search, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await servicesService.getService(id, req.user!.companyId);
      return res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = serviceSchema.parse(req.body);
      const service = await servicesService.createService(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: service, message: 'Serviço cadastrado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await servicesService.updateService(id, req.user!.companyId, req.body);
      return res.json({ success: true, data: service, message: 'Serviço atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await servicesService.deleteService(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const servicesController = new ServicesController();
