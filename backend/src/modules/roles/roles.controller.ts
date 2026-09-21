import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rolesService } from './roles.service.js';

const createRoleSchema = z.object({
  nome: z.string().min(2, 'Nome do perfil é obrigatório'),
  descricao: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export class RolesController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rolesService.listRoles();
      return res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  async permissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await rolesService.listPermissions();
      return res.json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRoleSchema.parse(req.body);
      const role = await rolesService.createRole(data);
      return res.status(201).json({ success: true, data: role, message: 'Perfil criado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await rolesService.updateRole(id, req.body);
      return res.json({ success: true, data: role, message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

export const rolesController = new RolesController();
