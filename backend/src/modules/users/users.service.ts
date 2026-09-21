import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class UsersService {
  async listUsers(companyId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nome: true,
          email: true,
          username: true,
          telefone: true,
          avatar: true,
          status: true,
          companyId: true,
          lastLogin: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: { id: true, nome: true, descricao: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role.nome),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(companyId: string, data: any) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new AppError('Este e-mail já está em uso por outro usuário.', 400, 'EMAIL_EXISTS');
    }

    const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
    if (existingUser) {
      throw new AppError('Este nome de usuário já está em uso.', 400, 'USERNAME_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        passwordHash,
        telefone: data.telefone,
        status: data.status || 'ACTIVE',
        companyId,
      },
    });

    if (data.roleIds && Array.isArray(data.roleIds)) {
      for (const roleId of data.roleIds) {
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId,
          },
        });
      }
    }

    return newUser;
  }

  async updateUser(userId: string, companyId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== companyId) {
      throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
      if (existingEmail) {
        throw new AppError('Este e-mail já está em uso por outro usuário.', 400, 'EMAIL_EXISTS');
      }
    }

    const updateData: any = {
      nome: data.nome,
      email: data.email ? data.email.toLowerCase() : undefined,
      telefone: data.telefone,
      status: data.status,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (data.roleIds && Array.isArray(data.roleIds)) {
      await prisma.userRole.deleteMany({ where: { userId } });
      for (const roleId of data.roleIds) {
        await prisma.userRole.create({
          data: { userId, roleId },
        });
      }
    }

    return updated;
  }

  async deleteUser(userId: string, companyId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== companyId) {
      throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Usuário excluído com sucesso' };
  }
}

export const usersService = new UsersService();
