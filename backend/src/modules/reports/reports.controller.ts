import { Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

export class ReportsController {
  async sales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const report = await reportsService.getSalesReport(req.user!.companyId, startDate, endDate);
      return res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async inventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.getInventoryReport(req.user!.companyId);
      return res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async financial(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const report = await reportsService.getFinancialReport(req.user!.companyId, startDate, endDate);
      return res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
