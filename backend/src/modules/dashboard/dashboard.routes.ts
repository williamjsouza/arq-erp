import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('dashboard.view'), (req, res, next) => dashboardController.index(req, res, next));

export default router;
