import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { purchasesService } from './purchases.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  valorUnitario: z.number().positive('Valor unitário deve ser maior que zero'),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  observacoes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'O pedido de compra deve conter ao menos 1 item'),
});

export class PurchasesController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await purchasesService.listPurchases(req.user!.companyId, page, limit, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const purchase = await purchasesService.getPurchase(id, req.user!.companyId);
      return res.json({ success: true, data: purchase });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createPurchaseSchema.parse(req.body);
      const purchase = await purchasesService.createPurchase(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: purchase, message: 'Pedido de compra registrado' });
    } catch (error) {
      next(error);
    }
  }

  async receive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await purchasesService.receivePurchase(id, req.user!.companyId, req.user!.id);
      return res.json({
        success: true,
        data: result,
        message: 'Recebimento efetuado. Estoque atualizado e Contas a Pagar gerada!',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const purchasesController = new PurchasesController();
