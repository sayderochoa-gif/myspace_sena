import { Router } from 'express';
import { auditoriaController } from '../controllers/auditoria.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/auditoria - Solo ADMIN
router.get('/', requireAuth, requireRole('ADMIN'), (req, res, next) =>
  auditoriaController.getAll(req, res, next)
);

export default router;
