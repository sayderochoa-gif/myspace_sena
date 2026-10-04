import { request } from './api';
import { Cargo } from '../types';

export const cargoService = {
  /**
   * Obtiene todos los cargos activos disponibles
   */
  async getCargos(): Promise<Cargo[]> {
    return request<Cargo[]>('/cargos');
  },

  /**
   * Obtiene un cargo por su ID
   */
  async getCargoById(id: number): Promise<Cargo> {
    return request<Cargo>(`/cargos/${id}`);
  },
};
