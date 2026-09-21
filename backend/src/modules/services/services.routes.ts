import { Router } from 'express';
import { servicesController } from './services.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('services.view'), (req, res, next) => servicesController.index(req, res, next));
router.get('/:id', requirePermission('services.view'), (req, res, next) => servicesController.show(req, res, next));
router.post('/', requirePermission('services.create'), auditMiddleware('SERVICOS', 'CRIAR'), (req, res, next) => servicesController.store(req, res, next));
router.put('/:id', requirePermission('services.edit'), auditMiddleware('SERVICOS', 'EDITAR'), (req, res, next) => servicesController.update(req, res, next));
router.delete('/:id', requirePermission('services.delete'), auditMiddleware('SERVICOS', 'EXCLUIR'), (req, res, next) => servicesController.destroy(req, res, next));

export default router;
