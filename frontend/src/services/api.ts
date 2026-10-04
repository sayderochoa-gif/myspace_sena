import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

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
