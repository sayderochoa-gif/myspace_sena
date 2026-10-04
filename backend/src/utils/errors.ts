export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, errorCode: string = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errorCode: string = 'BAD_REQUEST') {
    super(message, 400, errorCode);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
    this.name = 'ForbiddenError';
  }
}
