import { Router } from 'express';
import { configuracionController } from '../controllers/configuracion.controller';
import { validateRequestBody } from '../validators/empleado.validator';
import { updateConfiguracionSeguridadSchema } from '../validators/liquidacion.validator';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de configuración requieren autenticación
router.use(requireAuth);

// GET /api/configuracion/seguridad-social
router.get('/seguridad-social', (req, res, next) =>
  configuracionController.getSeguridadSocial(req, res, next)
);

// PUT /api/configuracion/seguridad-social (Solo ADMIN)
router.put(
  '/seguridad-social',
  requireRole('ADMIN'),
  validateRequestBody(updateConfiguracionSeguridadSchema),
  (req, res, next) => configuracionController.updateSeguridadSocial(req, res, next)
);

// GET /api/configuracion/empresa
router.get('/empresa', (req, res, next) =>
  configuracionController.getEmpresa(req, res, next)
);

// PUT /api/configuracion/empresa (Solo ADMIN)
router.put('/empresa', requireRole('ADMIN'), (req, res, next) =>
  configuracionController.updateEmpresa(req, res, next)
);

export default router;

