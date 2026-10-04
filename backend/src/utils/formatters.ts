import { Cargo, Empleado, HorasTrabajadas, Liquidacion, EstadoLiquidacion } from '@prisma/client';

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
  fechaLiquidacion: string;
  empleado?: FormattedEmpleado;
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
  liq: Liquidacion & { empleado?: (Empleado & { cargo?: Cargo | null }) | null }
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
    fechaLiquidacion: liq.fechaLiquidacion.toISOString(),
    empleado: liq.empleado ? formatEmpleado(liq.empleado) : undefined,
    createdAt: liq.createdAt.toISOString(),
    updatedAt: liq.updatedAt.toISOString(),
  };
}
