import { Router } from 'express';
import { salesController } from './sales.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('sales.view'), (req, res, next) => salesController.index(req, res, next));
router.get('/:id', requirePermission('sales.view'), (req, res, next) => salesController.show(req, res, next));
router.post('/', requirePermission('sales.create'), auditMiddleware('VENDAS', 'CRIAR'), (req, res, next) => salesController.store(req, res, next));
router.post('/:id/finalize', requirePermission('sales.approve'), auditMiddleware('VENDAS', 'FATURAR'), (req, res, next) => salesController.finalize(req, res, next));

export default router;
