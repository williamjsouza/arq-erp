import { Response, NextFunction } from 'express';
import { companiesService } from './companies.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

export class CompaniesController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companies = await companiesService.listCompanies();
      return res.json({ success: true, data: companies });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await companiesService.getCompany(id);
      return res.json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  }

  async current(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.getCompany(req.user!.companyId);
      return res.json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  }

  async updateCurrent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.updateCompany(req.user!.companyId, req.body);
      return res.json({ success: true, data: company, message: 'Dados da empresa atualizados com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await companiesService.updateCompany(id, req.body);
      return res.json({ success: true, data: company, message: 'Dados da empresa atualizados' });
    } catch (error) {
      next(error);
    }
  }
}

export const companiesController = new CompaniesController();
