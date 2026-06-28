import { Router } from 'express';
import { applicationController } from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/auth.js';

export function applicationRoutes(config) {
  const router = Router();
  router.use(requireAuth(config)); // every application route requires a valid session

  router.get('/', applicationController.list);
  router.post('/', applicationController.create);
  router.patch('/:id', applicationController.update);
  router.delete('/:id', applicationController.remove);

  return router;
}
