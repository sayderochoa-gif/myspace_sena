import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { formatHorasTrabajadas, FormattedHorasTrabajadas } from '../utils/formatters';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { CreateHorasDTO, UpdateHorasDTO } from '../validators/horas.validator';

export interface HorasFilterOptions {
  empleadoId?: number;
  periodo?: string;
}

export class HorasService {
  /**
   * Obtiene todos los registros de horas trabajadas con filtros opcionales
   */
  async getAllHoras(options: HorasFilterOptions = {}): Promise<FormattedHorasTrabajadas[]> {
    const { empleadoId, periodo } = options;

    const whereClause: Prisma.HorasTrabajadasWhereInput = {};

    if (empleadoId) {
      whereClause.empleadoId = empleadoId;
    }

    if (periodo && periodo.trim() !== '') {
      whereClause.periodo = periodo.trim();
    }

    const registros = await prisma.horasTrabajadas.findMany({
      where: whereClause,
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
      orderBy: [
        { periodo: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return registros.map(formatHorasTrabajadas);
  }

  /**
   * Obtiene un registro de horas por su ID
   */
  async getHorasById(id: number): Promise<FormattedHorasTrabajadas> {
    const registro = await prisma.horasTrabajadas.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    if (!registro) {
      throw new NotFoundError(`El registro de horas con ID ${id} no existe`, 'HORAS_NOT_FOUND');
    }

    return formatHorasTrabajadas(registro);
  }

  /**
   * Registra las horas trabajadas por un empleado para un periodo
   */
  async createHoras(data: CreateHorasDTO): Promise<FormattedHorasTrabajadas> {
    // 1. Validar que el empleado exista
    const empleado = await prisma.empleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new NotFoundError(
        `El empleado con ID ${data.empleadoId} no existe`,
        'EMPLOYEE_NOT_FOUND'
      );
    }

    // 2. Validar que el empleado esté activo
    if (!empleado.activo) {
      throw new BadRequestError(
        `El empleado "${empleado.nombre} ${empleado.apellido}" se encuentra inactivo y no se le pueden registrar horas`,
        'INACTIVE_EMPLOYEE'
      );
    }

    // 3. Validar si ya existe un registro de horas para este empleado en el periodo
    const existente = await prisma.horasTrabajadas.findUnique({
      where: {
        unique_empleado_periodo_horas: {
          empleadoId: data.empleadoId,
          periodo: data.periodo,
        },
      },
    });

    if (existente) {
      throw new ConflictError(
        `Ya existe un registro de horas para el empleado en el periodo ${data.periodo}. Puede actualizar el registro existente.`,
        'DUPLICATE_HORAS_PERIODO'
      );
    }

    // 4. Crear el registro de horas
    const nuevoRegistro = await prisma.horasTrabajadas.create({
      data: {
        empleadoId: data.empleadoId,
        periodo: data.periodo,
        horas: new Prisma.Decimal(data.horas),
      },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    return formatHorasTrabajadas(nuevoRegistro);
  }

  /**
   * Actualiza un registro de horas existente
   */
  async updateHoras(id: number, data: UpdateHorasDTO): Promise<FormattedHorasTrabajadas> {
    const existing = await prisma.horasTrabajadas.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(
        `El registro de horas con ID ${id} no existe`,
        'HORAS_NOT_FOUND'
      );
    }

    // Si cambia de periodo, validar unicidad
    if (data.periodo && data.periodo !== existing.periodo) {
      const duplicado = await prisma.horasTrabajadas.findUnique({
        where: {
          unique_empleado_periodo_horas: {
            empleadoId: existing.empleadoId,
            periodo: data.periodo,
          },
        },
      });

      if (duplicado && duplicado.id !== id) {
        throw new ConflictError(
          `Ya existe otro registro de horas para el empleado en el periodo ${data.periodo}`,
          'DUPLICATE_HORAS_PERIODO'
        );
      }
    }

    const actualizado = await prisma.horasTrabajadas.update({
      where: { id },
      data: {
        ...(data.horas !== undefined ? { horas: new Prisma.Decimal(data.horas) } : {}),
        ...(data.periodo !== undefined ? { periodo: data.periodo } : {}),
      },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    return formatHorasTrabajadas(actualizado);
  }

  /**
   * Elimina un registro de horas
   */
  async deleteHoras(id: number): Promise<{ id: number; message: string }> {
    const existing = await prisma.horasTrabajadas.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(
        `El registro de horas con ID ${id} no existe`,
        'HORAS_NOT_FOUND'
      );
    }

    await prisma.horasTrabajadas.delete({
      where: { id },
    });

    return {
      id,
      message: 'Registro de horas eliminado exitosamente',
    };
  }
}

export const horasService = new HorasService();
