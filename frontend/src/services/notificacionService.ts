import { request } from './api';
import { Notificacion } from '../types';

export const notificacionService = {
  async getAll(params?: { liquidacionId?: number; estado?: string }): Promise<Notificacion[]> {
    const query = new URLSearchParams();
    if (params?.liquidacionId) query.append('liquidacionId', params.liquidacionId.toString());
    if (params?.estado) query.append('estado', params.estado);
    const qs = query.toString();
    return request<Notificacion[]>(`/notificaciones${qs ? `?${qs}` : ''}`);
  },

  async reintentar(id: number): Promise<{ exito: boolean; notificacionId: number; mensaje: string }> {
    return request<{ exito: boolean; notificacionId: number; mensaje: string }>(`/notificaciones/${id}/reintentar`, {
      method: 'POST',
    });
  },
};
