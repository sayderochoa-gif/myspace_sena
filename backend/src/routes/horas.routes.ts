import { Router } from 'express';
import { horasController } from '../controllers/horas.controller';
import { validateRequestBody } from '../validators/empleado.validator';
import { createHorasSchema, updateHorasSchema } from '../validators/horas.validator';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de registro de horas requieren autenticación y rol ADMIN o RRHH
router.use(requireAuth, requireRole('ADMIN', 'RRHH'));

// GET /api/horas - Listar registros con filtros opcionales (empleadoId, periodo)
router.get('/', (req, res, next) => horasController.getAll(req, res, next));


// GET /api/horas/:id - Consultar registro específico
router.get('/:id', (req, res, next) => horasController.getById(req, res, next));

// POST /api/horas - Registrar horas trabajadas
router.post('/', validateRequestBody(createHorasSchema), (req, res, next) =>
  horasController.create(req, res, next)
);

// PUT /api/horas/:id - Actualizar registro de horas
router.put('/:id', validateRequestBody(updateHorasSchema), (req, res, next) =>
  horasController.update(req, res, next)
);

// DELETE /api/horas/:id - Eliminar registro de horas
router.delete('/:id', (req, res, next) => horasController.delete(req, res, next));

export default router;
