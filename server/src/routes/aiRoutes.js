import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { aiController } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

// AI calls are more expensive than CRUD — throttle per client.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
});

export function aiRoutes(config) {
  const router = Router();
  router.use(requireAuth(config)); // every AI route requires a valid session

  router.get('/status', aiController.status);
  router.post('/ats-scan', aiLimiter, aiController.atsScan);
  router.post('/enhance', aiLimiter, aiController.enhance);
  router.post('/parse-resume', aiLimiter, aiController.parseResume);

  return router;
}
