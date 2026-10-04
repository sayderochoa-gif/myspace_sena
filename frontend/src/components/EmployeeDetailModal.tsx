import React from 'react';
import { X, User, Briefcase, Mail, FileText, DollarSign, Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Empleado } from '../types';
import { formatCOP, formatDate } from '../utils/formatters';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  empleado: Empleado | null;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  empleado,
  onClose,
}) => {
  if (!isOpen || !empleado) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {empleado.nombre} {empleado.apellido}
              </h3>
              <p className="text-xs text-slate-300">ID de Sistema: #{empleado.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Tarjeta de estado y cargo */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Cargo Actual</p>
                <p className="text-base font-bold text-slate-900">
                  {empleado.cargo?.nombre || 'No asignado'}
                </p>
                {empleado.cargo && (
                  <p className="text-xs text-emerald-700">
                    Rango: {formatCOP(empleado.cargo.valorHoraMinimo)} - {formatCOP(empleado.cargo.valorHoraMaximo)}
                  </p>
                )}
              </div>
            </div>

            <div>
              {empleado.activo ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Activo</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inactivo</span>
                </span>
              )}
            </div>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Documento</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 pl-6">
                {empleado.documento}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium">Valor Hora Asignado</span>
              </div>
              <p className="text-sm font-bold text-emerald-700 pl-6">
                {formatCOP(empleado.valorHora)} / hora
              </p>
            </div>

            <div className="col-span-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Correo Electrónico</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 pl-6 break-all">
                {empleado.correo}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Número de Hijos</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 pl-6">
                {empleado.numeroHijos} {empleado.numeroHijos === 1 ? 'hijo' : 'hijos'}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Fecha de Registro</span>
              </div>
              <p className="text-xs font-medium text-slate-700 pl-6">
                {formatDate(empleado.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
