import { Request, Response, NextFunction } from 'express';
import { cargoService } from '../services/cargo.service';
import { sendSuccess } from '../utils/response';

export class CargoController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.all === 'true';
      const cargos = await cargoService.getAllCargos(!includeInactive);
      sendSuccess(res, cargos, 'Cargos obtenidos exitosamente');
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
          message: 'El ID del cargo debe ser un número entero',
          error: 'INVALID_ID',
        });
        return;
      }

      const cargo = await cargoService.getCargoById(id);
      sendSuccess(res, cargo, 'Cargo obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export const cargoController = new CargoController();
