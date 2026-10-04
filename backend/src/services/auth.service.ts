import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/environment';
import { AppError, BadRequestError, NotFoundError } from '../utils/errors';
import { auditoriaService } from './auditoria.service';

export interface UserPayload {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  empleadoId?: number | null;
}

export interface LoginResult {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: RolUsuario;
    empleadoId?: number | null;
  };
}

export class AuthService {
  /**
   * Genera un token JWT seguro con los datos esenciales del usuario
   */
  generarToken(usuario: UserPayload): string {
    return jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        empleadoId: usuario.empleadoId,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

  }

  /**
   * Autenticación de usuarios por correo y contraseña
   * Protección de seguridad: Mensaje homogéneo para evitar enumeración de cuentas
   */
  async login(correo: string, passwordPlain: string, ip?: string): Promise<LoginResult> {
    if (!correo || !passwordPlain) {
      throw new BadRequestError('El correo y la contraseña son obligatorios', 'MISSING_CREDENTIALS');
    }

    const correoNormalizado = correo.trim().toLowerCase();

    // 1. Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
      include: {
        empleado: true,
      },
    });

    // 2. Si no existe, rechazamos con mensaje genérico
    if (!usuario) {
      await auditoriaService.registrar({
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        descripcion: `Intento de acceso fallido con correo no registrado: ${correoNormalizado}`,
        ip,
      });
      throw new AppError('Credenciales de acceso incorrectas', 401, 'INVALID_CREDENTIALS');
    }

    // 3. Verificar estado activo
    if (!usuario.activo) {
      await auditoriaService.registrar({
        usuarioId: usuario.id,
        accion: 'LOGIN_BLOQUEADO',
        entidad: 'USUARIO',
        entidadId: usuario.id,
        descripcion: `Intento de acceso de cuenta inactiva o deshabilitada: ${correoNormalizado}`,
        ip,
      });
      throw new AppError('La cuenta de usuario se encuentra inactiva. Contacte al administrador.', 401, 'USER_INACTIVE');
    }

    // 4. Comparar hash de contraseña
    const esPasswordValido = await bcrypt.compare(passwordPlain, usuario.passwordHash);
    if (!esPasswordValido) {
      await auditoriaService.registrar({
        usuarioId: usuario.id,
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        entidadId: usuario.id,
        descripcion: `Contraseña incorrecta para el usuario: ${correoNormalizado}`,
        ip,
      });
      throw new AppError('Credenciales de acceso incorrectas', 401, 'INVALID_CREDENTIALS');
    }

    // 5. Generar token
    const token = this.generarToken({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      empleadoId: usuario.empleadoId,
    });

    // 6. Registrar auditoría de éxito
    await auditoriaService.registrar({
      usuarioId: usuario.id,
      accion: 'LOGIN',
      entidad: 'USUARIO',
      entidadId: usuario.id,
      descripcion: `Inicio de sesión exitoso como ${usuario.rol}`,
      ip,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        empleadoId: usuario.empleadoId,
      },
    };
  }

  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  async obtenerPerfil(usuarioId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      empleadoId: usuario.empleadoId,
      activo: usuario.activo,
      empleado: usuario.empleado
        ? {
            id: usuario.empleado.id,
            nombre: usuario.empleado.nombre,
            apellido: usuario.empleado.apellido,
            documento: usuario.empleado.documento,
            cargo: usuario.empleado.cargo.nombre,
            valorHora: Number(usuario.empleado.valorHora),
            numeroHijos: usuario.empleado.numeroHijos,
          }
        : null,
    };
  }
}

export const authService = new AuthService();
