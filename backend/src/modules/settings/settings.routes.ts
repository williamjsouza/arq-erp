import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('settings.view'), (req, res, next) => settingsController.index(req, res, next));
router.put('/', requirePermission('settings.edit'), auditMiddleware('CONFIGURAÇÕES', 'ALTERAR'), (req, res, next) => settingsController.update(req, res, next));

router.get('/backups', requirePermission('settings.view'), (req, res, next) => settingsController.listBackups(req, res, next));
router.post('/backups', requirePermission('settings.create'), auditMiddleware('BACKUP', 'CRIAR'), (req, res, next) => settingsController.backup(req, res, next));

export default router;
