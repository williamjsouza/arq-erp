import { Router } from 'express';
import { quotesController } from './quotes.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('sales.view'), (req, res, next) => quotesController.index(req, res, next));
router.get('/:id', requirePermission('sales.view'), (req, res, next) => quotesController.show(req, res, next));
router.post('/', requirePermission('sales.create'), auditMiddleware('ORCAMENTOS', 'CRIAR'), (req, res, next) => quotesController.store(req, res, next));
router.put('/:id', requirePermission('sales.edit'), auditMiddleware('ORCAMENTOS', 'EDITAR'), (req, res, next) => quotesController.update(req, res, next));
router.patch('/:id/status', requirePermission('sales.edit'), auditMiddleware('ORCAMENTOS', 'STATUS'), (req, res, next) => quotesController.updateStatus(req, res, next));
router.delete('/:id', requirePermission('sales.delete'), auditMiddleware('ORCAMENTOS', 'EXCLUIR'), (req, res, next) => quotesController.destroy(req, res, next));

export default router;
