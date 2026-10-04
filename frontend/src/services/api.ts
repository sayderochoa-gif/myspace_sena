import { ApiResponse } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly details?: Array<{ campo: string; mensaje: string }>;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: Array<{ campo: string; mensaje: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('nomina_token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('nomina_token');
    localStorage.removeItem('nomina_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  let data: ApiResponse<T>;

  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'Error al procesar la respuesta del servidor (formato no válido)',
      response.status
    );
  }

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || 'Error en la petición al servidor',
      response.status,
      data.error,
      data.details
    );
  }

  return data.data;
}

export async function downloadFile(endpoint: string, filename: string): Promise<void> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('nomina_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('No se pudo descargar el archivo solicitado');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}

