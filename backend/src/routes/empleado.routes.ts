import { Router } from 'express';
import { empleadoController } from '../controllers/empleado.controller';
import {
  createEmpleadoSchema,
  updateEmpleadoSchema,
  validateRequestBody,
} from '../validators/empleado.validator';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de gestión de empleados requieren autenticación y rol ADMIN o RRHH
router.use(requireAuth, requireRole('ADMIN', 'RRHH'));

// GET /api/empleados - Obtener todos los empleados (con filtros opcionales)
router.get('/', (req, res, next) => empleadoController.getAll(req, res, next));


// GET /api/empleados/:id - Obtener un empleado por ID
router.get('/:id', (req, res, next) => empleadoController.getById(req, res, next));

// POST /api/empleados - Crear un nuevo empleado (con validaciones de esquema)
router.post('/', validateRequestBody(createEmpleadoSchema), (req, res, next) =>
  empleadoController.create(req, res, next)
);

// PUT /api/empleados/:id - Actualizar empleado existente
router.put('/:id', validateRequestBody(updateEmpleadoSchema), (req, res, next) =>
  empleadoController.update(req, res, next)
);

// DELETE /api/empleados/:id - Eliminación lógica (desactivar empleado)
router.delete('/:id', (req, res, next) => empleadoController.deactivate(req, res, next));

export default router;
