import { Request, Response, NextFunction } from 'express';
import { configuracionService } from '../services/configuracion.service';
import { sendSuccess } from '../utils/response';

export class ConfiguracionController {
  async getSeguridadSocial(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const porcentaje = await configuracionService.getPorcentajeSeguridadSocial();
      sendSuccess(
        res,
        { porcentajeSeguridadSocial: porcentaje },
        'Configuración de seguridad social obtenida exitosamente'
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSeguridadSocial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const porcentajeNum = Number(req.body.porcentaje ?? req.body.porcentajeSeguridadSocial);
      const porcentajeActualizado = await configuracionService.setPorcentajeSeguridadSocial(porcentajeNum);
      sendSuccess(
        res,
        { porcentajeSeguridadSocial: porcentajeActualizado },
        'Porcentaje de seguridad social actualizado exitosamente'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const configuracionController = new ConfiguracionController();
