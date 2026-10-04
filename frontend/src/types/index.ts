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

// ----------------------------------------------------------------------
// TIPOS DE LA PARTE 2: HORAS TRABAJADAS Y LIQUIDACIÓN
// ----------------------------------------------------------------------

export type EstadoLiquidacion = 'PENDIENTE' | 'CALCULADA' | 'ANULADA';

export interface HorasTrabajadas {
  id: number;
  empleadoId: number;
  periodo: string;
  horas: number;
  empleado?: Empleado;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHorasPayload {
  empleadoId: number;
  periodo: string;
  horas: number;
}

export interface UpdateHorasPayload {
  horas?: number;
  periodo?: string;
}

export interface PrevisualizacionLiquidacion {
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleadoDocumento: string;
  cargoNombre: string;
  periodo: string;
  horasTrabajadas: number;
  valorHora: number;
  numeroHijos: number;
  salarioBruto: number;
  bonoHijos: number;
  porcentajeSeguridadSocial: number;
  valorSeguridadSocial: number;
  salarioNeto: number;
}

export interface CreateLiquidacionPayload {
  empleadoId: number;
  periodo: string;
  horasTrabajadas: number;
}

export interface Liquidacion {
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
  empleado?: Empleado;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionSeguridadSocial {
  porcentajeSeguridadSocial: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  details?: Array<{ campo: string; mensaje: string }>;
}
