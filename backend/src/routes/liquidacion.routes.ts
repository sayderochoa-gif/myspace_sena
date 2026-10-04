import { Router } from 'express';
import { liquidacionController } from '../controllers/liquidacion.controller';
import { validateRequestBody } from '../validators/empleado.validator';
import { createLiquidacionSchema, previewLiquidacionSchema } from '../validators/liquidacion.validator';

const router = Router();

// GET /api/liquidaciones - Listar liquidaciones con filtros (empleadoId, periodo, estado)
router.get('/', (req, res, next) => liquidacionController.getAll(req, res, next));

// GET /api/liquidaciones/:id - Consultar detalle de una liquidación específica
router.get('/:id', (req, res, next) => liquidacionController.getById(req, res, next));

// POST /api/liquidaciones/calcular - Previsualización de cálculo sin guardar
router.post('/calcular', validateRequestBody(previewLiquidacionSchema), (req, res, next) =>
  liquidacionController.preview(req, res, next)
);

// POST /api/liquidaciones - Crear y confirmar liquidación definitiva
router.post('/', validateRequestBody(createLiquidacionSchema), (req, res, next) =>
  liquidacionController.create(req, res, next)
);

// PATCH /api/liquidaciones/:id/anular - Anular liquidación
router.patch('/:id/anular', (req, res, next) => liquidacionController.anular(req, res, next));

export default router;
