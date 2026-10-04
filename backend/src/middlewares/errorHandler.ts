import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Manejo de errores operacionales controlados (AppError)
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.details);
  }

  // Manejo de errores específicos de Prisma ORM
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Error de restricción única violada
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(', ')
        : (err.meta?.target as string) || 'campo único';
      
      let message = `Ya existe un registro con ese valor en: ${target}`;
      let errorCode = 'DUPLICATE_ENTRY';

      if (target.includes('documento')) {
        message = 'El documento ya está registrado';
        errorCode = 'DUPLICATE_DOCUMENT';
      } else if (target.includes('correo')) {
        message = 'El correo electrónico ya está registrado';
        errorCode = 'DUPLICATE_EMAIL';
      }

      return sendError(res, message, 409, errorCode);
    }

    // P2025: Registro no encontrado
    if (err.code === 'P2025') {
      return sendError(res, 'El registro solicitado no fue encontrado en la base de datos', 404, 'NOT_FOUND');
    }

    // P2003: Llave foránea inválida
    if (err.code === 'P2003') {
      return sendError(res, 'Referencia foránea inválida o inexistente', 400, 'FOREIGN_KEY_VIOLATION');
    }
  }

  // Error de sintaxis en JSON entrante
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    return sendError(res, 'El formato JSON enviado en el cuerpo de la petición no es válido', 400, 'INVALID_JSON');
  }

  // Error inesperado de servidor (500)
  // Registramos el detalle técnico en logs pero NO exponemos la traza interna al cliente
  console.error('💥 [INTERNAL_SERVER_ERROR]:', err);

  return sendError(
    res,
    'Ocurrió un error interno en el servidor. Por favor, intente más tarde.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
}
