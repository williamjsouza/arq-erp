import { Router } from 'express';
import { agendaController } from './agenda.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/appointments', requirePermission('agenda.view'), (req, res, next) => agendaController.appointments(req, res, next));
router.post('/appointments', requirePermission('agenda.create'), (req, res, next) => agendaController.storeAppointment(req, res, next));

router.get('/tasks', requirePermission('agenda.view'), (req, res, next) => agendaController.tasks(req, res, next));
router.post('/tasks', requirePermission('agenda.create'), (req, res, next) => agendaController.storeTask(req, res, next));
router.patch('/tasks/:id/status', requirePermission('agenda.edit'), (req, res, next) => agendaController.updateTaskStatus(req, res, next));

export default router;
