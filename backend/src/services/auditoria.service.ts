import { prisma } from '../config/prisma';

export interface RegistrarAuditoriaDTO {
  usuarioId?: number | null;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  descripcion: string;
  ip?: string | null;
}

export interface AuditoriaFilterOptions {
  usuarioId?: number;
  accion?: string;
  entidad?: string;
  limit?: number;
}

export class AuditoriaService {
  /**
   * Registra una acción en la bitácora de auditoría
   */
  async registrar(dto: RegistrarAuditoriaDTO): Promise<void> {
    try {
      await prisma.auditoria.create({
        data: {
          usuarioId: dto.usuarioId ?? null,
          accion: dto.accion,
          entidad: dto.entidad,
          entidadId: dto.entidadId ?? null,
          descripcion: dto.descripcion,
          ip: dto.ip ?? null,
        },
      });
    } catch (error) {
      console.error('⚠️ [AUDITORIA_ERROR] No se pudo guardar el registro de auditoría:', error);
      // No bloqueamos la operación principal si falla la auditoría
    }
  }

  /**
   * Consulta el historial de auditoría con filtros opcionales
   */
  async obtenerHistorial(filters: AuditoriaFilterOptions = {}) {
    const { usuarioId, accion, entidad, limit = 100 } = filters;

    const where: Record<string, unknown> = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (accion) where.accion = accion;
    if (entidad) where.entidad = entidad;

    const registros = await prisma.auditoria.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return registros.map((r) => ({
      id: r.id,
      usuarioId: r.usuarioId,
      usuarioNombre: r.usuario?.nombre || 'Sistema',
      usuarioCorreo: r.usuario?.correo || 'sistema@financorp.com',
      usuarioRol: r.usuario?.rol || 'SISTEMA',
      accion: r.accion,
      entidad: r.entidad,
      entidadId: r.entidadId,
      descripcion: r.descripcion,
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

export const auditoriaService = new AuditoriaService();
