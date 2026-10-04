import { request } from './api';
import {
  Empleado,
  CreateEmpleadoPayload,
  UpdateEmpleadoPayload,
} from '../types';

export interface EmpleadoQueryParams {
  search?: string;
  cargoId?: number;
  activo?: boolean | 'all';
}

export const empleadoService = {
  /**
   * Obtiene la lista de empleados con filtros opcionales
   */
  async getEmpleados(params: EmpleadoQueryParams = {}): Promise<Empleado[]> {
    const searchParams = new URLSearchParams();

    if (params.search && params.search.trim()) {
      searchParams.append('search', params.search.trim());
    }
    if (params.cargoId) {
      searchParams.append('cargoId', params.cargoId.toString());
    }
    if (params.activo !== undefined) {
      searchParams.append('activo', params.activo.toString());
    }

    const query = searchParams.toString();
    const endpoint = `/empleados${query ? `?${query}` : ''}`;

    return request<Empleado[]>(endpoint);
  },

  /**
   * Obtiene un empleado por su ID
   */
  async getEmpleadoById(id: number): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}`);
  },

  /**
   * Crea un nuevo empleado
   */
  async createEmpleado(payload: CreateEmpleadoPayload): Promise<Empleado> {
    return request<Empleado>('/empleados', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Actualiza los datos de un empleado existente
   */
  async updateEmpleado(
    id: number,
    payload: UpdateEmpleadoPayload
  ): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Desactiva lógicamente a un empleado
   */
  async deactivateEmpleado(id: number): Promise<Empleado> {
    return request<Empleado>(`/empleados/${id}`, {
      method: 'DELETE',
    });
  },
};
