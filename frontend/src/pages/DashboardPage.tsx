import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { liquidacionService } from '../services/liquidacionService';
import { DashboardResumen } from '../types';
import { formatCOP } from '../utils/formatters';
import {
  Users,
  DollarSign,
  MailCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Download,
  Calendar,
  RefreshCw,
  Award,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateToLiquidaciones?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToLiquidaciones }) => {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadData = async (targetPeriodo: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getResumen(targetPeriodo);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(periodo);
  }, [periodo]);

  const handleDownloadPdf = async (id: number, numeroComprobante: string) => {
    try {
      await liquidacionService.descargarPdf(id, numeroComprobante);
    } catch (err: any) {
      alert(`Error descargando comprobante: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header con selector de periodo y refresco */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Tablero de Control de Nómina
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidado financiero y operativo en tiempo real desde la base de datos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-inner">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadData(periodo)}
            disabled={loading}
            title="Actualizar métricas"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Fila 1: Métricas de Personal & Nómina General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Empleados
                </span>
                <span className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{data.empleados.total}</span>
                <span className="text-xs text-slate-500 font-medium">registrados</span>
              </div>
              <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {data.empleados.activos} activos ({data.empleados.inactivos} inactivos)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Liquidaciones Periodo
                </span>
                <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  <FileCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{data.liquidaciones.totalPeriodo}</span>
                <span className="text-xs text-slate-500 font-medium">en {data.periodoSeleccionado}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">
                  {data.liquidaciones.calculadas} calculadas
                </span>
                {data.liquidaciones.anuladas > 0 && (
                  <span className="text-red-400 font-semibold">
                    • {data.liquidaciones.anuladas} anuladas
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Neto a Pagar
                </span>
                <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-emerald-400">
                  {formatCOP(data.liquidaciones.totalNeto)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Valor real a desembolsar en bancos
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Despacho de Correos
                </span>
                <span className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <MailCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {data.notificaciones.enviados}
                </span>
                <span className="text-xs text-slate-500 font-medium">de {data.notificaciones.total}</span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">{data.notificaciones.enviados} enviados</span>
                {data.notificaciones.errores > 0 && (
                  <span className="text-red-400 font-semibold">• {data.notificaciones.errores} errores</span>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2: Desglose Financiero de Nómina (Bruto, Bonos, Seguridad Social, Neto) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-400" />
              Desglose Financiero del Periodo ({data.periodoSeleccionado})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Salario Bruto (Horas)
                </div>
                <div className="text-xl font-bold text-white mt-2">
                  {formatCOP(data.liquidaciones.totalBruto)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Horas laboradas × valor hora</p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Total Bonos Familiares
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-2">
                  + {formatCOP(data.liquidaciones.totalBonos)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Escala por número de hijos</p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  Deducción Seguridad Social
                </div>
                <div className="text-xl font-bold text-red-400 mt-2">
                  - {formatCOP(data.liquidaciones.totalSeguridadSocial)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Aporte sobre salario bruto</p>
              </div>

              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                <div className="text-xs font-semibold uppercase text-blue-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Total Neto Consolidado
                </div>
                <div className="text-xl font-black text-blue-400 mt-2">
                  {formatCOP(data.liquidaciones.totalNeto)}
                </div>
                <p className="text-[11px] text-blue-300/60 mt-1">(Bruto + Bonos - Seg. Social)</p>
              </div>
            </div>
          </div>

          {/* Fila 3: Estado del Sistema de Correo y Últimas Liquidaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado de Envíos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MailCheck className="w-5 h-5 text-amber-400" />
                  Monitoreo de Notificaciones
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Envíos Exitosos
                    </span>
                    <span className="font-bold text-white font-mono">{data.notificaciones.enviados}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Envíos Pendientes
                    </span>
                    <span className="font-bold text-white font-mono">{data.notificaciones.pendientes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fallos / Con Error
                    </span>
                    <span className="font-bold text-red-400 font-mono">{data.notificaciones.errores}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Los correos fallidos pueden ser reintentados en la sección de Liquidaciones sin afectar el cálculo.
                </span>
              </div>
            </div>

            {/* Últimas Liquidaciones Registradas */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  Liquidaciones Recientes
                </h2>
                {onNavigateToLiquidaciones && (
                  <button
                    onClick={onNavigateToLiquidaciones}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Ver todas →
                  </button>
                )}
              </div>

              {data.ultimasLiquidaciones.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No hay liquidaciones registradas en el sistema aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 font-semibold">Comprobante</th>
                        <th className="pb-3 font-semibold">Colaborador</th>
                        <th className="pb-3 font-semibold">Periodo</th>
                        <th className="pb-3 font-semibold">Neto</th>
                        <th className="pb-3 font-semibold">Estado</th>
                        <th className="pb-3 font-semibold text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.ultimasLiquidaciones.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 font-mono text-xs text-blue-400 font-semibold">
                            {item.numeroComprobante}
                          </td>
                          <td className="py-3 font-medium text-white">{item.empleadoNombre}</td>
                          <td className="py-3 text-slate-400">{item.periodo}</td>
                          <td className="py-3 font-bold text-emerald-400 font-mono">
                            {formatCOP(item.salarioNeto)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                item.estado === 'CALCULADA'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDownloadPdf(item.id, item.numeroComprobante)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition inline-flex items-center gap-1 text-xs cursor-pointer"
                              title="Descargar comprobante en PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
