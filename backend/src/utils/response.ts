import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operación realizada con éxito',
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode: string = 'ERROR',
  details?: unknown
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error: errorCode,
    ...(details !== undefined ? { details } : {}),
  };
  return res.status(statusCode).json(response);
}
