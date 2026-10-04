import { Cargo, Empleado, Prisma } from '@prisma/client';

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
