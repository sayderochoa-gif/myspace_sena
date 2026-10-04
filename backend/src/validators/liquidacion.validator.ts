import { z } from 'zod';
import { PERIODO_REGEX, MIN_HORAS_TRABAJADAS, MAX_HORAS_TRABAJADAS } from './horas.validator';

export interface CreateLiquidacionDTO {
  empleadoId: number;
  periodo: string;
  horasTrabajadas: number;
}

export interface PreviewLiquidacionDTO {
  empleadoId: number;
  periodo: string;
  horasTrabajadas: number;
}

function preprocessLiquidacionData(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return {};
  const obj = data as Record<string, unknown>;

  const empleadoId = obj.empleadoId ?? obj.empleado_id;
  const horasTrabajadas = obj.horasTrabajadas ?? obj.horas_trabajadas ?? obj.horas;

  const result: Record<string, unknown> = { ...obj };

  if (empleadoId !== undefined) {
    result.empleadoId = typeof empleadoId === 'string' ? Number(empleadoId) : empleadoId;
  }
  if (horasTrabajadas !== undefined) {
    result.horasTrabajadas = typeof horasTrabajadas === 'string' ? Number(horasTrabajadas) : horasTrabajadas;
  }

  return result;
}

export const createLiquidacionSchema = z.preprocess(
  preprocessLiquidacionData,
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
    horasTrabajadas: z
      .number({
        required_error: 'Las horas trabajadas son obligatorias',
        invalid_type_error: 'Las horas trabajadas deben ser un valor numérico',
      })
      .min(MIN_HORAS_TRABAJADAS, 'Las horas trabajadas deben ser mayores a 0')
      .max(MAX_HORAS_TRABAJADAS, `Las horas trabajadas no pueden superar ${MAX_HORAS_TRABAJADAS} horas mensuales`),
  })
);

export const previewLiquidacionSchema = createLiquidacionSchema;

export const updateConfiguracionSeguridadSchema = z.object({
  porcentaje: z
    .number({
      required_error: 'El porcentaje de seguridad social es obligatorio',
      invalid_type_error: 'El porcentaje debe ser un valor numérico',
    })
    .positive('El porcentaje debe ser mayor a 0')
    .max(100, 'El porcentaje no puede ser superior al 100%'),
});
