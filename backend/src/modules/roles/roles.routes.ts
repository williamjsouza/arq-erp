import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/permissions', requirePermission('roles.view'), (req, res, next) => rolesController.permissions(req, res, next));
router.get('/', requirePermission('roles.view'), (req, res, next) => rolesController.index(req, res, next));
router.post('/', requirePermission('roles.create'), auditMiddleware('PERFIS', 'CRIAR'), (req, res, next) => rolesController.store(req, res, next));
router.put('/:id', requirePermission('roles.edit'), auditMiddleware('PERFIS', 'EDITAR'), (req, res, next) => rolesController.update(req, res, next));

export default router;
