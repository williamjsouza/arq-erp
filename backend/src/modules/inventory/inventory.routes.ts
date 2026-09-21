import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/low-stock', requirePermission('inventory.view'), (req, res, next) => inventoryController.lowStock(req, res, next));
router.get('/kardex', requirePermission('inventory.view'), (req, res, next) => inventoryController.index(req, res, next));
router.post('/move', requirePermission('inventory.create'), auditMiddleware('ESTOQUE', 'MOVIMENTAR'), (req, res, next) => inventoryController.store(req, res, next));

export default router;
