import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { prisma } from './config/prisma.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import companiesRoutes from './modules/companies/companies.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import suppliersRoutes from './modules/suppliers/suppliers.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import purchasesRoutes from './modules/purchases/purchases.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import agendaRoutes from './modules/agenda/agenda.routes.js';
import serviceOrdersRoutes from './modules/service-orders/service-orders.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import servicesRoutes from './modules/services/services.routes.js';
import quotesRoutes from './modules/quotes/quotes.routes.js';
import path from 'path';

const app = express();

// Middlewares de Segurança e Sanitização
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.' },
});
app.use('/api/', limiter);

// Endpoint de Healthcheck (Requisito 38)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      database: 'connected',
      version: '1.0.0',
      timestamp: new Date(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
    });
  }
});

// Registro de Rotas dos Módulos
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/service-orders', serviceOrdersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/quotes', quotesRoutes);

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

export default app;
