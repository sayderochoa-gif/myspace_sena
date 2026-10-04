import { Router } from 'express';
import { configuracionController } from '../controllers/configuracion.controller';
import { validateRequestBody } from '../validators/empleado.validator';
import { updateConfiguracionSeguridadSchema } from '../validators/liquidacion.validator';

const router = Router();

// GET /api/configuracion/seguridad-social
router.get('/seguridad-social', (req, res, next) =>
  configuracionController.getSeguridadSocial(req, res, next)
);

// PUT /api/configuracion/seguridad-social
router.put('/seguridad-social', validateRequestBody(updateConfiguracionSeguridadSchema), (req, res, next) =>
  configuracionController.updateSeguridadSocial(req, res, next)
);

export default router;
