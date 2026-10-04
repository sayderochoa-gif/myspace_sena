import { prisma } from '../config/prisma';
import { BadRequestError } from '../utils/errors';

export const CLAVE_PORCENTAJE_SEGURIDAD_SOCIAL = 'PORCENTAJE_SEGURIDAD_SOCIAL';
export const DEFAULT_PORCENTAJE_SEGURIDAD_SOCIAL = 4.0;

export class ConfiguracionService {
  /**
   * Obtiene el porcentaje de seguridad social configurado en el sistema
   */
  async getPorcentajeSeguridadSocial(): Promise<number> {
    const config = await prisma.configuracionNomina.findUnique({
      where: { clave: CLAVE_PORCENTAJE_SEGURIDAD_SOCIAL },
    });

    if (!config || !config.valor) {
      return DEFAULT_PORCENTAJE_SEGURIDAD_SOCIAL;
    }

    const valorNumerico = parseFloat(config.valor);
    return isNaN(valorNumerico) ? DEFAULT_PORCENTAJE_SEGURIDAD_SOCIAL : valorNumerico;
  }

  /**
   * Actualiza el porcentaje de seguridad social configurable
   * @param nuevoPorcentaje Valor numérico entre 0.01 y 100
   */
  async setPorcentajeSeguridadSocial(nuevoPorcentaje: number): Promise<number> {
    if (typeof nuevoPorcentaje !== 'number' || isNaN(nuevoPorcentaje)) {
      throw new BadRequestError(
        'El porcentaje de seguridad social debe ser un valor numérico válido',
        'INVALID_PERCENTAGE'
      );
    }

    if (nuevoPorcentaje <= 0 || nuevoPorcentaje > 100) {
      throw new BadRequestError(
        'El porcentaje de seguridad social debe ser mayor a 0 y menor o igual a 100',
        'PERCENTAGE_OUT_OF_RANGE'
      );
    }

    const actualizado = await prisma.configuracionNomina.upsert({
      where: { clave: CLAVE_PORCENTAJE_SEGURIDAD_SOCIAL },
      update: {
        valor: nuevoPorcentaje.toString(),
      },
      create: {
        clave: CLAVE_PORCENTAJE_SEGURIDAD_SOCIAL,
        valor: nuevoPorcentaje.toString(),
        descripcion: 'Porcentaje de descuento para aportes a seguridad social (versión académica)',
      },
    });

    return parseFloat(actualizado.valor);
  }
}

export const configuracionService = new ConfiguracionService();
