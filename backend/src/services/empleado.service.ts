import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { formatEmpleado, FormattedEmpleado } from '../utils/formatters';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { CreateEmpleadoDTO, UpdateEmpleadoDTO } from '../validators/empleado.validator';

export interface EmpleadoFilterOptions {
  search?: string;
  cargoId?: number;
  activo?: boolean | 'all';
}

export class EmpleadoService {
  /**
   * Obtiene todos los empleados con filtros opcionales
   */
  async getAllEmpleados(options: EmpleadoFilterOptions = {}): Promise<FormattedEmpleado[]> {
    const { search, cargoId, activo } = options;

    const whereClause: Prisma.EmpleadoWhereInput = {};

    // Filtro por estado activo/inactivo (por defecto muestra todos o según parámetro)
    if (activo !== 'all' && activo !== undefined) {
      whereClause.activo = activo;
    }

    // Filtro por cargo
    if (cargoId) {
      whereClause.cargoId = cargoId;
    }

    // Búsqueda por texto en nombre, apellido, documento o correo
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      whereClause.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { apellido: { contains: searchTerm, mode: 'insensitive' } },
        { documento: { contains: searchTerm, mode: 'insensitive' } },
        { correo: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const empleados = await prisma.empleado.findMany({
      where: whereClause,
      include: {
        cargo: true,
      },
      orderBy: { id: 'asc' },
    });

    return empleados.map(formatEmpleado);
  }

  /**
   * Obtiene un empleado por su ID
   */
  async getEmpleadoById(id: number): Promise<FormattedEmpleado> {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        cargo: true,
      },
    });

    if (!empleado) {
      throw new NotFoundError(`El empleado con ID ${id} no existe`, 'EMPLOYEE_NOT_FOUND');
    }

    return formatEmpleado(empleado);
  }

  /**
   * Crea un nuevo empleado validando unicidad y rango salarial por cargo
   */
  async createEmpleado(data: CreateEmpleadoDTO): Promise<FormattedEmpleado> {
    // 1. Validar que el cargo existe y está activo
    const cargo = await prisma.cargo.findUnique({
      where: { id: data.cargoId },
    });

    if (!cargo) {
      throw new NotFoundError(
        `El cargo especificado (ID: ${data.cargoId}) no existe`,
        'CARGO_NOT_FOUND'
      );
    }

    if (!cargo.activo) {
      throw new BadRequestError(
        `El cargo seleccionado "${cargo.nombre}" no está activo`,
        'INACTIVE_CARGO'
      );
    }

    // 2. Validar que el valor_hora esté estrictamente dentro del rango permitido para el cargo
    const min = Number(cargo.valorHoraMinimo);
    const max = Number(cargo.valorHoraMaximo);

    if (data.valorHora < min || data.valorHora > max) {
      throw new BadRequestError(
        `El valor por hora ($${data.valorHora.toLocaleString('es-CO')}) debe estar entre $${min.toLocaleString('es-CO')} y $${max.toLocaleString('es-CO')} para el cargo de ${cargo.nombre}`,
        'HOURLY_RATE_OUT_OF_RANGE'
      );
    }

    // 3. Validar unicidad del documento
    const existingDoc = await prisma.empleado.findUnique({
      where: { documento: data.documento },
    });

    if (existingDoc) {
      throw new ConflictError('El documento ya está registrado', 'DUPLICATE_DOCUMENT');
    }

    // 4. Validar unicidad del correo electrónico
    const existingEmail = await prisma.empleado.findUnique({
      where: { correo: data.correo },
    });

    if (existingEmail) {
      throw new ConflictError(
        'El correo electrónico ya está registrado',
        'DUPLICATE_EMAIL'
      );
    }

    // 5. Crear el registro en la base de datos
    const nuevoEmpleado = await prisma.empleado.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        documento: data.documento,
        correo: data.correo,
        cargoId: data.cargoId,
        valorHora: new Prisma.Decimal(data.valorHora),
        numeroHijos: data.numeroHijos,
        activo: data.activo ?? true,
      },
      include: {
        cargo: true,
      },
    });

    return formatEmpleado(nuevoEmpleado);
  }

  /**
   * Actualiza un empleado existente validando unicidad y rangos de cargo si cambian
   */
  async updateEmpleado(id: number, data: UpdateEmpleadoDTO): Promise<FormattedEmpleado> {
    // 1. Verificar existencia del empleado
    const existing = await prisma.empleado.findUnique({
      where: { id },
      include: { cargo: true },
    });

    if (!existing) {
      throw new NotFoundError(`El empleado con ID ${id} no existe`, 'EMPLOYEE_NOT_FOUND');
    }

    // 2. Si se actualiza el documento, validar que no esté en uso por otro empleado
    if (data.documento && data.documento !== existing.documento) {
      const duplicateDoc = await prisma.empleado.findFirst({
        where: {
          documento: data.documento,
          id: { not: id },
        },
      });

      if (duplicateDoc) {
        throw new ConflictError(
          'El documento ya está registrado por otro empleado',
          'DUPLICATE_DOCUMENT'
        );
      }
    }

    // 3. Si se actualiza el correo, validar que no esté en uso por otro empleado
    if (data.correo && data.correo !== existing.correo) {
      const duplicateEmail = await prisma.empleado.findFirst({
        where: {
          correo: data.correo,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        throw new ConflictError(
          'El correo electrónico ya está registrado por otro empleado',
          'DUPLICATE_EMAIL'
        );
      }
    }

    // 4. Validar cargo y rango salarial si cambian cargoId o valorHora
    const targetCargoId = data.cargoId !== undefined ? data.cargoId : existing.cargoId;
    const targetValorHora =
      data.valorHora !== undefined ? data.valorHora : Number(existing.valorHora);

    if (data.cargoId !== undefined || data.valorHora !== undefined) {
      const targetCargo =
        data.cargoId !== undefined && data.cargoId !== existing.cargoId
          ? await prisma.cargo.findUnique({ where: { id: targetCargoId } })
          : existing.cargo;

      if (!targetCargo) {
        throw new NotFoundError(
          `El cargo especificado (ID: ${targetCargoId}) no existe`,
          'CARGO_NOT_FOUND'
        );
      }

      const min = Number(targetCargo.valorHoraMinimo);
      const max = Number(targetCargo.valorHoraMaximo);

      if (targetValorHora < min || targetValorHora > max) {
        throw new BadRequestError(
          `El valor por hora ($${targetValorHora.toLocaleString('es-CO')}) debe estar entre $${min.toLocaleString('es-CO')} y $${max.toLocaleString('es-CO')} para el cargo de ${targetCargo.nombre}`,
          'HOURLY_RATE_OUT_OF_RANGE'
        );
      }
    }

    // 5. Ejecutar la actualización
    const updated = await prisma.empleado.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.apellido !== undefined ? { apellido: data.apellido } : {}),
        ...(data.documento !== undefined ? { documento: data.documento } : {}),
        ...(data.correo !== undefined ? { correo: data.correo } : {}),
        ...(data.cargoId !== undefined ? { cargoId: data.cargoId } : {}),
        ...(data.valorHora !== undefined
          ? { valorHora: new Prisma.Decimal(data.valorHora) }
          : {}),
        ...(data.numeroHijos !== undefined ? { numeroHijos: data.numeroHijos } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
      },
      include: {
        cargo: true,
      },
    });

    return formatEmpleado(updated);
  }

  /**
   * Eliminación lógica (soft delete) cambiando activo = false
   */
  async deactivateEmpleado(id: number): Promise<FormattedEmpleado> {
    const existing = await prisma.empleado.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`El empleado con ID ${id} no existe`, 'EMPLOYEE_NOT_FOUND');
    }

    const deactivated = await prisma.empleado.update({
      where: { id },
      data: {
        activo: false,
      },
      include: {
        cargo: true,
      },
    });

    return formatEmpleado(deactivated);
  }
}

export const empleadoService = new EmpleadoService();
