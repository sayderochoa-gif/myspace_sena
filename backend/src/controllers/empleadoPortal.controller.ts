import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { liquidacionService } from '../services/liquidacion.service';
import { pdfService } from '../services/pdf.service';
import { sendSuccess } from '../utils/response';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export class EmpleadoPortalController {
  /**
   * Obtiene la información del perfil del colaborador autenticado
   */
  async getPerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.empleadoId) {
        throw new ForbiddenError('El usuario actual no tiene un registro de empleado asociado');
      }

      const empleado = await prisma.empleado.findUnique({
        where: { id: req.user.empleadoId },
        include: {
          cargo: true,
        },
      });

      if (!empleado) {
        throw new NotFoundError('Registro de colaborador no encontrado');
      }

      sendSuccess(
        res,
        {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          documento: empleado.documento,
          correo: empleado.correo,
          cargo: empleado.cargo.nombre,
          cargoId: empleado.cargoId,
          valorHora: Number(empleado.valorHora),
          numeroHijos: empleado.numeroHijos,
          activo: empleado.activo,
          createdAt: empleado.createdAt.toISOString(),
        },
        'Perfil de empleado obtenido exitosamente'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista exclusivamente las liquidaciones del colaborador autenticado
   */
  async getLiquidaciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.empleadoId) {
        throw new ForbiddenError('El usuario actual no tiene un registro de empleado asociado');
      }

      const liquidaciones = await liquidacionService.listarLiquidaciones({
        empleadoId: req.user.empleadoId,
      });

      sendSuccess(res, liquidaciones, 'Historial de liquidaciones obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Descarga el volante PDF de una liquidación propia
   */
  async descargarPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.empleadoId) {
        throw new ForbiddenError('El usuario actual no tiene un registro de empleado asociado');
      }

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

      if (liquidacion.empleadoId !== req.user.empleadoId) {
        throw new ForbiddenError('Acceso denegado: No puede consultar liquidaciones de otros colaboradores');
      }

      const { filePath, fileName } = await pdfService.obtenerOgenerarPdf(id, req.user.id, req.ip);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(filePath);

    } catch (error) {
      next(error);
    }
  }
}

export const empleadoPortalController = new EmpleadoPortalController();
