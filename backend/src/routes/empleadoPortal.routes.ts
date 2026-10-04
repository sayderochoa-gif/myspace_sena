import { Router } from 'express';
import { empleadoPortalController } from '../controllers/empleadoPortal.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas del portal del empleado requieren autenticación
router.use(requireAuth);

// GET /api/empleado/perfil - Obtener perfil del empleado autenticado
router.get('/perfil', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  empleadoPortalController.getPerfil(req, res, next)
);

// GET /api/empleado/liquidaciones - Listar sus propias liquidaciones
router.get('/liquidaciones', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  empleadoPortalController.getLiquidaciones(req, res, next)
);

// GET /api/empleado/liquidaciones/:id/pdf - Descargar comprobante propio en PDF
router.get('/liquidaciones/:id/pdf', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  empleadoPortalController.descargarPdf(req, res, next)
);

export default router;
