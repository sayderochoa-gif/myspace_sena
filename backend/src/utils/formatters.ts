import { Cargo, Empleado, HorasTrabajadas, Liquidacion, EstadoLiquidacion, Notificacion } from '@prisma/client';

export interface FormattedCargo {
  id: number;
  nombre: string;
  valorHoraMinimo: number;
  valorHoraMaximo: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedEmpleado {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  cargoId: number;
  cargo?: FormattedCargo;
  valorHora: number;
  numeroHijos: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedHorasTrabajadas {
  id: number;
  empleadoId: number;
  periodo: string;
  horas: number;
  empleado?: FormattedEmpleado;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedNotificacion {
  id: number;
  destinatario: string;
  asunto: string;
  estado: string;
  intentos: number;
  fechaEnvio?: string | null;
  fechaUltimoIntento?: string | null;
  error?: string | null;
}

export interface FormattedLiquidacion {
  id: number;
  empleadoId: number;
  periodo: string;
  horasTrabajadas: number;
  valorHora: number;
  numeroHijos: number;
  cargoNombre: string;
  salarioBruto: number;
  bonoHijos: number;
  porcentajeSeguridadSocial: number;
  valorSeguridadSocial: number;
  salarioNeto: number;
  estado: EstadoLiquidacion;
  numeroComprobante: string;
  pdfPath?: string | null;
  motivoAnulacion?: string | null;
  fechaAnulacion?: string | null;
  fechaLiquidacion: string;
  empleado?: FormattedEmpleado;
  notificaciones?: FormattedNotificacion[];
  createdAt: string;
  updatedAt: string;
}

export function formatCargo(cargo: Cargo): FormattedCargo {
  return {
    id: cargo.id,
    nombre: cargo.nombre,
    valorHoraMinimo: Number(cargo.valorHoraMinimo),
    valorHoraMaximo: Number(cargo.valorHoraMaximo),
    activo: cargo.activo,
    createdAt: cargo.createdAt.toISOString(),
    updatedAt: cargo.updatedAt.toISOString(),
  };
}

export function formatEmpleado(
  empleado: Empleado & { cargo?: Cargo | null }
): FormattedEmpleado {
  return {
    id: empleado.id,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    documento: empleado.documento,
    correo: empleado.correo,
    cargoId: empleado.cargoId,
    cargo: empleado.cargo ? formatCargo(empleado.cargo) : undefined,
    valorHora: Number(empleado.valorHora),
    numeroHijos: empleado.numeroHijos,
    activo: empleado.activo,
    createdAt: empleado.createdAt.toISOString(),
    updatedAt: empleado.updatedAt.toISOString(),
  };
}

export function formatHorasTrabajadas(
  horas: HorasTrabajadas & { empleado?: (Empleado & { cargo?: Cargo | null }) | null }
): FormattedHorasTrabajadas {
  return {
    id: horas.id,
    empleadoId: horas.empleadoId,
    periodo: horas.periodo,
    horas: Number(horas.horas),
    empleado: horas.empleado ? formatEmpleado(horas.empleado) : undefined,
    createdAt: horas.createdAt.toISOString(),
    updatedAt: horas.updatedAt.toISOString(),
  };
}

export function formatLiquidacion(
  liq: Liquidacion & {
    empleado?: (Empleado & { cargo?: Cargo | null }) | null;
    notificaciones?: Notificacion[];
  }
): FormattedLiquidacion {
  return {
    id: liq.id,
    empleadoId: liq.empleadoId,
    periodo: liq.periodo,
    horasTrabajadas: Number(liq.horasTrabajadas),
    valorHora: Number(liq.valorHora),
    numeroHijos: liq.numeroHijos,
    cargoNombre: liq.cargoNombre,
    salarioBruto: Number(liq.salarioBruto),
    bonoHijos: Number(liq.bonoHijos),
    porcentajeSeguridadSocial: Number(liq.porcentajeSeguridadSocial),
    valorSeguridadSocial: Number(liq.valorSeguridadSocial),
    salarioNeto: Number(liq.salarioNeto),
    estado: liq.estado,
    numeroComprobante: liq.numeroComprobante || `NOM-${liq.periodo}-${String(liq.id).padStart(6, '0')}`,
    pdfPath: liq.pdfPath,
    motivoAnulacion: liq.motivoAnulacion,
    fechaAnulacion: liq.fechaAnulacion ? liq.fechaAnulacion.toISOString() : null,
    fechaLiquidacion: liq.fechaLiquidacion.toISOString(),
    empleado: liq.empleado ? formatEmpleado(liq.empleado) : undefined,
    notificaciones: liq.notificaciones
      ? liq.notificaciones.map((n) => ({
          id: n.id,
          destinatario: n.destinatario,
          asunto: n.asunto,
          estado: n.estado,
          intentos: n.intentos,
          fechaEnvio: n.fechaEnvio ? n.fechaEnvio.toISOString() : null,
          fechaUltimoIntento: n.fechaUltimoIntento ? n.fechaUltimoIntento.toISOString() : null,
          error: n.error,
        }))
      : undefined,
    createdAt: liq.createdAt.toISOString(),
    updatedAt: liq.updatedAt.toISOString(),
  };
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPeriodo(periodo: string): string {
  if (!periodo || !periodo.includes('-')) return periodo;
  const [year, month] = periodo.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const mesIndex = parseInt(month, 10) - 1;
  const mesNombre = meses[mesIndex] || month;
  return `${mesNombre} ${year}`;
}

export function formatDate(dateString: string | Date): string {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

