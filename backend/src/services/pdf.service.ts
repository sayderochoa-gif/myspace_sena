import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { env } from '../config/environment';
import { NotFoundError } from '../utils/errors';
import { formatCOP, formatDate, formatPeriodo } from '../utils/formatters';
import { auditoriaService } from './auditoria.service';

export interface GenerarPdfResultado {
  filePath: string;
  fileName: string;
  numeroComprobante: string;
}

export class PdfService {
  /**
   * Genera el identificador único estandarizado del comprobante (ej: NOM-2026-09-000001)
   */
  generarNumeroComprobante(periodo: string, liquidacionId: number): string {
    return `NOM-${periodo}-${String(liquidacionId).padStart(6, '0')}`;
  }

  /**
   * Genera el documento PDF del volante de pago de nómina con diseño profesional
   */
  async generarVolantePago(
    liquidacionId: number,
    usuarioId?: number | null,
    ip?: string
  ): Promise<GenerarPdfResultado> {
    // 1. Obtener la liquidación con todos sus datos
    const liq = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
      },
    });

    if (!liq) {
      throw new NotFoundError(
        `La liquidación con ID ${liquidacionId} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    // 2. Obtener datos de la empresa
    let empresa = await prisma.configuracionEmpresa.findFirst();
    if (!empresa) {
      empresa = {
        id: 1,
        nombre: 'FinanCorp S.A.',
        nit: '900.123.456-7',
        direccion: 'Calle 72 # 10-34, Bogotá, Colombia',
        telefono: '+57 (1) 745-0000',
        correo: 'nomina@financorp.com',
        sitioWeb: 'www.financorp.com',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 3. Determinar o asignar el identificador único del comprobante
    const numeroComprobante =
      liq.numeroComprobante || this.generarNumeroComprobante(liq.periodo, liq.id);

    // 4. Asegurar existencia del directorio de almacenamiento
    const storageDir = env.PDF_STORAGE_DIR;
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `volante-${numeroComprobante}.pdf`;
    const filePath = path.join(storageDir, fileName);

    // 5. Construir el documento PDF con PDFKit
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- ENCABEZADO CORPORATIVO ---
      doc.rect(45, 40, 522, 60).fill('#0f172a'); // Fondo Slate 900

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
      doc.text(empresa.nombre, 60, 50);

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica');
      doc.text(`NIT: ${empresa.nit}  |  ${empresa.direccion}`, 60, 70);
      doc.text(`Tel: ${empresa.telefono}  |  Email: ${empresa.correo}  |  Web: ${empresa.sitioWeb}`, 60, 82);

      // Badge Estado
      const badgeBg = liq.estado === 'CALCULADA' ? '#059669' : '#dc2626';
      doc.rect(450, 52, 100, 22).fill(badgeBg);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text(liq.estado, 450, 58, { width: 100, align: 'center' });

      // --- TÍTULO Y NÚMERO DE COMPROBANTE ---
      let y = 115;
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold');
      doc.text('VOLANTE DE PAGO DE NÓMINA', 45, y);

      doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
      doc.text(`Comprobante N°: ${numeroComprobante}`, 350, y, { align: 'right', width: 217 });

      y += 20;
      doc.fontSize(9).font('Helvetica');
      doc.text(`Periodo Liquidado: ${formatPeriodo(liq.periodo)} (${liq.periodo})`, 45, y);
      doc.text(`Fecha de Liquidación: ${formatDate(liq.fechaLiquidacion.toISOString())}`, 350, y, {
        align: 'right',
        width: 217,
      });

      // Línea divisoria
      y += 18;
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, y).lineTo(567, y).stroke();

      // --- INFORMACIÓN DEL EMPLEADO ---
      y += 10;
      doc.rect(45, y, 522, 65).fill('#f8fafc');
      doc.rect(45, y, 522, 65).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('DATOS DEL EMPLEADO Y CONDICIONES LABORALES', 55, y + 8);

      const emp = liq.empleado;
      const col1X = 55;
      const col2X = 310;
      const row1Y = y + 25;
      const row2Y = y + 42;

      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      doc.text('Nombre del Colaborador:', col1X, row1Y);
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(`${emp.nombre} ${emp.apellido}`, col1X + 105, row1Y);

      doc.fillColor('#64748b').font('Helvetica');
      doc.text('Documento de Identidad:', col2X, row1Y);
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(emp.documento, col2X + 105, row1Y);

      doc.fillColor('#64748b').font('Helvetica');
      doc.text('Cargo Registrado:', col1X, row2Y);
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(liq.cargoNombre, col1X + 105, row2Y);

      doc.fillColor('#64748b').font('Helvetica');
      doc.text('Horas Trabajadas:', col2X, row2Y);
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(`${liq.horasTrabajadas} hrs  (@ ${formatCOP(Number(liq.valorHora))}/h)`, col2X + 105, row2Y);

      // --- TABLA DE DEVENGADOS / INGRESOS ---
      y += 80;
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('1. INGRESOS Y DEVENGADOS', 45, y);

      y += 15;
      // Header Tabla Ingresos
      doc.rect(45, y, 522, 20).fill('#e2e8f0');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('CONCEPTO', 55, y + 5);
      doc.text('BASE / DETALLE', 280, y + 5);
      doc.text('VALOR (COP)', 480, y + 5, { width: 80, align: 'right' });

      // Filas Ingresos
      y += 20;
      doc.rect(45, y, 522, 22).fill('#ffffff').strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').font('Helvetica');
      doc.text('Salario Ordinario por Horas', 55, y + 6);
      doc.text(`${liq.horasTrabajadas} horas × ${formatCOP(Number(liq.valorHora))}`, 280, y + 6);
      doc.font('Helvetica-Bold');
      doc.text(formatCOP(Number(liq.salarioBruto)), 480, y + 6, { width: 80, align: 'right' });

      y += 22;
      doc.rect(45, y, 522, 22).fill('#f8fafc').strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').font('Helvetica');
      doc.text('Bono por Hijos', 55, y + 6);
      doc.text(`Incentivo familiar por ${liq.numeroHijos} ${liq.numeroHijos === 1 ? 'hijo' : 'hijos'}`, 280, y + 6);
      doc.font('Helvetica-Bold').fillColor('#059669');
      doc.text(formatCOP(Number(liq.bonoHijos)), 480, y + 6, { width: 80, align: 'right' });

      // Subtotal Ingresos
      y += 22;
      const totalIngresos = Number(liq.salarioBruto) + Number(liq.bonoHijos);
      doc.rect(45, y, 522, 22).fill('#f1f5f9');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
      doc.text('SUBTOTAL INGRESOS', 55, y + 6);
      doc.text(formatCOP(totalIngresos), 480, y + 6, { width: 80, align: 'right' });

      // --- TABLA DE DEDUCCIONES ---
      y += 35;
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('2. DEDUCCIONES', 45, y);

      y += 15;
      // Header Tabla Deducciones
      doc.rect(45, y, 522, 20).fill('#e2e8f0');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('CONCEPTO', 55, y + 5);
      doc.text('BASE / PORCENTAJE', 280, y + 5);
      doc.text('VALOR (COP)', 480, y + 5, { width: 80, align: 'right' });

      y += 20;
      doc.rect(45, y, 522, 22).fill('#ffffff').strokeColor('#f1f5f9').stroke();
      doc.fillColor('#0f172a').font('Helvetica');
      doc.text('Aporte a Seguridad Social', 55, y + 6);
      doc.text(`Tarifa configurada: ${liq.porcentajeSeguridadSocial}% sobre salario bruto`, 280, y + 6);
      doc.font('Helvetica-Bold').fillColor('#dc2626');
      doc.text(`- ${formatCOP(Number(liq.valorSeguridadSocial))}`, 480, y + 6, {
        width: 80,
        align: 'right',
      });

      // Subtotal Deducciones
      y += 22;
      doc.rect(45, y, 522, 22).fill('#f1f5f9');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
      doc.text('TOTAL DEDUCCIONES', 55, y + 6);
      doc.fillColor('#dc2626');
      doc.text(`- ${formatCOP(Number(liq.valorSeguridadSocial))}`, 480, y + 6, {
        width: 80,
        align: 'right',
      });

      // --- RESUMEN FINAL: NETO A PAGAR ---
      y += 35;
      doc.rect(45, y, 522, 45).fill('#0f172a'); // Fondo Slate 900
      doc.fillColor('#34d399').fontSize(10).font('Helvetica-Bold');
      doc.text('NETO TOTAL A CONSIGNAR', 60, y + 10);
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica');
      doc.text('(Total Ingresos Devengados - Deducciones de Ley)', 60, y + 25);

      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold');
      doc.text(formatCOP(Number(liq.salarioNeto)), 360, y + 13, { width: 195, align: 'right' });

      // Mensaje de anulación si aplica
      if (liq.estado === 'ANULADA') {
        y += 55;
        doc.rect(45, y, 522, 30).fill('#fee2e2');
        doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold');
        doc.text(`DOCUMENTO ANULADO: ${liq.motivoAnulacion || 'Sin motivo especificado'}`, 55, y + 10);
      }

      // --- FIRMAS Y PIE DE PÁGINA ---
      const footerY = 660;
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(80, footerY).lineTo(250, footerY).stroke();
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(360, footerY).lineTo(530, footerY).stroke();

      doc.fillColor('#475569').fontSize(7).font('Helvetica');
      doc.text('FIRMA DEL EMPLEADOR / RESPONSABLE NÓMINA', 80, footerY + 5, { width: 170, align: 'center' });
      doc.text('FIRMA / ACEPTACIÓN DEL COLABORADOR', 360, footerY + 5, { width: 170, align: 'center' });

      doc.fillColor('#94a3b8').fontSize(7);
      doc.text(
        `Comprobante generado electrónicamente por Sistema de Automatización de Nómina • ID: ${numeroComprobante} • ${new Date().toISOString()}`,
        45,
        720,
        { width: 522, align: 'center' }
      );

      doc.end();

      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    });

    // 6. Actualizar registro de liquidación con el número de comprobante y ruta relativa del PDF
    await prisma.liquidacion.update({
      where: { id: liquidacionId },
      data: {
        numeroComprobante,
        pdfPath: filePath,
      },
    });

    // 7. Registrar auditoría
    await auditoriaService.registrar({
      usuarioId: usuarioId ?? null,
      accion: 'GENERAR_PDF',
      entidad: 'LIQUIDACION',
      entidadId: liquidacionId,
      descripcion: `Generado volante PDF ${numeroComprobante} para empleado ${liq.empleado.nombre} ${liq.empleado.apellido}`,
      ip,
    });

    return {
      filePath,
      fileName,
      numeroComprobante,
    };
  }

  /**
   * Obtiene la ruta física del archivo PDF de una liquidación o lo genera si no existe
   */
  async obtenerOgenerarPdf(
    liquidacionId: number,
    usuarioId?: number | null,
    ip?: string
  ): Promise<{ filePath: string; fileName: string }> {
    const liq = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
    });

    if (!liq) {
      throw new NotFoundError(
        `La liquidación con ID ${liquidacionId} no existe`,
        'LIQUIDACION_NOT_FOUND'
      );
    }

    if (liq.pdfPath && fs.existsSync(liq.pdfPath)) {
      const fileName = path.basename(liq.pdfPath);
      return { filePath: liq.pdfPath, fileName };
    }

    // Si el archivo físico no existe, lo regeneramos
    const generado = await this.generarVolantePago(liquidacionId, usuarioId, ip);
    return { filePath: generado.filePath, fileName: generado.fileName };
  }
}

export const pdfService = new PdfService();
