import { Request, Response, NextFunction } from 'express';
import { empleadoService } from '../services/empleado.service';
import { sendSuccess } from '../utils/response';

export class EmpleadoController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const cargoId = req.query.cargoId ? parseInt(req.query.cargoId as string, 10) : undefined;
      
      let activo: boolean | 'all' | undefined = undefined;
      if (req.query.activo === 'true') activo = true;
      else if (req.query.activo === 'false') activo = false;
      else if (req.query.activo === 'all') activo = 'all';

      const empleados = await empleadoService.getAllEmpleados({
        search,
        cargoId: isNaN(cargoId as number) ? undefined : cargoId,
        activo,
      });

      sendSuccess(res, empleados, 'Empleados obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID del empleado debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const empleado = await empleadoService.getEmpleadoById(id);
      sendSuccess(res, empleado, 'Empleado obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nuevoEmpleado = await empleadoService.createEmpleado(req.body);
      sendSuccess(res, nuevoEmpleado, 'Empleado creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID del empleado debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const actualizado = await empleadoService.updateEmpleado(id, req.body);
      sendSuccess(res, actualizado, 'Empleado actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID del empleado debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const desactivado = await empleadoService.deactivateEmpleado(id);
      sendSuccess(res, desactivado, 'Empleado desactivado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export const empleadoController = new EmpleadoController();
