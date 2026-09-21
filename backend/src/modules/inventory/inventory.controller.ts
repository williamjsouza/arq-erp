import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { inventoryService } from './inventory.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const movementSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  tipo: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  motivo: z.string().optional(),
  documentoRef: z.string().optional(),
});

export class InventoryController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const productId = req.query.productId as string;

      const result = await inventoryService.listMovements(req.user!.companyId, page, limit, productId);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = movementSchema.parse(req.body);
      const result = await inventoryService.addMovement({
        ...data,
        companyId: req.user!.companyId,
        usuarioId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Movimentação de estoque realizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async lowStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const products = await inventoryService.getLowStockProducts(req.user!.companyId);
      return res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
