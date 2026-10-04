import { prisma } from '../config/prisma';
import { BadRequestError } from '../utils/errors';
import { auditoriaService } from './auditoria.service';

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
  async setPorcentajeSeguridadSocial(nuevoPorcentaje: number, usuarioId?: number | null, ip?: string): Promise<number> {
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

    const valor = parseFloat(actualizado.valor);

    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'CONFIG_ACTUALIZADA',
      entidad: 'CONFIGURACION',
      descripcion: `Actualizado porcentaje de seguridad social a ${valor}%`,
      ip,
    });

    return valor;
  }

  /**
   * Obtiene la configuración general e institucional de la empresa
   */
  async getEmpresa() {
    let empresa = await prisma.configuracionEmpresa.findFirst();
    if (!empresa) {
      empresa = await prisma.configuracionEmpresa.create({
        data: {
          nombre: 'FinanCorp S.A.',
          nit: '900.123.456-7',
          direccion: 'Calle 72 # 10-34, Bogotá, Colombia',
          telefono: '+57 (1) 745-0000',
          correo: 'nomina@financorp.com',
          sitioWeb: 'www.financorp.com',
        },
      });
    }
    return empresa;
  }

  /**
   * Actualiza los datos corporativos de la empresa
   */
  async updateEmpresa(
    data: {
      nombre?: string;
      nit?: string;
      direccion?: string;
      telefono?: string;
      correo?: string;
      sitioWeb?: string;
    },
    usuarioId?: number | null,
    ip?: string
  ) {
    let empresa = await prisma.configuracionEmpresa.findFirst();
    if (!empresa) {
      empresa = await prisma.configuracionEmpresa.create({
        data: {
          nombre: data.nombre || 'FinanCorp S.A.',
          nit: data.nit || '900.123.456-7',
          direccion: data.direccion || 'Calle 72 # 10-34, Bogotá, Colombia',
          telefono: data.telefono || '+57 (1) 745-0000',
          correo: data.correo || 'nomina@financorp.com',
          sitioWeb: data.sitioWeb || 'www.financorp.com',
        },
      });
    } else {
      empresa = await prisma.configuracionEmpresa.update({
        where: { id: empresa.id },
        data,
      });
    }

    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'CONFIG_ACTUALIZADA',
      entidad: 'CONFIGURACION',
      entidadId: empresa.id,
      descripcion: `Actualizada información corporativa de la empresa: ${empresa.nombre}`,
      ip,
    });

    return empresa;
  }
}

export const configuracionService = new ConfiguracionService();

