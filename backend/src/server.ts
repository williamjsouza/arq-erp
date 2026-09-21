import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 ERP Backend executando na porta ${PORT} [Env: ${env.NODE_ENV}]`);
  console.log(`🚀 ERP Backend executando em http://localhost:${PORT}`);
  console.log(`🏥 Health Check disponível em http://localhost:${PORT}/api/health`);
});
