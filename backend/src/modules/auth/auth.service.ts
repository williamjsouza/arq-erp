import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class AuthService {
  async login(loginInput: string, passwordInput: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginInput.toLowerCase() },
          { username: loginInput.toLowerCase() },
        ],
      },
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

    if (!user) {
      throw new AppError('Credenciais inválidas. Verifique seu login e senha.', 401, 'INVALID_CREDENTIALS');
    }

    // Verificar bloqueio temporário por tentativas excessivas
    if (user.blockedUntil && user.blockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.blockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Conta temporariamente bloqueada por segurança. Tente novamente em ${minutesRemaining} minuto(s).`,
        403,
        'ACCOUNT_BLOCKED'
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Usuário inativo. Entre em contato com o administrador.', 403, 'USER_INACTIVE');
    }

    const isValidPassword = await bcrypt.compare(passwordInput, user.passwordHash);

    if (!isValidPassword) {
      const newFailedCount = user.failedLogins + 1;
      let blockedUntil: Date | null = null;

      if (newFailedCount >= 5) {
        // Bloquear por 15 minutos após 5 tentativas incorretas
        blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: newFailedCount,
          blockedUntil,
        },
      });

      throw new AppError('Credenciais inválidas. Verifique seu login e senha.', 401, 'INVALID_CREDENTIALS');
    }

    // Resetar tentativas incorretas e atualizar último acesso
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        blockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Coletar papéis e permissões
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    user.userRoles.forEach((ur) => {
      roles.push(ur.role.nome);
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.chave);
      });
    });

    const accessToken = jwt.sign(
      { userId: user.id, companyId: user.companyId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as any
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as any
    );

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        companyId: user.companyId,
        avatar: user.avatar,
        roles,
        permissions: Array.from(permissionsSet),
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('Usuário inativo ou inexistente', 403, 'USER_INACTIVE');
      }

      const accessToken = jwt.sign(
        { userId: user.id, companyId: user.companyId },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as any
      );

      return { accessToken };
    } catch (err) {
      throw new AppError('Refresh token inválido ou expirado', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuário não encontrado', 44, 'NOT_FOUND');
    }

    const isValid = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isValid) {
      throw new AppError('Senha atual incorreta', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}

export const authService = new AuthService();
