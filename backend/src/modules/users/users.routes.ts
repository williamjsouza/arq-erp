import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('users.view'), (req, res, next) => usersController.index(req, res, next));
router.post('/', requirePermission('users.create'), auditMiddleware('USUÁRIOS', 'CRIAR'), (req, res, next) => usersController.store(req, res, next));
router.put('/:id', requirePermission('users.edit'), auditMiddleware('USUÁRIOS', 'EDITAR'), (req, res, next) => usersController.update(req, res, next));
router.delete('/:id', requirePermission('users.delete'), auditMiddleware('USUÁRIOS', 'EXCLUIR'), (req, res, next) => usersController.destroy(req, res, next));

export default router;
