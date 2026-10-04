import { Request, Response, NextFunction } from 'express';
import { auditoriaService } from '../services/auditoria.service';
import { sendSuccess } from '../utils/response';

export class AuditoriaController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.query.usuarioId ? parseInt(req.query.usuarioId as string, 10) : undefined;
      const accion = typeof req.query.accion === 'string' ? req.query.accion : undefined;
      const entidad = typeof req.query.entidad === 'string' ? req.query.entidad : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const auditorias = await auditoriaService.obtenerHistorial({
        usuarioId: isNaN(usuarioId as number) ? undefined : usuarioId,
        accion,
        entidad,
        limit,
      });

      sendSuccess(res, auditorias, 'Registros de auditoría obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export const auditoriaController = new AuditoriaController();
