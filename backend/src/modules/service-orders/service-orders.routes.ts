import { Router } from 'express';
import { serviceOrdersController } from './service-orders.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('service_orders.view'), (req, res, next) => serviceOrdersController.index(req, res, next));
router.get('/:id', requirePermission('service_orders.view'), (req, res, next) => serviceOrdersController.show(req, res, next));
router.post('/', requirePermission('service_orders.create'), auditMiddleware('ORDENS_SERVICO', 'CRIAR'), (req, res, next) => serviceOrdersController.store(req, res, next));
router.patch('/:id/status', requirePermission('service_orders.edit'), auditMiddleware('ORDENS_SERVICO', 'ALTERAR_STATUS'), (req, res, next) => serviceOrdersController.updateStatus(req, res, next));

export default router;
