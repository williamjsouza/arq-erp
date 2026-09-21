import { Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

export class SettingsController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      return res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { chave, valor, descricao } = req.body;
      const setting = await settingsService.updateSetting(chave, valor, descricao);
      return res.json({ success: true, data: setting, message: 'Configuração atualizada' });
    } catch (error) {
      next(error);
    }
  }

  async backup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.triggerBackup();
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listBackups(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const backups = await settingsService.getBackupsList();
      return res.json({ success: true, data: backups });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
