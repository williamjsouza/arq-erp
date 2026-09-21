import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  username: z.string().min(3, 'Nome de usuário deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  telefone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  roleIds: z.array(z.string()).optional(),
});

export class UsersController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await usersService.listUsers(req.user!.companyId, page, limit, search);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await usersService.createUser(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: user, message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await usersService.updateUser(id, req.user!.companyId, req.body);
      return res.json({ success: true, data: user, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.deleteUser(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
