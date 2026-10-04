import React from 'react';
import { Eye, Edit2, UserX, CheckCircle2, XCircle, Search, Plus, RefreshCw, Users } from 'lucide-react';
import { Empleado, Cargo } from '../types';
import { formatCOP } from '../utils/formatters';

interface EmployeeTableProps {
  empleados: Empleado[];
  cargos: Cargo[];
  isLoading: boolean;
  searchTerm: string;
  selectedCargoFilter: string;
  selectedStatusFilter: string;
  onSearchChange: (value: string) => void;
  onCargoFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onViewEmployee: (empleado: Empleado) => void;
  onEditEmployee: (empleado: Empleado) => void;
  onDeactivateEmployee: (empleado: Empleado) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  empleados,
  cargos,
  isLoading,
  searchTerm,
  selectedCargoFilter,
  selectedStatusFilter,
  onSearchChange,
  onCargoFilterChange,
  onStatusFilterChange,
  onRefresh,
  onOpenCreateModal,
  onViewEmployee,
  onEditEmployee,
  onDeactivateEmployee,
}) => {
  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acciones Superiores */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o correo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filtros por Cargo y Estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCargoFilter}
            onChange={(e) => onCargoFilterChange(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-700"
          >
            <option value="">Todos los cargos</option>
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id.toString()}>
                {cargo.nombre}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-700"
          >
            <option value="all">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>

          <button
            onClick={onRefresh}
            title="Refrescar lista"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center">ID</th>
                <th className="py-3.5 px-4">Nombre</th>
                <th className="py-3.5 px-4">Apellido</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Correo</th>
                <th className="py-3.5 px-4">Cargo</th>
                <th className="py-3.5 px-4 text-right">Valor Hora</th>
                <th className="py-3.5 px-4 text-center">Hijos</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-sm font-medium">Cargando nómina de empleados...</p>
                    </div>
                  </td>
                </tr>
              ) : empleados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">No se encontraron empleados</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm || selectedCargoFilter || selectedStatusFilter !== 'all'
                          ? 'Intente modificar los criterios de búsqueda o filtros aplicados.'
                          : 'Comience registrando el primer empleado en el sistema.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !empleado.activo ? 'bg-slate-50/40 text-slate-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-500">
                      #{empleado.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {empleado.nombre}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {empleado.apellido}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 font-medium">
                      {empleado.documento}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {empleado.correo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {empleado.cargo?.nombre || 'Sin cargo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      {formatCOP(empleado.valorHora)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">
                      {empleado.numeroHijos}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {empleado.activo ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onViewEmployee(empleado)}
                          title="Ver información"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditEmployee(empleado)}
                          title="Editar empleado"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {empleado.activo && (
                          <button
                            onClick={() => onDeactivateEmployee(empleado)}
                            title="Desactivar empleado"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
