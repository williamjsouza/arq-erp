import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { salesService } from './sales.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  valorUnitario: z.number().positive('Valor unitário deve ser maior que zero'),
  desconto: z.number().min(0).optional(),
});

const createSaleSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  tipo: z.enum(['QUOTE', 'ORDER', 'SALE']).optional(),
  formaPagamento: z.string().optional(),
  parcelas: z.number().min(1).default(1),
  valorDesconto: z.number().min(0).optional(),
  observacoes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'A venda deve conter ao menos 1 item'),
});

export class SalesController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await salesService.listSales(req.user!.companyId, page, limit, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sale = await salesService.getSale(id, req.user!.companyId);
      return res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createSaleSchema.parse(req.body);
      const sale = await salesService.createSale(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: sale, message: 'Venda/Orçamento criado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async finalize(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await salesService.finalizeSale(id, req.user!.companyId, req.user!.id);
      return res.json({
        success: true,
        data: result,
        message: 'Venda faturada com sucesso. Estoque baixado e Contas a Receber gerado!',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
