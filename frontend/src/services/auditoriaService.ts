import { request } from './api';
import { Auditoria } from '../types';

export const auditoriaService = {
  async getAuditoria(filters?: { usuarioId?: number; accion?: string; entidad?: string }): Promise<Auditoria[]> {
    const params = new URLSearchParams();
    if (filters?.usuarioId) params.append('usuarioId', filters.usuarioId.toString());
    if (filters?.accion) params.append('accion', filters.accion);
    if (filters?.entidad) params.append('entidad', filters.entidad);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Auditoria[]>(`/auditoria${query}`);
  },
};
