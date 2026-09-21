import { Router } from 'express';
import { purchasesController } from './purchases.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('purchases.view'), (req, res, next) => purchasesController.index(req, res, next));
router.get('/:id', requirePermission('purchases.view'), (req, res, next) => purchasesController.show(req, res, next));
router.post('/', requirePermission('purchases.create'), auditMiddleware('COMPRAS', 'CRIAR'), (req, res, next) => purchasesController.store(req, res, next));
router.post('/:id/receive', requirePermission('purchases.approve'), auditMiddleware('COMPRAS', 'RECEBER'), (req, res, next) => purchasesController.receive(req, res, next));

export default router;
