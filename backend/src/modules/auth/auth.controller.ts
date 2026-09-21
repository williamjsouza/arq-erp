import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const loginSchema = z.object({
  login: z.string().min(1, 'Login/E-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, password } = loginSchema.parse(req.body);
      const result = await authService.login(login, password);

      return res.json({
        success: true,
        data: result,
        message: 'Login realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token é obrigatório' });
      }
      const result = await authService.refreshToken(refreshToken);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response) {
    return res.json({
      success: true,
      data: req.user,
    });
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
