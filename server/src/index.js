import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, assertConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import { authRoutes } from './routes/authRoutes.js';
import { resumeRoutes } from './routes/resumeRoutes.js';
import { applicationRoutes } from './routes/applicationRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

function createApp() {
  const app = express();
  // We run behind exactly one proxy (Vite dev proxy / a single reverse proxy in
  // prod). Trusting one hop lets express-rate-limit key on the real client IP
  // via X-Forwarded-For instead of lumping everyone under the proxy's IP.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '15mb' })); // generous — resume PDFs are sent base64 to /api/ai/parse-resume

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use('/api/auth', authRoutes(config));
  app.use('/api/resumes', resumeRoutes(config));
  app.use('/api/applications', applicationRoutes(config));
  app.use('/api/ai', aiRoutes(config));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function start() {
  try {
    assertConfig();
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }

  try {
    await connectDB(config.mongoUri);
    console.log('[db] connected to MongoDB');
  } catch (err) {
    console.error('[db] could not connect to MongoDB:', err.message);
    console.error('     Is mongod running? Check MONGODB_URI in server/.env.');
    process.exit(1);
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port}`);
    console.log(`[server] Google sign-in ${config.googleClientId ? 'enabled' : 'disabled (set GOOGLE_CLIENT_ID to enable)'}`);
    console.log(`[server] Mistral AI ${config.mistralApiKey ? `enabled (${config.mistralModel})` : 'disabled (set MISTRAL_API_KEY to enable)'}`);
  });
}

start();
