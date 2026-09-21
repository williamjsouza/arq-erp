import { Router } from 'express';
import { financeController } from './finance.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Contas a Pagar
router.get('/payable', requirePermission('finance.view'), (req, res, next) => financeController.indexPayable(req, res, next));
router.post('/payable', requirePermission('finance.create'), auditMiddleware('FINANCEIRO', 'CRIAR_PAGAR'), (req, res, next) => financeController.storePayable(req, res, next));
router.post('/payable/:id/pay', requirePermission('finance.approve'), auditMiddleware('FINANCEIRO', 'BAIXAR_PAGAR'), (req, res, next) => financeController.pay(req, res, next));

// Contas a Receber
router.get('/receivable', requirePermission('finance.view'), (req, res, next) => financeController.indexReceivable(req, res, next));
router.post('/receivable', requirePermission('finance.create'), auditMiddleware('FINANCEIRO', 'CRIAR_RECEBER'), (req, res, next) => financeController.storeReceivable(req, res, next));
router.post('/receivable/:id/receive', requirePermission('finance.approve'), auditMiddleware('FINANCEIRO', 'BAIXAR_RECEBER'), (req, res, next) => financeController.receive(req, res, next));

// Fluxo de Caixa e Centros de Custo
router.get('/cash-flow', requirePermission('finance.view'), (req, res, next) => financeController.cashFlow(req, res, next));
router.get('/cost-centers', requirePermission('finance.view'), (req, res, next) => financeController.costCenters(req, res, next));
router.post('/cost-centers', requirePermission('finance.create'), (req, res, next) => financeController.storeCostCenter(req, res, next));

export default router;
