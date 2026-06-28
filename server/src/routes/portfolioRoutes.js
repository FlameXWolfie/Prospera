import { Router } from 'express';
import { portfolioController } from '../controllers/portfolioController.js';
import { requireAuth } from '../middleware/auth.js';

export function portfolioRoutes(config) {
  const router = Router();
  router.use(requireAuth(config)); // every portfolio route requires a valid session

  router.get('/', portfolioController.getMine);
  router.put('/', portfolioController.save);

  return router;
}
