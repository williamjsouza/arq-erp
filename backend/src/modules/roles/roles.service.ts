import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class RolesService {
  async listRoles() {
    return prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ modulo: 'asc' }, { acao: 'asc' }],
    });
  }

  async createRole(data: { nome: string; descricao?: string; permissionIds?: string[] }) {
    const existing = await prisma.role.findUnique({ where: { nome: data.nome.toUpperCase() } });
    if (existing) {
      throw new AppError('Um perfil com este nome já existe', 400, 'ROLE_EXISTS');
    }

    const role = await prisma.role.create({
      data: {
        nome: data.nome.toUpperCase(),
        descricao: data.descricao,
      },
    });

    if (data.permissionIds && Array.isArray(data.permissionIds)) {
      for (const permissionId of data.permissionIds) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId },
        });
      }
    }

    return role;
  }

  async updateRole(roleId: string, data: { nome?: string; descricao?: string; permissionIds?: string[] }) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Perfil não encontrado', 404, 'NOT_FOUND');
    }

    if (role.isSystem && data.nome && data.nome !== role.nome) {
      throw new AppError('Não é permitido alterar o nome de um perfil do sistema', 400, 'SYSTEM_ROLE_LOCKED');
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        nome: data.nome ? data.nome.toUpperCase() : role.nome,
        descricao: data.descricao,
      },
    });

    if (data.permissionIds && Array.isArray(data.permissionIds)) {
      await prisma.rolePermission.deleteMany({ where: { roleId } });
      for (const permissionId of data.permissionIds) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId },
        });
      }
    }

    return updated;
  }
}

export const rolesService = new RolesService();
