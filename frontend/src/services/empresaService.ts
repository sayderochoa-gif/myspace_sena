import { request } from './api';
import { ConfiguracionEmpresa } from '../types';

export const empresaService = {
  async getEmpresa(): Promise<ConfiguracionEmpresa> {
    return request<ConfiguracionEmpresa>('/configuracion/empresa');
  },

  async updateEmpresa(data: Partial<ConfiguracionEmpresa>): Promise<ConfiguracionEmpresa> {
    return request<ConfiguracionEmpresa>('/configuracion/empresa', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
