import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedUser {
  id: string;
  nome: string;
  email: string;
  username: string;
  companyId: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação não fornecido ou inválido', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new AppError('Sessão expirada ou token inválido. Faça login novamente.', 401, 'TOKEN_EXPIRED');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Usuário inativo ou não cadastrado no sistema', 403, 'USER_INACTIVE');
    }

    // Coletar roles e permissões únicas
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    user.userRoles.forEach((ur) => {
      roles.push(ur.role.nome);
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.chave);
      });
    });

    req.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      companyId: user.companyId,
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (error) {
    next(error);
  }
}
