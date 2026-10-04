import React from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, User, Calendar, DollarSign } from 'lucide-react';
import { Liquidacion } from '../types';
import { formatCOP, formatDate, formatPeriodo } from '../utils/formatters';

interface LiquidacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacion: Liquidacion | null;
}

export const LiquidacionDetailModal: React.FC<LiquidacionDetailModalProps> = ({
  isOpen,
  onClose,
  liquidacion,
}) => {
  if (!isOpen || !liquidacion) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Comprobante de Liquidación</h2>
              <p className="text-xs text-slate-400">
                Periodo: {formatPeriodo(liquidacion.periodo)} ({liquidacion.periodo}) • ID #{liquidacion.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status and Timestamp Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estado:
              </span>
              {liquidacion.estado === 'CALCULADA' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  CALCULADA
                </span>
              )}
              {liquidacion.estado === 'ANULADA' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  ANULADA
                </span>
              )}
              {liquidacion.estado === 'PENDIENTE' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                  PENDIENTE
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Fecha de Liquidación: {formatDate(liquidacion.fechaLiquidacion)}</span>
            </div>
          </div>

          {/* Información del Empleado (Snapshot) */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-sky-500" />
              <span>Datos del Empleado y Parámetros Utilizados</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Empleado</p>
                <p className="font-semibold text-slate-800">
                  {liquidacion.empleado
                    ? `${liquidacion.empleado.nombre} ${liquidacion.empleado.apellido}`
                    : 'Empleado Registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Documento de Identidad</p>
                <p className="font-semibold text-slate-800">
                  {liquidacion.empleado?.documento || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cargo al Momento de Liquidar</p>
                <p className="font-semibold text-slate-800">
                  {liquidacion.cargoNombre || liquidacion.empleado?.cargo?.nombre || 'General'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Número de Hijos Registrado</p>
                <p className="font-semibold text-slate-800">
                  {liquidacion.numeroHijos} {liquidacion.numeroHijos === 1 ? 'hijo' : 'hijos'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Horas Trabajadas</p>
                <p className="font-semibold text-slate-800">{liquidacion.horasTrabajadas} horas</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor por Hora Utilizado</p>
                <p className="font-semibold text-emerald-700">
                  {formatCOP(liquidacion.valorHora)} / hora
                </p>
              </div>
            </div>
          </div>

          {/* Desglose Financiero */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Desglose Detallado del Cálculo</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-200">
                {/* Salario Bruto */}
                <div className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                  <div>
                    <p className="font-medium text-slate-800">Salario Bruto</p>
                    <p className="text-xs text-slate-500">
                      Fórmula: {liquidacion.horasTrabajadas} horas × {formatCOP(liquidacion.valorHora)}
                    </p>
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    {formatCOP(liquidacion.salarioBruto)}
                  </span>
                </div>

                {/* Bono por Hijos */}
                <div className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                  <div>
                    <p className="font-medium text-slate-800">Bono por Hijos</p>
                    <p className="text-xs text-slate-500">
                      Regla: {liquidacion.numeroHijos}{' '}
                      {liquidacion.numeroHijos === 1 ? 'hijo' : 'hijos'} registrados
                    </p>
                  </div>
                  <span className="text-base font-semibold text-emerald-600">
                    + {formatCOP(liquidacion.bonoHijos)}
                  </span>
                </div>

                {/* Seguridad Social */}
                <div className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition">
                  <div>
                    <p className="font-medium text-slate-800">Deducción de Seguridad Social</p>
                    <p className="text-xs text-slate-500">
                      Fórmula: {formatCOP(liquidacion.salarioBruto)} × {liquidacion.porcentajeSeguridadSocial}%
                    </p>
                  </div>
                  <span className="text-base font-semibold text-rose-600">
                    - {formatCOP(liquidacion.valorSeguridadSocial)}
                  </span>
                </div>

                {/* Salario Neto Total */}
                <div className="p-4 flex justify-between items-center bg-slate-900 text-white">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                      Salario Neto a Pagar
                    </p>
                    <p className="text-xs text-slate-300">
                      (Salario Bruto + Bono Hijos - Seguridad Social)
                    </p>
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight">
                    {formatCOP(liquidacion.salarioNeto)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nota de Auditoría Inmutable */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Garantía de Auditoría e Inmutabilidad Histórica:</span>
              <p className="mt-0.5 text-sky-800">
                Esta liquidación conserva de forma permanente la copia exacta de los valores que
                tenía el empleado al momento del cálculo (cargo: {liquidacion.cargoNombre}, valor
                hora: {formatCOP(liquidacion.valorHora)}, hijos: {liquidacion.numeroHijos}, porcentaje de seguridad social: {liquidacion.porcentajeSeguridadSocial}%). Modificaciones posteriores no alterarán este comprobante.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
