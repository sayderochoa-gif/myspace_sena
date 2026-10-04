import { Request, Response, NextFunction } from 'express';
import { horasService } from '../services/horas.service';
import { sendSuccess } from '../utils/response';

export class HorasController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empleadoId = req.query.empleadoId
        ? parseInt(req.query.empleadoId as string, 10)
        : undefined;
      const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;

      const registros = await horasService.getAllHoras({
        empleadoId: isNaN(empleadoId as number) ? undefined : empleadoId,
        periodo,
      });

      sendSuccess(res, registros, 'Registros de horas obtenidos exitosamente');
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
          message: 'El ID del registro de horas debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const registro = await horasService.getHorasById(id);
      sendSuccess(res, registro, 'Registro de horas obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nuevo = await horasService.createHoras(req.body);
      sendSuccess(res, nuevo, 'Horas registradas correctamente', 201);
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
          message: 'El ID del registro de horas debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const actualizado = await horasService.updateHoras(id, req.body);
      sendSuccess(res, actualizado, 'Registro de horas actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID del registro de horas debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const resultado = await horasService.deleteHoras(id);
      sendSuccess(res, resultado, 'Registro de horas eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export const horasController = new HorasController();
