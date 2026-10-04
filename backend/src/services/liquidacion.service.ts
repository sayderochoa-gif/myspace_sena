import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { formatLiquidacion, FormattedLiquidacion } from '../utils/formatters';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { configuracionService } from './configuracion.service';
import { CreateLiquidacionDTO, PreviewLiquidacionDTO } from '../validators/liquidacion.validator';
import { pdfService } from './pdf.service';
import { emailService } from './email.service';
import { auditoriaService } from './auditoria.service';

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
   */
  calcularSalarioBruto(horasTrabajadas: number, valorHora: number): number {
    if (horasTrabajadas <= 0) {
      throw new BadRequestError('Las horas trabajadas deben ser mayores a cero', 'INVALID_HOURS');
    }
    if (valorHora <= 0) {
      throw new BadRequestError('El valor por hora debe ser mayor a cero', 'INVALID_HOURLY_RATE');
    }

    return Math.round(horasTrabajadas * valorHora);
  }

  /**
   * Calcula el Bono por Hijos según las reglas de negocio estrictas:
   * 0 hijos: $0 | 1 hijo: $250.000 | 2 hijos: $400.000 | >=3 hijos: $600.000
   */
  calcularBonoPorHijos(numeroHijos: number): number {
    if (numeroHijos < 0) {
      throw new BadRequestError('El número de hijos no puede ser negativo', 'INVALID_CHILDREN_COUNT');
    }

    if (numeroHijos === 0) return 0;
    if (numeroHijos === 1) return 250000;
    if (numeroHijos === 2) return 400000;
    return 600000;
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
   * Genera comprobante único, almacena snapshot, crea PDF e inicia despacho de correo
   */
  async crearLiquidacion(
    dto: CreateLiquidacionDTO,
    usuarioId?: number | null,
    ip?: string
  ): Promise<FormattedLiquidacion> {
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

    // 6. Transacción segura en Prisma
    const liquidacionCreada = await prisma.$transaction(async (tx) => {
      // Sincronizar horas trabajadas en horas_trabajadas si no existen
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

      // Generar identificador de comprobante único
      const numeroComprobante = `NOM-${liq.periodo}-${String(liq.id).padStart(6, '0')}`;
      const liqActualizada = await tx.liquidacion.update({
        where: { id: liq.id },
        data: { numeroComprobante },
        include: {
          empleado: {
            include: {
              cargo: true,
            },
          },
        },
      });

      return liqActualizada;
    });

    // 7. Generar PDF automáticamente para el comprobante
    try {
      await pdfService.generarVolantePago(liquidacionCreada.id, usuarioId, ip);
    } catch (pdfErr) {
      console.error('⚠️ Error generando PDF inicial:', pdfErr);
    }

    // 8. Enviar correo automáticamente al empleado (en segundo plano / no bloqueante si falla)
    try {
      await emailService.enviarVolantePorCorreo(liquidacionCreada.id, usuarioId, ip);
    } catch (mailErr) {
      console.error('⚠️ Error despachando correo inicial:', mailErr);
    }

    // 9. Registrar auditoría de creación de liquidación
    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'CREAR_LIQUIDACION',
      entidad: 'LIQUIDACION',
      entidadId: liquidacionCreada.id,
      descripcion: `Liquidada nómina para ${empleado.nombre} ${empleado.apellido} (${dto.periodo}) - Neto: $${salarioNeto.toLocaleString('es-CO')}`,
      ip,
    });

    // Retornar liquidación con sus notificaciones asociadas
    const resultadoCompleto = await this.obtenerLiquidacion(liquidacionCreada.id);
    return resultadoCompleto;
  }

  /**
   * Obtiene una liquidación por su ID con todo el detalle de auditoría y notificaciones
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
        notificaciones: {
          orderBy: { createdAt: 'desc' },
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
        notificaciones: {
          orderBy: { createdAt: 'desc' },
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
   * Anula una liquidación cambiando su estado a ANULADA y registrando el motivo y auditoría
   */
  async anularLiquidacion(
    id: number,
    motivo: string = 'Corrección requerida',
    usuarioId?: number | null,
    ip?: string
  ): Promise<FormattedLiquidacion> {
    const existing = await prisma.liquidacion.findUnique({
      where: { id },
      include: { empleado: true },
    });

    if (!existing) {
      throw new NotFoundError(
        `La liquidación con ID ${id} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    if (existing.estado === 'ANULADA') {
      throw new BadRequestError('La liquidación ya se encuentra anulada', 'ALREADY_ANULADA');
    }

    const anulada = await prisma.liquidacion.update({
      where: { id },
      data: {
        estado: 'ANULADA',
        motivoAnulacion: motivo,
        usuarioAnulacionId: usuarioId ?? null,
        fechaAnulacion: new Date(),
      },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
        notificaciones: true,
      },
    });

    // Regenerar el PDF para reflejar la marca de ANULADA
    try {
      await pdfService.generarVolantePago(id, usuarioId, ip);
    } catch (pdfErr) {
      console.warn('No se pudo regenerar PDF tras anulación:', pdfErr);
    }

    // Registrar en auditoría
    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'ANULAR_LIQUIDACION',
      entidad: 'LIQUIDACION',
      entidadId: id,
      descripcion: `Liquidación #${id} (${existing.periodo}) anulada. Motivo: ${motivo}`,
      ip,
    });

    return formatLiquidacion(anulada);
  }
}

export const liquidacionService = new LiquidacionService();
