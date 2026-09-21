import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { quotesService } from './quotes.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const quoteItemSchema = z.object({
  tipo: z.enum(['PRODUCT', 'SERVICE']),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  descricao: z.string().min(1, 'Descrição do item é obrigatória'),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que 0').default(1),
  valorUnitario: z.number().min(0).default(0),
  desconto: z.number().min(0).default(0),
});

const quoteCreateSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  validadeDias: z.number().min(1).default(15),
  formaPagamento: z.string().optional().nullable(),
  valorDesconto: z.number().min(0).default(0),
  observacoes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1, 'Informe ao menos um produto ou serviço no orçamento'),
});

const quoteUpdateSchema = z.object({
  customerId: z.string().optional(),
  validadeDias: z.number().min(1).optional(),
  status: z.enum(['OPEN', 'SENT', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  formaPagamento: z.string().optional().nullable(),
  valorDesconto: z.number().min(0).optional(),
  observacoes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).optional(),
});

export class QuotesController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await quotesService.listQuotes(req.user!.companyId, page, limit, status, search);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quote = await quotesService.getQuote(id, req.user!.companyId);
      return res.json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = quoteCreateSchema.parse(req.body);
      const quote = await quotesService.createQuote(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: quote, message: 'Orçamento gerado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = quoteUpdateSchema.parse(req.body);
      const quote = await quotesService.updateQuote(id, req.user!.companyId, data);
      return res.json({ success: true, data: quote, message: 'Orçamento atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status é obrigatório' });
      }

      const quote = await quotesService.updateStatus(id, req.user!.companyId, status);
      return res.json({ success: true, data: quote, message: `Status alterado para ${status}` });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quotesService.deleteQuote(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const quotesController = new QuotesController();
