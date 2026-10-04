import { request } from './api';
import { LoginResponse, Usuario } from '../types';

export const authService = {
  async login(correo: string, passwordPlain: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password: passwordPlain }),
    });

    localStorage.setItem('nomina_token', res.token);
    localStorage.setItem('nomina_user', JSON.stringify(res.usuario));
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('nomina_token');
      localStorage.removeItem('nomina_user');
    }
  },

  async getMe(): Promise<Usuario> {
    return request<Usuario>('/auth/me');
  },

  getStoredUser(): Usuario | null {
    const raw = localStorage.getItem('nomina_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('nomina_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('nomina_token');
  },
};
