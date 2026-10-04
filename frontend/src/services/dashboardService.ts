import { request } from './api';
import { DashboardResumen } from '../types';

export const dashboardService = {
  async getResumen(periodo?: string): Promise<DashboardResumen> {
    const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    return request<DashboardResumen>(`/dashboard/resumen${query}`);
  },
};
