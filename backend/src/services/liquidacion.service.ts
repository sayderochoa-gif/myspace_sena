import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { formatLiquidacion, FormattedLiquidacion } from '../utils/formatters';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { configuracionService } from './configuracion.service';
import { CreateLiquidacionDTO, PreviewLiquidacionDTO } from '../validators/liquidacion.validator';

export interface LiquidacionFilterOptions {
  empleadoId?: number;
  periodo?: string;
  estado?: string;
}

export interface CalculoLiquidacionResultado {
  salarioBruto: number;
  bonoHijos: number;
  porcentajeSeguridadSocial: number;
  valorSeguridadSocial: number;
  salarioNeto: number;
}

export interface PrevisualizacionLiquidacion extends CalculoLiquidacionResultado {
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleadoDocumento: string;
  cargoNombre: string;
  periodo: string;
  horasTrabajadas: number;
  valorHora: number;
  numeroHijos: number;
}

export class LiquidacionService {
  /**
   * Calcula el Salario Bruto = Horas Trabajadas * Valor Hora
   * Fuente única de verdad para el cálculo de salario bruto
   */
  calcularSalarioBruto(horasTrabajadas: number, valorHora: number): number {
    if (horasTrabajadas <= 0) {
      throw new BadRequestError('Las horas trabajadas deben ser mayores a cero', 'INVALID_HOURS');
    }
    if (valorHora <= 0) {
      throw new BadRequestError('El valor por hora debe ser mayor a cero', 'INVALID_HOURLY_RATE');
    }

    // Redondear a pesos exactos
    return Math.round(horasTrabajadas * valorHora);
  }

  /**
   * Calcula el Bono por Hijos según las reglas de negocio estrictas:
   * 0 hijos: $0
   * 1 hijo: $250.000
   * 2 hijos: $400.000
   * 3 o más hijos: $600.000
   * Fuente única de verdad
   */
  calcularBonoPorHijos(numeroHijos: number): number {
    if (numeroHijos < 0) {
      throw new BadRequestError('El número de hijos no puede ser negativo', 'INVALID_CHILDREN_COUNT');
    }

    if (numeroHijos === 0) return 0;
    if (numeroHijos === 1) return 250000;
    if (numeroHijos === 2) return 400000;
    return 600000; // 3 o más hijos
  }

  /**
   * Calcula el aporte a Seguridad Social = Salario Bruto * (Porcentaje / 100)
   */
  calcularSeguridadSocial(salarioBruto: number, porcentaje: number): number {
    if (salarioBruto < 0) {
      throw new BadRequestError('El salario bruto no puede ser negativo', 'INVALID_GROSS_SALARY');
    }
    if (porcentaje <= 0 || porcentaje > 100) {
      throw new BadRequestError('El porcentaje de seguridad social debe estar entre 0 y 100', 'INVALID_PERCENTAGE');
    }

    return Math.round(salarioBruto * (porcentaje / 100));
  }

  /**
   * Calcula el Salario Neto = Salario Bruto + Bono Hijos - Seguridad Social
   */
  calcularSalarioNeto(salarioBruto: number, bonoHijos: number, valorSeguridadSocial: number): number {
    return Math.round(salarioBruto + bonoHijos - valorSeguridadSocial);
  }

  /**
   * Genera la previsualización del cálculo de liquidación sin persistir en la base de datos
   */
  async calcularPrevisualizacion(dto: PreviewLiquidacionDTO): Promise<PrevisualizacionLiquidacion> {
    const empleado = await prisma.empleado.findUnique({
      where: { id: dto.empleadoId },
      include: {
        cargo: true,
      },
    });

    if (!empleado) {
      throw new NotFoundError(
        `El empleado con ID ${dto.empleadoId} no existe`,
        'EMPLOYEE_NOT_FOUND'
      );
    }

    if (!empleado.activo) {
      throw new BadRequestError(
        `El empleado "${empleado.nombre} ${empleado.apellido}" se encuentra inactivo y no puede ser liquidado`,
        'INACTIVE_EMPLOYEE'
      );
    }

    const valorHora = Number(empleado.valorHora);
    const numeroHijos = empleado.numeroHijos;
    const porcentajeSeguridadSocial = await configuracionService.getPorcentajeSeguridadSocial();

    const salarioBruto = this.calcularSalarioBruto(dto.horasTrabajadas, valorHora);
    const bonoHijos = this.calcularBonoPorHijos(numeroHijos);
    const valorSeguridadSocial = this.calcularSeguridadSocial(salarioBruto, porcentajeSeguridadSocial);
    const salarioNeto = this.calcularSalarioNeto(salarioBruto, bonoHijos, valorSeguridadSocial);

    return {
      empleadoId: empleado.id,
      empleadoNombre: empleado.nombre,
      empleadoApellido: empleado.apellido,
      empleadoDocumento: empleado.documento,
      cargoNombre: empleado.cargo.nombre,
      periodo: dto.periodo,
      horasTrabajadas: dto.horasTrabajadas,
      valorHora,
      numeroHijos,
      salarioBruto,
      bonoHijos,
      porcentajeSeguridadSocial,
      valorSeguridadSocial,
      salarioNeto,
    };
  }

