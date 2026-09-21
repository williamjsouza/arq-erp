import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('customers.view'), (req, res, next) => customersController.index(req, res, next));
router.get('/:id', requirePermission('customers.view'), (req, res, next) => customersController.show(req, res, next));
router.post('/', requirePermission('customers.create'), auditMiddleware('CLIENTES', 'CRIAR'), (req, res, next) => customersController.store(req, res, next));
router.put('/:id', requirePermission('customers.edit'), auditMiddleware('CLIENTES', 'EDITAR'), (req, res, next) => customersController.update(req, res, next));
router.delete('/:id', requirePermission('customers.delete'), auditMiddleware('CLIENTES', 'EXCLUIR'), (req, res, next) => customersController.destroy(req, res, next));

export default router;
