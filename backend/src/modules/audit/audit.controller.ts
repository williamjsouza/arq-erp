import { Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

export class AuditController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const modulo = req.query.modulo as string;
      const userName = req.query.userName as string;

      const result = await auditService.listLogs(req.user!.companyId, page, limit, modulo, userName);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
