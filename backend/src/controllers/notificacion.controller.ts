import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';

export class NotificacionController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const liquidacionId = req.query.liquidacionId
        ? parseInt(req.query.liquidacionId as string, 10)
        : undefined;
      const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;

      const notificaciones = await emailService.listarNotificaciones({
        liquidacionId: isNaN(liquidacionId as number) ? undefined : liquidacionId,
        estado,
      });

      sendSuccess(res, notificaciones, 'Notificaciones obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async reintentar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'El ID de la notificación debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const resultado = await emailService.reintentarEnvio(id, req.user?.id, ip);

      sendSuccess(res, resultado, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  }
}

export const notificacionController = new NotificacionController();
