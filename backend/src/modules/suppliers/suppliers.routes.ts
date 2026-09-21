import { Router } from 'express';
import { suppliersController } from './suppliers.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('suppliers.view'), (req, res, next) => suppliersController.index(req, res, next));
router.get('/:id', requirePermission('suppliers.view'), (req, res, next) => suppliersController.show(req, res, next));
router.post('/', requirePermission('suppliers.create'), auditMiddleware('FORNECEDORES', 'CRIAR'), (req, res, next) => suppliersController.store(req, res, next));
router.put('/:id', requirePermission('suppliers.edit'), auditMiddleware('FORNECEDORES', 'EDITAR'), (req, res, next) => suppliersController.update(req, res, next));
router.delete('/:id', requirePermission('suppliers.delete'), auditMiddleware('FORNECEDORES', 'EXCLUIR'), (req, res, next) => suppliersController.destroy(req, res, next));

export default router;
