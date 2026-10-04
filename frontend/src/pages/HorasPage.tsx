import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plus,
  Filter,
  Trash2,
  Edit,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { HorasTrabajadas, Empleado, CreateHorasPayload } from '../types';
import { horasService } from '../services/horasService';
import { empleadoService } from '../services/empleadoService';
import { HorasFormModal } from '../components/HorasFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertBanner } from '../components/AlertBanner';
import { formatDate, formatPeriodo } from '../utils/formatters';

export const HorasPage: React.FC = () => {
  const [registros, setRegistros] = useState<HorasTrabajadas[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [registroEditar, setRegistroEditar] = useState<HorasTrabajadas | null>(null);

  // Filtros
  const [filterEmpleadoId, setFilterEmpleadoId] = useState<number>(0);
  const [filterPeriodo, setFilterPeriodo] = useState<string>('');

  // Notificaciones y Confirmación
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [horasData, empleadosData] = await Promise.all([
        horasService.getAll({
          empleadoId: filterEmpleadoId || undefined,
          periodo: filterPeriodo || undefined,
        }),
        empleadoService.getEmpleados({ activo: 'all' }),
      ]);
      setRegistros(horasData);
      setEmpleados(empleadosData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos de horas';
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [filterEmpleadoId, filterPeriodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveHoras = async (data: CreateHorasPayload) => {
    if (registroEditar) {
      await horasService.update(registroEditar.id, {
        horas: data.horas,
        periodo: data.periodo,
      });
      setAlert({ type: 'success', message: 'Registro de horas actualizado correctamente' });
    } else {
      await horasService.create(data);
      setAlert({ type: 'success', message: 'Horas registradas correctamente' });
    }
    fetchData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    try {
      await horasService.delete(deleteConfirm.id);
      setAlert({ type: 'success', message: 'Registro de horas eliminado exitosamente' });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar registro';
      setAlert({ type: 'error', message: msg });
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Registro de Horas Trabajadas
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Control mensual de horas laboradas por empleado para la liquidación de nómina.
          </p>
        </div>

        <button
          onClick={() => {
            setRegistroEditar(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition hover:shadow duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Horas</span>
        </button>
      </div>

      <AlertBanner
        alert={alert ? { type: alert.type, text: alert.message } : null}
        onClose={() => setAlert(null)}
      />

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros de Búsqueda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Filtrar por Empleado
            </label>
            <select
              value={filterEmpleadoId}
              onChange={(e) => setFilterEmpleadoId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
            >
              <option value={0}>Todos los empleados</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido} ({emp.cargo?.nombre})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Filtrar por Periodo
            </label>
            <input
              type="month"
              value={filterPeriodo}
              onChange={(e) => setFilterPeriodo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => {
                setFilterEmpleadoId(0);
                setFilterPeriodo('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Horas Trabajadas</th>
                <th className="px-6 py-4">Fecha Registro</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      <p>Cargando registros de horas...</p>
                    </div>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-700">No hay horas registradas</p>
                      <p className="text-xs text-slate-400">
                        Comience registrando las horas mensuales de un empleado con el botón superior.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {reg.empleado ? `${reg.empleado.nombre} ${reg.empleado.apellido}` : `ID: ${reg.empleadoId}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        Doc: {reg.empleado?.documento || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {reg.empleado?.cargo?.nombre || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {formatPeriodo(reg.periodo)} ({reg.periodo})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {reg.horas} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setRegistroEditar(reg);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Editar registro"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: reg.id })}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      <HorasFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setRegistroEditar(null);
        }}
        onSubmit={handleSaveHoras}
        empleados={empleados}
        registroEditar={registroEditar}
        loading={loading}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Registro de Horas"
        message="¿Está seguro de que desea eliminar este registro de horas trabajadas? Esta acción no se puede deshacer."
        confirmLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
};
