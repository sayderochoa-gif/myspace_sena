import { Request, Response, NextFunction } from 'express';
import { liquidacionService } from '../services/liquidacion.service';
import { pdfService } from '../services/pdf.service';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';
import { ForbiddenError } from '../utils/errors';

export class LiquidacionController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let empleadoId = req.query.empleadoId
        ? parseInt(req.query.empleadoId as string, 10)
        : undefined;

      // Si el rol es EMPLEADO, forzar únicamente su propio ID
      if (req.user?.rol === 'EMPLEADO') {
        if (!req.user.empleadoId) {
          throw new ForbiddenError('El usuario colaborador no tiene un perfil de empleado asociado');
        }
        empleadoId = req.user.empleadoId;
      }

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

      // Si es EMPLEADO, validar que la liquidación le pertenezca
      if (req.user?.rol === 'EMPLEADO' && req.user.empleadoId !== liquidacion.empleadoId) {
        throw new ForbiddenError('No tiene autorización para visualizar la liquidación de otro colaborador');
      }

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
      const nuevaLiquidacion = await liquidacionService.crearLiquidacion(
        req.body,
        req.user?.id,
        req.ip
      );
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

      const motivo = req.body?.motivo ? String(req.body.motivo).trim() : 'Corrección administrativa';
      const liquidacionAnulada = await liquidacionService.anularLiquidacion(
        id,
        motivo,
        req.user?.id,
        req.ip
      );
      sendSuccess(res, liquidacionAnulada, 'Liquidación anulada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async descargarPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      if (req.user?.rol === 'EMPLEADO' && req.user.empleadoId !== liquidacion.empleadoId) {
        throw new ForbiddenError('No tiene autorización para descargar el volante de otro colaborador');
      }


      const { filePath, fileName } = await pdfService.obtenerOgenerarPdf(id, req.user?.id, req.ip);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  async enviarCorreo(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const resultado = await emailService.enviarVolantePorCorreo(id, req.user?.id, req.ip);
      sendSuccess(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  }
}

export const liquidacionController = new LiquidacionController();

