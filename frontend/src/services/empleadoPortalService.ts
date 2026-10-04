import { request, downloadFile } from './api';
import { Empleado, Liquidacion } from '../types';

export const empleadoPortalService = {
  async getPerfil(): Promise<Empleado> {
    return request<Empleado>('/empleado/perfil');
  },

  async getLiquidaciones(): Promise<Liquidacion[]> {
    return request<Liquidacion[]>('/empleado/liquidaciones');
  },

  async descargarPdf(liquidacionId: number, numeroComprobante: string): Promise<void> {
    return downloadFile(`/empleado/liquidaciones/${liquidacionId}/pdf`, `volante-${numeroComprobante}.pdf`);
  },
};
