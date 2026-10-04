import { Router } from 'express';
import { liquidacionController } from '../controllers/liquidacion.controller';
import { validateRequestBody } from '../validators/empleado.validator';
import { createLiquidacionSchema, previewLiquidacionSchema } from '../validators/liquidacion.validator';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las operaciones de liquidación requieren autenticación
router.use(requireAuth);

// GET /api/liquidaciones - Listar liquidaciones con filtros (empleadoId, periodo, estado)
router.get('/', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  liquidacionController.getAll(req, res, next)
);

// GET /api/liquidaciones/:id - Consultar detalle de una liquidación específica
router.get('/:id', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  liquidacionController.getById(req, res, next)
);

// GET /api/liquidaciones/:id/pdf - Descargar comprobante PDF
router.get('/:id/pdf', requireRole('ADMIN', 'RRHH', 'EMPLEADO'), (req, res, next) =>
  liquidacionController.descargarPdf(req, res, next)
);

// POST /api/liquidaciones/:id/enviar - Reenviar comprobante por correo electrónico
router.post('/:id/enviar', requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  liquidacionController.enviarCorreo(req, res, next)
);

// POST /api/liquidaciones/calcular - Previsualización de cálculo sin guardar
router.post(
  '/calcular',
  requireRole('ADMIN', 'RRHH'),
  validateRequestBody(previewLiquidacionSchema),
  (req, res, next) => liquidacionController.preview(req, res, next)
);

// POST /api/liquidaciones - Crear y confirmar liquidación definitiva
router.post(
  '/',
  requireRole('ADMIN', 'RRHH'),
  validateRequestBody(createLiquidacionSchema),
  (req, res, next) => liquidacionController.create(req, res, next)
);

// PATCH y POST /api/liquidaciones/:id/anular - Anular liquidación con justificación
router.patch('/:id/anular', requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  liquidacionController.anular(req, res, next)
);
router.post('/:id/anular', requireRole('ADMIN', 'RRHH'), (req, res, next) =>
  liquidacionController.anular(req, res, next)
);

export default router;

