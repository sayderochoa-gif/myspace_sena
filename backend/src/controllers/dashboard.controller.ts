import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export class DashboardController {
  async getResumen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : undefined;
      const resumen = await dashboardService.obtenerResumen(periodo);
      sendSuccess(res, resumen, 'Resumen de dashboard obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
