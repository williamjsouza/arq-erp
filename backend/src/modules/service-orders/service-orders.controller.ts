import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceOrdersService } from './service-orders.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const osItemSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  valorUnitario: z.number().positive('Valor unitário deve ser maior que zero'),
});

const createOsSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  technicianId: z.string().optional(),
  equipamento: z.string().optional(),
  problema: z.string().optional(),
  servicoPrestado: z.string().optional(),
  valorServicos: z.number().min(0).default(0),
  items: z.array(osItemSchema).optional(),
});

export class ServiceOrdersController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await serviceOrdersService.listOrders(req.user!.companyId, page, limit, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await serviceOrdersService.getOrder(id, req.user!.companyId);
      return res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createOsSchema.parse(req.body);
      const order = await serviceOrdersService.createOrder(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: order, message: 'Ordem de Serviço aberta com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, servicoPrestado } = req.body;
      const order = await serviceOrdersService.updateOrderStatus(id, req.user!.companyId, status, servicoPrestado);
      return res.json({ success: true, data: order, message: 'Status da OS atualizado' });
    } catch (error) {
      next(error);
    }
  }
}

export const serviceOrdersController = new ServiceOrdersController();
