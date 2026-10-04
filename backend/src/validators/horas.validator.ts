import { z } from 'zod';

export const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
export const MIN_HORAS_TRABAJADAS = 0.01;
export const MAX_HORAS_TRABAJADAS = 300;

export interface CreateHorasDTO {
  empleadoId: number;
  periodo: string;
  horas: number;
}

export interface UpdateHorasDTO {
  horas?: number;
  periodo?: string;
}

function preprocessHorasData(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return {};
  const obj = data as Record<string, unknown>;

  const empleadoId = obj.empleadoId ?? obj.empleado_id;
  const horas = obj.horas ?? obj.horas_trabajadas ?? obj.horasTrabajadas;

  const result: Record<string, unknown> = { ...obj };

  if (empleadoId !== undefined) {
    result.empleadoId = typeof empleadoId === 'string' ? Number(empleadoId) : empleadoId;
  }
  if (horas !== undefined) {
    result.horas = typeof horas === 'string' ? Number(horas) : horas;
  }

  return result;
}

export const createHorasSchema = z.preprocess(
  preprocessHorasData,
  z.object({
    empleadoId: z
      .number({
        required_error: 'El empleado es obligatorio',
        invalid_type_error: 'El ID de empleado debe ser numérico',
      })
      .int('El ID de empleado debe ser un número entero')
      .positive('El ID de empleado debe ser positivo'),
    periodo: z
      .string({
        required_error: 'El periodo es obligatorio',
        invalid_type_error: 'El periodo debe ser una cadena de texto',
      })
      .trim()
      .regex(PERIODO_REGEX, 'El formato del periodo debe ser exactamente YYYY-MM (ejemplo: 2026-09)'),
    horas: z
      .number({
        required_error: 'Las horas trabajadas son obligatorias',
        invalid_type_error: 'Las horas deben ser un valor numérico',
      })
      .min(MIN_HORAS_TRABAJADAS, 'Las horas trabajadas deben ser mayores a 0')
      .max(MAX_HORAS_TRABAJADAS, `Las horas trabajadas no pueden superar ${MAX_HORAS_TRABAJADAS} horas mensuales`),
  })
);

export const updateHorasSchema = z.preprocess(
  preprocessHorasData,
  z.object({
    periodo: z
      .string()
      .trim()
      .regex(PERIODO_REGEX, 'El formato del periodo debe ser exactamente YYYY-MM (ejemplo: 2026-09)')
      .optional(),
    horas: z
      .number({
        invalid_type_error: 'Las horas deben ser un valor numérico',
      })
      .min(MIN_HORAS_TRABAJADAS, 'Las horas trabajadas deben ser mayores a 0')
      .max(MAX_HORAS_TRABAJADAS, `Las horas trabajadas no pueden superar ${MAX_HORAS_TRABAJADAS} horas mensuales`)
      .optional(),
  })
);
