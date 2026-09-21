import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

export class DashboardController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getMetrics(req.user!.companyId);
      return res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
