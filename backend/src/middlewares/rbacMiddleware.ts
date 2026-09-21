import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { AppError } from './errorHandler.js';

export function requirePermission(permissionKey: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Não autenticado', 401, 'UNAUTHORIZED'));
    }

    // SUPER_ADMIN possui acesso irrestrito a todos os módulos
    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasPermission = req.user.permissions.includes(permissionKey);

    if (!hasPermission) {
      return next(
        new AppError(
          `Acesso Negado: Permissão '${permissionKey}' necessária para esta operação`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
