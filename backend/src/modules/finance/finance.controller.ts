import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { financeService } from './finance.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const payableSchema = z.object({
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  costCenterId: z.string().optional(),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

const receivableSchema = z.object({
  customerId: z.string().optional(),
  categoryId: z.string().optional(),
  costCenterId: z.string().optional(),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

export class FinanceController {
  // Contas a Pagar
  async indexPayable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await financeService.listAccountsPayable(req.user!.companyId, page, limit, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async storePayable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = payableSchema.parse(req.body);
      const account = await financeService.createAccountPayable(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: account, message: 'Conta a pagar lançada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async pay(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { formaPagamento } = req.body;
      const account = await financeService.payAccount(id, req.user!.companyId, formaPagamento);
      return res.json({ success: true, data: account, message: 'Pagamento efetuado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // Contas a Receber
  async indexReceivable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await financeService.listAccountsReceivable(req.user!.companyId, page, limit, status);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async storeReceivable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = receivableSchema.parse(req.body);
      const account = await financeService.createAccountReceivable(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: account, message: 'Conta a receber lançada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async receive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { formaPagamento } = req.body;
      const account = await financeService.receiveAccount(id, req.user!.companyId, formaPagamento);
      return res.json({ success: true, data: account, message: 'Recebimento efetuado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // Fluxo de Caixa
  async cashFlow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as any) || 'month';
      const result = await financeService.getCashFlow(req.user!.companyId, period);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Centros de Custo
  async costCenters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await financeService.listCostCenters(req.user!.companyId);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async storeCostCenter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { nome, codigo, parentId } = req.body;
      const result = await financeService.createCostCenter(req.user!.companyId, { nome, codigo, parentId });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
