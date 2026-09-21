import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function logAuditAction(params: {
  companyId?: string;
  userId?: string;
  userName?: string;
  modulo: string;
  acao: string;
  registroId?: string;
  valorAnterior?: any;
  valorNovo?: any;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        userName: params.userName,
        modulo: params.modulo,
        acao: params.acao,
        registroId: params.registroId,
        valAnterior: params.valorAnterior ? JSON.stringify(params.valorAnterior) : null,
        valNovo: params.valorNovo ? JSON.stringify(params.valorNovo) : null,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  } catch (error: any) {
    logger.error(`Falha ao gravar Log de Auditoria: ${error.message}`);
  }
}

export function auditMiddleware(modulo: string, acao: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        logAuditAction({
          companyId: req.user.companyId,
          userId: req.user.id,
          userName: req.user.nome,
          modulo,
          acao: `${acao} [${req.method}] ${req.originalUrl}`,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          valorNovo: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
        });
      }
      return originalSend.call(this, body);
    };

    next();
  };
}
