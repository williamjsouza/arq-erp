import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { customersService } from './customers.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const customerSchema = z.object({
  tipo: z.enum(['PF', 'PJ']).default('PJ'),
  nomeRazao: z.string().min(2, 'Nome / Razão Social é obrigatório'),
  nomeFantasia: z.string().optional(),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  rgIe: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export class CustomersController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await customersService.listCustomers(req.user!.companyId, page, limit, search);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customersService.getCustomerWithHistory(id, req.user!.companyId);
      return res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = customerSchema.parse(req.body);
      const customer = await customersService.createCustomer(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: customer, message: 'Cliente cadastrado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customersService.updateCustomer(id, req.user!.companyId, req.body);
      return res.json({ success: true, data: customer, message: 'Cliente atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await customersService.deleteCustomer(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const customersController = new CustomersController();
