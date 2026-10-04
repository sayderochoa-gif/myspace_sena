import { request } from './api';
import {
  Liquidacion,
  PrevisualizacionLiquidacion,
  CreateLiquidacionPayload,
  ConfiguracionSeguridadSocial,
} from '../types';

export const liquidacionService = {
  getAll: async (params?: {
    empleadoId?: number;
    periodo?: string;
    estado?: string;
  }): Promise<Liquidacion[]> => {
    const query = new URLSearchParams();
    if (params?.empleadoId) query.append('empleadoId', params.empleadoId.toString());
    if (params?.periodo) query.append('periodo', params.periodo);
    if (params?.estado) query.append('estado', params.estado);

    const qs = query.toString();
    return request<Liquidacion[]>(`/liquidaciones${qs ? `?${qs}` : ''}`);
  },

  getById: async (id: number): Promise<Liquidacion> => {
    return request<Liquidacion>(`/liquidaciones/${id}`);
  },

  calcularPreview: async (data: CreateLiquidacionPayload): Promise<PrevisualizacionLiquidacion> => {
    return request<PrevisualizacionLiquidacion>('/liquidaciones/calcular', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  crear: async (data: CreateLiquidacionPayload): Promise<Liquidacion> => {
    return request<Liquidacion>('/liquidaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  anular: async (id: number): Promise<Liquidacion> => {
    return request<Liquidacion>(`/liquidaciones/${id}/anular`, {
      method: 'PATCH',
    });
  },

  getConfiguracionSeguridadSocial: async (): Promise<ConfiguracionSeguridadSocial> => {
    return request<ConfiguracionSeguridadSocial>('/configuracion/seguridad-social');
  },

  updateConfiguracionSeguridadSocial: async (
    porcentaje: number
  ): Promise<ConfiguracionSeguridadSocial> => {
    return request<ConfiguracionSeguridadSocial>('/configuracion/seguridad-social', {
      method: 'PUT',
      body: JSON.stringify({ porcentaje }),
    });
  },
};
