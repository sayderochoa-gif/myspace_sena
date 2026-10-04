export interface Cargo {
  id: number;
  nombre: string;
  valorHoraMinimo: number;
  valorHoraMaximo: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  cargoId: number;
  cargo?: Cargo;
  valorHora: number;
  numeroHijos: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpleadoPayload {
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  cargoId: number;
  valorHora: number;
  numeroHijos: number;
}

export interface UpdateEmpleadoPayload {
  nombre?: string;
  apellido?: string;
  documento?: string;
  correo?: string;
  cargoId?: number;
  valorHora?: number;
  numeroHijos?: number;
  activo?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  details?: Array<{ campo: string; mensaje: string }>;
}
