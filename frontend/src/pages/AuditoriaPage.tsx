import React, { useState, useEffect } from 'react';
import { auditoriaService } from '../services/auditoriaService';
import { Auditoria } from '../types';
import { Shield, Search, RefreshCw, Database, Filter } from 'lucide-react';


export const AuditoriaPage: React.FC = () => {
  const [logs, setLogs] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntidad, setSelectedEntidad] = useState<string>('TODAS');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditoriaService.getAuditoria();
      setLogs(res);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.usuario?.nombre && log.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.usuario?.correo && log.usuario.correo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEntidad = selectedEntidad === 'TODAS' || log.entidad === selectedEntidad;

    return matchesSearch && matchesEntidad;
  });

  const entidadesDisponibles = ['TODAS', ...Array.from(new Set(logs.map((l) => l.entidad)))];

  const getActionBadgeColor = (accion: string) => {
    if (accion.includes('LOGIN_FALLIDO') || accion.includes('LOGIN_BLOQUEADO') || accion.includes('ERROR')) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (accion.includes('ANULAR')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (accion.includes('CREAR') || accion.includes('LOGIN')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Pista de Auditoría & Trazabilidad
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registro cronológico inmutable de accesos, operaciones sensibles y modificaciones del sistema
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Actualizar Registros</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Entidad:</span>
          <select
            value={selectedEntidad}
            onChange={(e) => setSelectedEntidad(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
          >
            {entidadesDisponibles.map((ent) => (
              <option key={ent} value={ent} className="bg-slate-900 text-white">
                {ent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No se encontraron eventos de auditoría con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Entidad</th>
                  <th className="py-3.5 px-4">Usuario Responsable</th>
                  <th className="py-3.5 px-4">Descripción del Evento</th>
                  <th className="py-3.5 px-4 text-right">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold border text-[11px] ${getActionBadgeColor(
                          log.accion
                        )}`}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.entidad}</span>
                      {log.entidadId && <span className="text-slate-500">#{log.entidadId}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {log.usuario ? (
                        <div>
                          <div className="font-semibold text-white">{log.usuario.nombre}</div>
                          <div className="text-[11px] text-slate-400">{log.usuario.correo}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Sistema / Público</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans max-w-md">
                      {log.descripcion}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
