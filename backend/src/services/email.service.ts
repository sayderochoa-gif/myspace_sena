import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../config/prisma';
import { env } from '../config/environment';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { formatPeriodo, formatCOP } from '../utils/formatters';
import { pdfService } from './pdf.service';
import { auditoriaService } from './auditoria.service';

export class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Crea u obtiene el transporte SMTP reutilizable
   */
  private getTransporter(): Transporter {

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
        // Timeout para evitar peticiones colgadas si el servidor no responde
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
    }
    return this.transporter;
  }

  /**
   * Envía el volante de pago en PDF por correo electrónico al empleado
   * Separación de responsabilidades: Si el correo falla, la liquidación sigue siendo válida
   */
  async enviarVolantePorCorreo(
    liquidacionId: number,
    usuarioId?: number | null,
    ip?: string
  ): Promise<{ exito: boolean; notificacionId: number; mensaje: string }> {
    // 1. Obtener la liquidación con el empleado
    const liq = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      include: {
        empleado: true,
      },
    });

    if (!liq) {
      throw new NotFoundError(
        `La liquidación con ID ${liquidacionId} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    if (liq.estado === 'ANULADA') {
      throw new BadRequestError(
        'No se puede enviar el volante de una liquidación anulada',
        'LIQUIDACION_ANULADA'
      );
    }

    const destinatario = liq.empleado.correo;
    const periodoFormateado = formatPeriodo(liq.periodo);
    const asunto = `Volante de pago - ${periodoFormateado}`;

    // 2. Asegurar que el PDF esté generado
    const { filePath, fileName } = await pdfService.obtenerOgenerarPdf(liquidacionId, usuarioId, ip);

    // 3. Crear o actualizar el registro de notificación
    let notificacion = await prisma.notificacion.findFirst({
      where: { liquidacionId },
    });

    if (!notificacion) {
      notificacion = await prisma.notificacion.create({
        data: {
          liquidacionId,
          destinatario,
          asunto,
          estado: 'PENDIENTE',
          intentos: 0,
        },
      });
    }

    // 4. Intentar el envío SMTP
    try {
      // Si estamos en entorno de prueba y el correo es de prueba exitosa, podemos simular el envío o usar json transport
      if (env.NODE_ENV === 'test' && !env.SMTP_USER) {
        // En tests unitarios sin credenciales reales configuradas, simulamos envío exitoso
        await prisma.notificacion.update({
          where: { id: notificacion.id },
          data: {
            estado: 'ENVIADO',
            intentos: notificacion.intentos + 1,
            fechaEnvio: new Date(),
            fechaUltimoIntento: new Date(),
            error: null,
          },
        });

        await auditoriaService.registrar({
          usuarioId: usuarioId ?? null,
          accion: 'ENVIAR_CORREO',
          entidad: 'NOTIFICACION',
          entidadId: notificacion.id,
          descripcion: `Volante de pago enviado a ${destinatario} para liquidación #${liq.id}`,
          ip,
        });

        return {
          exito: true,
          notificacionId: notificacion.id,
          mensaje: 'Correo enviado exitosamente (modo test/simulado)',
        };
      }

      const transporter = this.getTransporter();

      const cuerpoMensaje = `Hola ${liq.empleado.nombre},

Adjuntamos su volante de pago correspondiente al periodo de ${periodoFormateado}.

Su liquidación ha sido procesada correctamente con el comprobante N° ${liq.numeroComprobante || liq.id}.
Salario Neto a Consignar: ${formatCOP(Number(liq.salarioNeto))}

Cordialmente,
Departamento de Nómina
FinanCorp S.A.`;

      await transporter.sendMail({
        from: env.MAIL_FROM,
        to: destinatario,
        subject: asunto,
        text: cuerpoMensaje,
        attachments: [
          {
            filename: fileName,
            path: filePath,
            contentType: 'application/pdf',
          },
        ],
      });

      // Actualizar notificación como ENVIADO
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: {
          estado: 'ENVIADO',
          intentos: notificacion.intentos + 1,
          fechaEnvio: new Date(),
          fechaUltimoIntento: new Date(),
          error: null,
        },
      });

      await auditoriaService.registrar({
        usuarioId: usuarioId ?? null,
        accion: 'ENVIAR_CORREO',
        entidad: 'NOTIFICACION',
        entidadId: notificacion.id,
        descripcion: `Volante de pago enviado con éxito a ${destinatario}`,
        ip,
      });

      return {
        exito: true,
        notificacionId: notificacion.id,
        mensaje: `Volante de pago enviado exitosamente a ${destinatario}`,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al enviar correo';
      console.warn(`⚠️ [MAIL_ERROR] No se pudo enviar el correo a ${destinatario}:`, errorMsg);

      // Registrar error en la notificación sin alterar la validez de la liquidación
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: {
          estado: 'ERROR',
          intentos: notificacion.intentos + 1,
          fechaUltimoIntento: new Date(),
          error: errorMsg,
        },
      });

      await auditoriaService.registrar({
        usuarioId: usuarioId ?? null,
        accion: 'ERROR_CORREO',
        entidad: 'NOTIFICACION',
        entidadId: notificacion.id,
        descripcion: `Fallo al enviar correo a ${destinatario}: ${errorMsg}`,
        ip,
      });

      return {
        exito: false,
        notificacionId: notificacion.id,
        mensaje: `No se pudo enviar el correo a ${destinatario}. La liquidación permanece válida. Puede reintentar más tarde.`,
      };
    }
  }

  /**
   * Reintenta el envío de una notificación con error previo
   */
  async reintentarEnvio(
    notificacionId: number,
    usuarioId?: number | null,
    ip?: string
  ): Promise<{ exito: boolean; notificacionId: number; mensaje: string }> {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: notificacionId },
    });

    if (!notificacion) {
      throw new NotFoundError(
        `La notificación con ID ${notificacionId} no existe`,
        'NOTIFICACION_NOT_FOUND'
      );
    }

    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'REINTENTAR_CORREO',
      entidad: 'NOTIFICACION',
      entidadId: notificacionId,
      descripcion: `Solicitado reintento de envío de correo para notificación #${notificacionId}`,
      ip,
    });

    return this.enviarVolantePorCorreo(notificacion.liquidacionId, usuarioId, ip);
  }

  /**
   * Obtiene la lista de notificaciones con filtros
   */
  async listarNotificaciones(filters: { liquidacionId?: number; estado?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.liquidacionId) where.liquidacionId = filters.liquidacionId;
    if (filters.estado) where.estado = filters.estado;

    const notificaciones = await prisma.notificacion.findMany({
      where,
      include: {
        liquidacion: {
          include: {
            empleado: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notificaciones.map((n) => ({
      id: n.id,
      liquidacionId: n.liquidacionId,
      empleadoNombre: `${n.liquidacion.empleado.nombre} ${n.liquidacion.empleado.apellido}`,
      destinatario: n.destinatario,
      asunto: n.asunto,
      estado: n.estado,
      intentos: n.intentos,
      fechaUltimoIntento: n.fechaUltimoIntento?.toISOString() || null,
      fechaEnvio: n.fechaEnvio?.toISOString() || null,
      error: n.error,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));
  }
}

export const emailService = new EmailService();
