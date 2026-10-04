import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

// Regex estricto para validación de correo electrónico
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface CreateEmpleadoDTO {
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  cargoId: number;
  valorHora: number;
  numeroHijos: number;
  activo?: boolean;
}

export interface UpdateEmpleadoDTO {
  nombre?: string;
  apellido?: string;
  documento?: string;
  correo?: string;
  cargoId?: number;
  valorHora?: number;
  numeroHijos?: number;
  activo?: boolean;
}

// Preprocesador para mapear snake_case a camelCase antes de validar
function preprocessEmpleadoData(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return {};
  const obj = data as Record<string, unknown>;

  const cargoId = obj.cargoId ?? obj.cargo_id;
  const valorHora = obj.valorHora ?? obj.valor_hora;
  const numeroHijos = obj.numeroHijos ?? obj.numero_hijos;

  const result: Record<string, unknown> = { ...obj };

  if (cargoId !== undefined) {
    result.cargoId = typeof cargoId === 'string' ? Number(cargoId) : cargoId;
  }
  if (valorHora !== undefined) {
    result.valorHora = typeof valorHora === 'string' ? Number(valorHora) : valorHora;
  }
  if (numeroHijos !== undefined) {
    result.numeroHijos = typeof numeroHijos === 'string' ? Number(numeroHijos) : numeroHijos;
  }

  return result;
}

export const createEmpleadoSchema = z.preprocess(
  preprocessEmpleadoData,
  z.object({
    nombre: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(1, 'El nombre no puede estar vacío')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    apellido: z
      .string({ required_error: 'El apellido es obligatorio' })
      .trim()
      .min(1, 'El apellido no puede estar vacío')
      .max(100, 'El apellido no puede exceder 100 caracteres'),
    documento: z
      .string({ required_error: 'El documento es obligatorio' })
      .trim()
      .min(1, 'El documento no puede estar vacío')
      .max(50, 'El documento no puede exceder 50 caracteres'),
    correo: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .trim()
      .toLowerCase()
      .regex(emailRegex, 'El correo electrónico no tiene un formato válido (ejemplo: empleado@empresa.com)'),
    cargoId: z
      .number({ required_error: 'El cargo es obligatorio', invalid_type_error: 'El ID de cargo debe ser numérico' })
      .int('El ID de cargo debe ser un número entero')
      .positive('El ID de cargo debe ser positivo'),
    valorHora: z
      .number({ required_error: 'El valor por hora es obligatorio', invalid_type_error: 'El valor por hora debe ser numérico' })
      .positive('El valor por hora debe ser mayor a 0'),
    numeroHijos: z
      .number({ invalid_type_error: 'El número de hijos debe ser un valor numérico' })
      .int('El número de hijos debe ser un número entero')
      .min(0, 'El número de hijos no puede ser negativo')
      .default(0),
    activo: z.boolean().default(true).optional(),
  })
);

export const updateEmpleadoSchema = z.preprocess(
  preprocessEmpleadoData,
  z.object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre no puede estar vacío')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),
    apellido: z
      .string()
      .trim()
      .min(1, 'El apellido no puede estar vacío')
      .max(100, 'El apellido no puede exceder 100 caracteres')
      .optional(),
    documento: z
      .string()
      .trim()
      .min(1, 'El documento no puede estar vacío')
      .max(50, 'El documento no puede exceder 50 caracteres')
      .optional(),
    correo: z
      .string()
      .trim()
      .toLowerCase()
      .regex(emailRegex, 'El correo electrónico no tiene un formato válido (ejemplo: empleado@empresa.com)')
      .optional(),
    cargoId: z
      .number({ invalid_type_error: 'El ID de cargo debe ser numérico' })
      .int('El ID de cargo debe ser un número entero')
      .positive('El ID de cargo debe ser positivo')
      .optional(),
    valorHora: z
      .number({ invalid_type_error: 'El valor por hora debe ser numérico' })
      .positive('El valor por hora debe ser mayor a 0')
      .optional(),
    numeroHijos: z
      .number({ invalid_type_error: 'El número de hijos debe ser un valor numérico' })
      .int('El número de hijos debe ser un número entero')
      .min(0, 'El número de hijos no puede ser negativo')
      .optional(),
    activo: z.boolean().optional(),
  })
);

/**
 * Middleware para validar el cuerpo de una petición contra un esquema Zod
 */
export function validateRequestBody(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message,
      }));
      const firstMessage = formattedErrors[0]?.mensaje || 'Error de validación en los datos enviados';
      return next(new ValidationError(firstMessage, formattedErrors));
    }
    req.body = result.data;
    next();
  };
}
