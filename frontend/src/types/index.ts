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

export interface Notificacion {
  id: number;
  destinatario: string;
  asunto: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'ERROR';
  intentos: number;
  fechaEnvio?: string | null;
  fechaUltimoIntento?: string | null;
  error?: string | null;
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
  numeroComprobante?: string;
  pdfPath?: string | null;
  motivoAnulacion?: string | null;
  fechaAnulacion?: string | null;
  fechaLiquidacion: string;
  empleado?: Empleado;
  notificaciones?: Notificacion[];
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionSeguridadSocial {
  porcentajeSeguridadSocial: number;
}

export type RolUsuario = 'ADMIN' | 'RRHH' | 'EMPLEADO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  empleadoId?: number | null;
  activo?: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface DashboardResumen {
  empleados: {
    total: number;
    activos: number;
    inactivos: number;
  };
  periodoSeleccionado: string;
  liquidaciones: {
    totalPeriodo: number;
    calculadas: number;
    anuladas: number;
    pendientes: number;
    totalBruto: number;
    totalBonos: number;
    totalSeguridadSocial: number;
    totalNeto: number;
  };
  notificaciones: {
    total: number;
    enviados: number;
    pendientes: number;
    errores: number;
  };
  ultimasLiquidaciones: Array<{
    id: number;
    empleadoNombre: string;
    periodo: string;
    salarioNeto: number;
    estado: string;
    fecha: string;
    numeroComprobante: string;
  }>;
}

export interface Auditoria {
  id: number;
  usuarioId?: number | null;
  usuario?: {
    nombre: string;
    correo: string;
    rol: string;
  } | null;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  descripcion: string;
  ip?: string | null;
  createdAt: string;
}

export interface ConfiguracionEmpresa {
  id: number;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  correo: string;
  sitioWeb: string;
  logoUrl?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  details?: Array<{ campo: string; mensaje: string }>;
}

