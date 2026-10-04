import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  DollarSign,
  Download,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Liquidacion } from '../types';
import { formatCOP, formatPeriodo } from '../utils/formatters';
import { liquidacionService } from '../services/liquidacionService';


interface LiquidacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacion: Liquidacion | null;
  onLiquidacionUpdated?: () => void;
}

export const LiquidacionDetailModal: React.FC<LiquidacionDetailModalProps> = ({
  isOpen,
  onClose,
  liquidacion,
  onLiquidacionUpdated,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [resendingMail, setResendingMail] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !liquidacion) return null;

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setActionMessage(null);
      await liquidacionService.descargarPdf(
        liquidacion.id,
        liquidacion.numeroComprobante || `${liquidacion.id}`
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error al descargar PDF: ${err.message}` });
    } finally {
      setDownloading(false);
    }
  };

  const handleResendMail = async () => {
    try {
      setResendingMail(true);
      setActionMessage(null);
      const res = await liquidacionService.enviarCorreo(liquidacion.id);
      if (res.exito) {
        setActionMessage({ type: 'success', text: 'Volante despachado exitosamente por correo electrónico' });
      } else {
        setActionMessage({ type: 'error', text: res.mensaje });
      }
      if (onLiquidacionUpdated) onLiquidacionUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error enviando correo: ${err.message}` });
    } finally {
      setResendingMail(false);
    }
  };

  const compId = liquidacion.numeroComprobante || `NOM-${liquidacion.periodo}-${String(liquidacion.id).padStart(6, '0')}`;
  const ultimaNotif = liquidacion.notificaciones && liquidacion.notificaciones.length > 0 ? liquidacion.notificaciones[0] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Comprobante de Liquidación</h2>
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {compId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Periodo: {formatPeriodo(liquidacion.periodo)} ({liquidacion.periodo}) • Liquidación #{liquidacion.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold border ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-300 border-red-500/30'
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* Banner de Estado & Envío */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Estado:
              </span>
              {liquidacion.estado === 'CALCULADA' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  CALCULADA
                </span>
              )}
              {liquidacion.estado === 'ANULADA' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  ANULADA
                </span>
              )}
            </div>

            {/* Estado del Correo */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Despacho Correo:</span>
              {ultimaNotif ? (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    ultimaNotif.estado === 'ENVIADO'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : ultimaNotif.estado === 'ERROR'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {ultimaNotif.estado} ({ultimaNotif.intentos} {ultimaNotif.intentos === 1 ? 'intento' : 'intentos'})
                </span>
              ) : (
                <span className="text-slate-500 italic">No enviado</span>
              )}
            </div>
          </div>

          {/* Si está ANULADA, mostrar motivo */}
          {liquidacion.estado === 'ANULADA' && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold text-red-400 uppercase tracking-wider block">
                Comprobante Anulado
              </span>
              <p className="text-red-200">
                <strong>Motivo:</strong> {liquidacion.motivoAnulacion || 'Sin justificación registrada'}
              </p>
              {liquidacion.fechaAnulacion && (
                <p className="text-slate-400 text-[11px]">
                  Fecha anulación: {new Date(liquidacion.fechaAnulacion).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          )}

          {/* Información del Empleado (Snapshot histórico) */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Condiciones Laborales y Empleado</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Colaborador</p>
                <p className="font-semibold text-white">
                  {liquidacion.empleado
                    ? `${liquidacion.empleado.nombre} ${liquidacion.empleado.apellido}`
                    : 'Empleado Registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Documento de Identidad</p>
                <p className="font-semibold text-white">
                  {liquidacion.empleado?.documento || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cargo Registrado</p>
                <p className="font-semibold text-white">{liquidacion.cargoNombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Hijos Declarados</p>
                <p className="font-semibold text-white">
                  {liquidacion.numeroHijos} {liquidacion.numeroHijos === 1 ? 'hijo' : 'hijos'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Horas Trabajadas</p>
                <p className="font-semibold text-white">{liquidacion.horasTrabajadas} horas</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tarifa por Hora</p>
                <p className="font-semibold text-emerald-400">
                  {formatCOP(Number(liquidacion.valorHora))} / h
                </p>
              </div>
            </div>
          </div>

          {/* Desglose Financiero */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Desglose Detallado de Ingresos y Deducciones</span>
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="divide-y divide-slate-800/80">
                {/* Salario Bruto */}
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white text-sm">Salario Bruto</p>
                    <p className="text-xs text-slate-400">
                      {liquidacion.horasTrabajadas} horas × {formatCOP(Number(liquidacion.valorHora))}
                    </p>
                  </div>
                  <span className="text-base font-bold text-white font-mono">
                    {formatCOP(Number(liquidacion.salarioBruto))}
                  </span>
                </div>

                {/* Bono por Hijos */}
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white text-sm">Bono por Hijos</p>
                    <p className="text-xs text-slate-400">
                      Incentivo familiar por {liquidacion.numeroHijos} hijos
                    </p>
                  </div>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    + {formatCOP(Number(liquidacion.bonoHijos))}
                  </span>
                </div>

                {/* Seguridad Social */}
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white text-sm">Deducción Seguridad Social</p>
                    <p className="text-xs text-slate-400">
                      Tarifa: {liquidacion.porcentajeSeguridadSocial}% sobre salario bruto
                    </p>
                  </div>
                  <span className="text-base font-bold text-red-400 font-mono">
                    - {formatCOP(Number(liquidacion.valorSeguridadSocial))}
                  </span>
                </div>

                {/* Salario Neto */}
                <div className="p-4 flex justify-between items-center bg-slate-950 border-t border-slate-800">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Neto Total a Consignar
                    </p>
                    <p className="text-xs text-slate-400">
                      (Bruto + Bono Hijos - Seguridad Social)
                    </p>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatCOP(Number(liquidacion.salarioNeto))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar Comprobante PDF</span>
            </button>

            {liquidacion.estado !== 'ANULADA' && (
              <button
                onClick={handleResendMail}
                disabled={resendingMail}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {resendingMail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Reenviar Correo</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
