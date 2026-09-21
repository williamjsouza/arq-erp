import { Router } from 'express';
import { crmController } from './crm.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', requirePermission('crm.view'), (req, res, next) => crmController.pipeline(req, res, next));
router.post('/leads', requirePermission('crm.create'), auditMiddleware('CRM', 'CRIAR_LEAD'), (req, res, next) => crmController.store(req, res, next));
router.patch('/leads/:id/stage', requirePermission('crm.edit'), (req, res, next) => crmController.moveStage(req, res, next));
router.patch('/leads/:id/status', requirePermission('crm.edit'), (req, res, next) => crmController.setStatus(req, res, next));

export default router;
