import { Router } from 'express';
import { notificacionController } from '../controllers/notificacion.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/notificaciones - ADMIN y RRHH
router.get('/', requireAuth, requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  notificacionController.getAll(req, res, next)
);

// POST /api/notificaciones/:id/reintentar - ADMIN y RRHH
router.post('/:id/reintentar', requireAuth, requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  notificacionController.reintentar(req, res, next)
);

export default router;
