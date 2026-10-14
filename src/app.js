const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { pool, config, initDb } = require('./config');
const authRoutes = require('./auth');
const { audit } = require('./middleware');

async function buildServer() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, ts: new Date().toISOString() });
    } catch {
      res.status(500).json({ ok: false });
    }
  });

  app.get('/', (_req, res) => {
    res.json({
      name: 'Meqraah Imam Al-Jazari API',
      version: '1.0.0',
      languages: ['ar', 'en', 'am'],
      contact: {
        email: 'khdahd241@gmail.com',
        telegram: '@aljezer_241',
        bot: '@meqraa_imamaljezery_bot',
      },
    });
  });

  app.use('/auth', authRoutes);

  app.use((err, _req, res, _next) => {
    console.error('[express]', err.message);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}

async function main() {
  if (!config.jwtSecret || config.jwtSecret === 'dev_secret_change_me') {
    console.warn('[warn] JWT_SECRET not set — do not use in production');
  }

  await initDb();
  await audit(null, 'server.start', 'system', null, { env: config.env }, null);

  const app = await buildServer();

  const server = app.listen(config.port, () => {
    console.log(`[api] listening on :${config.port}`);
  });

  if (config.botToken) {
    try {
      const startBot = require('../bot');
      await startBot();
      console.log('[bot] started');
    } catch (err) {
      console.error('[bot] failed to start:', err.message);
    }
  } else {
    console.warn('[bot] TELEGRAM_BOT_TOKEN not set — bot disabled');
  }

  const shutdown = async (signal) => {
    console.log(`[shutdown] ${signal}`);
    server.close(() => console.log('[api] closed'));
    try { await pool.end(); } catch (_) {}
    setTimeout(() => process.exit(0), 500).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});