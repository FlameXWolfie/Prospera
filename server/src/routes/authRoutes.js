import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { makeAuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

// Throttle credential endpoints to blunt brute-force / abuse.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

export function authRoutes(config) {
  const router = Router();
  const c = makeAuthController(config);

  router.post('/signup', credentialLimiter, c.signup);
  router.post('/login', credentialLimiter, c.login);
  router.post('/google', credentialLimiter, c.google);
  router.get('/me', requireAuth(config), c.me);
  router.post('/logout', c.logout);

  // Authenticated account management.
  router.patch('/me', requireAuth(config), c.updateProfile);
  router.post('/change-password', credentialLimiter, requireAuth(config), c.changePassword);
  router.delete('/me', credentialLimiter, requireAuth(config), c.deleteAccount);

  return router;
}
