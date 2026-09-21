import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('audit.view'), (req, res, next) => auditController.index(req, res, next));

export default router;
