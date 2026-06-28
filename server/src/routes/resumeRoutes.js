import { Router } from 'express';
import { resumeController } from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/auth.js';

export function resumeRoutes(config) {
  const router = Router();
  router.use(requireAuth(config)); // every resume route requires a valid session

  router.get('/', resumeController.list);
  router.get('/:id/file', resumeController.getFile);
  router.post('/render', resumeController.render); // LaTeX → PDF (no :id; uses posted content)
  router.post('/', resumeController.create);
  router.patch('/:id', resumeController.update);
  router.post('/:id/scan', resumeController.recordScan);
  router.post('/:id/activate', resumeController.activate);
  router.delete('/:id', resumeController.remove);

  return router;
}
