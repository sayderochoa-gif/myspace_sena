import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { Empleado, HorasTrabajadas, CreateHorasPayload } from '../types';

interface HorasFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHorasPayload) => Promise<void>;
  empleados: Empleado[];
  registroEditar?: HorasTrabajadas | null;
  loading: boolean;
}

export const HorasFormModal: React.FC<HorasFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  empleados,
  registroEditar,
  loading,
}) => {
  const [empleadoId, setEmpleadoId] = useState<number>(0);
  const [periodo, setPeriodo] = useState<string>('');
  const [horas, setHoras] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Inicializar periodo por defecto al mes actual (YYYY-MM)
  useEffect(() => {
    if (registroEditar) {
      setEmpleadoId(registroEditar.empleadoId);
      setPeriodo(registroEditar.periodo);
      setHoras(registroEditar.horas.toString());
    } else {
      const now = new Date();
      const currentPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setPeriodo(currentPeriodo);
      setEmpleadoId(empleados.length > 0 ? empleados[0].id : 0);
      setHoras('176');
    }
    setError(null);
  }, [registroEditar, isOpen, empleados]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!empleadoId) {
      setError('Debe seleccionar un empleado');
      return;
    }

    if (!periodo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
      setError('El periodo debe tener el formato YYYY-MM (ejemplo: 2026-09)');
      return;
    }

    const horasNum = parseFloat(horas);
    if (isNaN(horasNum) || horasNum <= 0) {
      setError('Las horas trabajadas deben ser un número mayor a 0');
      return;
    }

    if (horasNum > 300) {
      setError('Las horas trabajadas no pueden superar las 300 horas mensuales');
      return;
    }

    try {
      await onSubmit({
        empleadoId,
        periodo,
        horas: horasNum,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar el registro de horas');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">
              {registroEditar ? 'Editar Horas Trabajadas' : 'Registrar Horas Trabajadas'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Empleado <span className="text-red-500">*</span>
            </label>
            <select
              value={empleadoId}
              onChange={(e) => setEmpleadoId(Number(e.target.value))}
              disabled={!!registroEditar || loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800 disabled:bg-slate-100"
            >
              <option value={0}>Seleccione un empleado...</option>
              {empleados
                .filter((emp) => emp.activo || emp.id === empleadoId)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} - {emp.cargo?.nombre} (Doc: {emp.documento})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Periodo (Mes/Año) <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
            />
            <p className="text-xs text-slate-500 mt-1">Formato: YYYY-MM (ejemplo: 2026-09)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Horas Trabajadas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.5"
              max="300"
              step="0.5"
              placeholder="Ej: 176"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
            />
            <p className="text-xs text-slate-500 mt-1">
              Límite permitido: 1 a 300 horas mensuales.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : registroEditar ? 'Actualizar Horas' : 'Guardar Horas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