  /**
   * Crea y guarda una liquidación de nómina de forma transaccional y segura
   * Almacena una copia de los valores históricos utilizados en el cálculo
   */
  async crearLiquidacion(dto: CreateLiquidacionDTO): Promise<FormattedLiquidacion> {
    // 1. Validar existencia del empleado
    const empleado = await prisma.empleado.findUnique({
      where: { id: dto.empleadoId },
      include: {
        cargo: true,
      },
    });

    if (!empleado) {
      throw new NotFoundError(
        `El empleado con ID ${dto.empleadoId} no existe`,
        'EMPLOYEE_NOT_FOUND'
      );
    }

    // 2. Validar que el empleado esté activo
    if (!empleado.activo) {
      throw new BadRequestError(
        `El empleado "${empleado.nombre} ${empleado.apellido}" se encuentra inactivo y no puede ser liquidado`,
        'INACTIVE_EMPLOYEE'
      );
    }

    // 3. Validar unicidad (evitar liquidación duplicada para el mismo empleado en el mismo periodo)
    const existente = await prisma.liquidacion.findUnique({
      where: {
        unique_empleado_periodo_liquidacion: {
          empleadoId: dto.empleadoId,
          periodo: dto.periodo,
        },
      },
    });

    if (existente) {
      throw new ConflictError(
        'El empleado ya tiene una liquidación para este periodo.',
        'DUPLICATE_LIQUIDACION'
      );
    }

    // 4. Obtener datos actuales del empleado y configuración
    const valorHora = Number(empleado.valorHora);
    const numeroHijos = empleado.numeroHijos;
    const cargoNombre = empleado.cargo.nombre;
    const porcentajeSeguridadSocial = await configuracionService.getPorcentajeSeguridadSocial();

    // 5. Cálculos matemáticos en el backend
    const salarioBruto = this.calcularSalarioBruto(dto.horasTrabajadas, valorHora);
    const bonoHijos = this.calcularBonoPorHijos(numeroHijos);
    const valorSeguridadSocial = this.calcularSeguridadSocial(salarioBruto, porcentajeSeguridadSocial);
    const salarioNeto = this.calcularSalarioNeto(salarioBruto, bonoHijos, valorSeguridadSocial);

    // 6. Transacción segura en Prisma para guardar la liquidación y asegurar registro de horas
    const liquidacionCreada = await prisma.$transaction(async (tx) => {
      // Registrar o sincronizar horas trabajadas en horas_trabajadas si no existen
      await tx.horasTrabajadas.upsert({
        where: {
          unique_empleado_periodo_horas: {
            empleadoId: dto.empleadoId,
            periodo: dto.periodo,
          },
        },
        update: {
          horas: new Prisma.Decimal(dto.horasTrabajadas),
        },
        create: {
          empleadoId: dto.empleadoId,
          periodo: dto.periodo,
          horas: new Prisma.Decimal(dto.horasTrabajadas),
        },
      });

      // Crear la liquidación con la copia exacta de los valores históricos
      const liq = await tx.liquidacion.create({
        data: {
          empleadoId: dto.empleadoId,
          periodo: dto.periodo,
          horasTrabajadas: new Prisma.Decimal(dto.horasTrabajadas),
          valorHora: new Prisma.Decimal(valorHora),
          numeroHijos,
          cargoNombre,
          salarioBruto: new Prisma.Decimal(salarioBruto),
          bonoHijos: new Prisma.Decimal(bonoHijos),
          porcentajeSeguridadSocial: new Prisma.Decimal(porcentajeSeguridadSocial),
          valorSeguridadSocial: new Prisma.Decimal(valorSeguridadSocial),
          salarioNeto: new Prisma.Decimal(salarioNeto),
          estado: 'CALCULADA',
          fechaLiquidacion: new Date(),
        },
        include: {
          empleado: {
            include: {
              cargo: true,
            },
          },
        },
      });

      return liq;
    });

    return formatLiquidacion(liquidacionCreada);
  }

  /**
   * Obtiene una liquidación por su ID con todo el detalle de auditoría
   */
  async obtenerLiquidacion(id: number): Promise<FormattedLiquidacion> {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    if (!liquidacion) {
      throw new NotFoundError(
        `La liquidación con ID ${id} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    return formatLiquidacion(liquidacion);
  }

  /**
   * Lista liquidaciones con filtros opcionales por empleado, periodo y estado
   */
  async listarLiquidaciones(options: LiquidacionFilterOptions = {}): Promise<FormattedLiquidacion[]> {
    const { empleadoId, periodo, estado } = options;

    const whereClause: Prisma.LiquidacionWhereInput = {};

    if (empleadoId) {
      whereClause.empleadoId = empleadoId;
    }

    if (periodo && periodo.trim() !== '') {
      whereClause.periodo = periodo.trim();
    }

    if (estado && estado.trim() !== '') {
      whereClause.estado = estado.trim() as Prisma.EnumEstadoLiquidacionFilter['equals'];
    }

    const liquidaciones = await prisma.liquidacion.findMany({
      where: whereClause,
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
      orderBy: [
        { fechaLiquidacion: 'desc' },
        { id: 'desc' },
      ],
    });

    return liquidaciones.map(formatLiquidacion);
  }

  /**
   * Anula una liquidación cambiando su estado a ANULADA
   */
  async anularLiquidacion(id: number): Promise<FormattedLiquidacion> {
    const existing = await prisma.liquidacion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(
        `La liquidación con ID ${id} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    const anulada = await prisma.liquidacion.update({
      where: { id },
      data: {
        estado: 'ANULADA',
      },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    return formatLiquidacion(anulada);
  }
}

export const liquidacionService = new LiquidacionService();
