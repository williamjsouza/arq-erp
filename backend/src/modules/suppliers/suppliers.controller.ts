import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { suppliersService } from './suppliers.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const supplierSchema = z.object({
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

export class SuppliersController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await suppliersService.listSuppliers(req.user!.companyId, page, limit, search);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.getSupplier(id, req.user!.companyId);
      return res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = supplierSchema.parse(req.body);
      const supplier = await suppliersService.createSupplier(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: supplier, message: 'Fornecedor cadastrado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.updateSupplier(id, req.user!.companyId, req.body);
      return res.json({ success: true, data: supplier, message: 'Fornecedor atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await suppliersService.deleteSupplier(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const suppliersController = new SuppliersController();
