import { request } from './api';
import { HorasTrabajadas, CreateHorasPayload, UpdateHorasPayload } from '../types';

export const horasService = {
  getAll: async (params?: { empleadoId?: number; periodo?: string }): Promise<HorasTrabajadas[]> => {
    const query = new URLSearchParams();
    if (params?.empleadoId) query.append('empleadoId', params.empleadoId.toString());
    if (params?.periodo) query.append('periodo', params.periodo);

    const qs = query.toString();
    return request<HorasTrabajadas[]>(`/horas${qs ? `?${qs}` : ''}`);
  },

  getById: async (id: number): Promise<HorasTrabajadas> => {
    return request<HorasTrabajadas>(`/horas/${id}`);
  },

  create: async (data: CreateHorasPayload): Promise<HorasTrabajadas> => {
    return request<HorasTrabajadas>('/horas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateHorasPayload): Promise<HorasTrabajadas> => {
    return request<HorasTrabajadas>(`/horas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ id: number; message: string }> => {
    return request<{ id: number; message: string }>(`/horas/${id}`, {
      method: 'DELETE',
    });
  },
};
