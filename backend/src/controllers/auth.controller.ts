import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const result = await authService.login(correo, password, ip);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, { logout: true }, 'Sesión cerrada correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Usuario no autenticado', 401, 'UNAUTHORIZED');
      }

      const perfil = await authService.obtenerPerfil(req.user.id);
      sendSuccess(res, perfil, 'Perfil de usuario obtenido');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
