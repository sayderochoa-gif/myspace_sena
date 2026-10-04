import { Request, Response, NextFunction } from 'express';
import { liquidacionService } from '../services/liquidacion.service';
import { sendSuccess } from '../utils/response';

export class LiquidacionController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empleadoId = req.query.empleadoId
        ? parseInt(req.query.empleadoId as string, 10)
        : undefined;
      const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
      const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;

      const liquidaciones = await liquidacionService.listarLiquidaciones({
        empleadoId: isNaN(empleadoId as number) ? undefined : empleadoId,
        periodo,
        estado,
      });

      sendSuccess(res, liquidaciones, 'Liquidaciones obtenidas exitosamente');
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
          message: 'El ID de la liquidación debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const liquidacion = await liquidacionService.obtenerLiquidacion(id);
      sendSuccess(res, liquidacion, 'Detalle de liquidación obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const calculo = await liquidacionService.calcularPrevisualizacion(req.body);
      sendSuccess(res, calculo, 'Cálculo de liquidación generado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nuevaLiquidacion = await liquidacionService.crearLiquidacion(req.body);
      sendSuccess(res, nuevaLiquidacion, 'Liquidación registrada y guardada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async anular(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID de la liquidación debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const liquidacionAnulada = await liquidacionService.anularLiquidacion(id);
      sendSuccess(res, liquidacionAnulada, 'Liquidación anulada exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export const liquidacionController = new LiquidacionController();
