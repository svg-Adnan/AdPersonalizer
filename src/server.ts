import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';
import { securityHeaders, sanitizeRequestBody } from './middleware/security.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { initBrowser, closeBrowser } from './services/scraper.js';
import { getDatabase, closeDatabase } from './database/connection.js';
import { runMigrations } from './database/migrations.js';
import personalizeRouter from './routes/personalize.js';
import historyRouter from './routes/history.js';
import previewRouter from './routes/preview.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // 1. Load and validate config
  const config = loadConfig();
  console.log(`⚙️  Config loaded (port: ${config.PORT}, env: ${config.NODE_ENV})`);

  // 2. Initialize database
  getDatabase();
  runMigrations();

  // 3. Initialize Playwright browser
  await initBrowser();

  // 4. Create Express app
  const app = express();

  // 5. Middleware
  app.use(securityHeaders);
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(sanitizeRequestBody);

  // Rate limiter on API routes only
  const limiter = createRateLimiter();
  app.use('/api/', limiter);

  // 6. API Routes
  app.use('/api/personalize', personalizeRouter);
  app.use('/api/history', historyRouter);
  app.use('/preview', previewRouter);

  // 7. Serve static frontend files
  const publicDir = path.resolve(__dirname, '..');
  app.use(express.static(publicDir));

  // 8. Error handler
  app.use(globalErrorHandler);

  // 9. Start server
  const server = app.listen(config.PORT, () => {
    console.log(`\n🚀 AdPersonalizer v2 running on http://localhost:${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Rate limit: ${config.RATE_LIMIT_MAX} req/${config.RATE_LIMIT_WINDOW_MS / 1000}s`);
    console.log('');
  });

  // 10. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close();
    await closeBrowser();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
