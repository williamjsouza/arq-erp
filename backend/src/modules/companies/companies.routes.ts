import { Router } from 'express';
import { companiesController } from './companies.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/current', requirePermission('settings.view'), (req, res, next) => companiesController.current(req, res, next));
router.put('/current', requirePermission('settings.edit'), auditMiddleware('EMPRESAS', 'EDITAR'), (req, res, next) => companiesController.updateCurrent(req, res, next));

router.get('/', requirePermission('settings.view'), (req, res, next) => companiesController.index(req, res, next));
router.get('/:id', requirePermission('settings.view'), (req, res, next) => companiesController.show(req, res, next));
router.put('/:id', requirePermission('settings.edit'), auditMiddleware('EMPRESAS', 'EDITAR'), (req, res, next) => companiesController.update(req, res, next));

export default router;
