import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/dashboard/resumen - ADMIN y RRHH
router.get('/resumen', requireAuth, requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  dashboardController.getResumen(req, res, next)
);

export default router;
