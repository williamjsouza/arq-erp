import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/sales', requirePermission('reports.view'), (req, res, next) => reportsController.sales(req, res, next));
router.get('/inventory', requirePermission('reports.view'), (req, res, next) => reportsController.inventory(req, res, next));
router.get('/financial', requirePermission('reports.view'), (req, res, next) => reportsController.financial(req, res, next));

export default router;
