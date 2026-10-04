import React, { useState, useEffect } from 'react';
import { empleadoPortalService } from '../services/empleadoPortalService';
import { Empleado, Liquidacion } from '../types';
import { formatCOP, formatPeriodo } from '../utils/formatters';
import {
  Download,
  Calendar,
  Briefcase,
  Users as UsersIcon,
  FileText,
  AlertCircle,
} from 'lucide-react';

import { LiquidacionDetailModal } from '../components/LiquidacionDetailModal';

export const EmployeePortalPage: React.FC = () => {
  const [perfil, setPerfil] = useState<Empleado | null>(null);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState<Liquidacion | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [perfilRes, liqRes] = await Promise.all([
          empleadoPortalService.getPerfil(),
          empleadoPortalService.getLiquidaciones(),
        ]);
        setPerfil(perfilRes);
        setLiquidaciones(liqRes);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la información de su portal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadPdf = async (liq: Liquidacion) => {
    try {
      setDownloadingId(liq.id);
      await empleadoPortalService.descargarPdf(
        liq.id,
        liq.numeroComprobante || `${liq.id}`
      );
    } catch (err: any) {
      alert(`Error al descargar el volante de pago: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Error de Consulta</h2>
        <p className="text-sm text-red-300 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30">
              {perfil?.nombre[0]}
              {perfil?.apellido[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {perfil?.nombre} {perfil?.apellido}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Colaborador
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-500" />
                <span>Cargo: <strong className="text-slate-200">{perfil?.cargo?.nombre || 'Colaborador'}</strong></span>
                <span>•</span>
                <span>CC: <strong className="text-slate-200">{perfil?.documento}</strong></span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Tarifa por Hora</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {formatCOP(Number(perfil?.valorHora || 0))} /h
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Hijos Declarados</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5" />
                {perfil?.numeroHijos} {perfil?.numeroHijos === 1 ? 'hijo' : 'hijos'}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Volantes Generados</span>
              <span className="text-sm font-bold text-blue-400 mt-1 block font-mono">
                {liquidaciones.length} comprobantes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Volantes de Pago */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Mis Volantes de Pago de Nómina
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulte el desglose detallado y descargue sus comprobantes oficiales en PDF
            </p>
          </div>
        </div>

        {liquidaciones.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Aún no tiene liquidaciones generadas</p>
            <p className="text-xs text-slate-500 mt-1">
              Cuando el departamento de Nómina o RRHH procese su periodo laboral, aparecerá aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-semibold">Comprobante N°</th>
                  <th className="pb-3 font-semibold">Periodo</th>
                  <th className="pb-3 font-semibold">Horas</th>
                  <th className="pb-3 font-semibold">Salario Bruto</th>
                  <th className="pb-3 font-semibold">Bono Hijos</th>
                  <th className="pb-3 font-semibold">Seg. Social</th>
                  <th className="pb-3 font-semibold">Neto a Consignar</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {liquidaciones.map((liq) => (
                  <tr key={liq.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 font-mono text-xs font-bold text-blue-400">
                      {liq.numeroComprobante || `NOM-${liq.periodo}-${liq.id}`}
                    </td>
                    <td className="py-3.5 font-medium text-white">
                      {formatPeriodo(liq.periodo)} ({liq.periodo})
                    </td>
                    <td className="py-3.5 text-slate-300 font-mono">
                      {liq.horasTrabajadas}h
                    </td>
                    <td className="py-3.5 text-slate-300 font-mono">
                      {formatCOP(Number(liq.salarioBruto))}
                    </td>
                    <td className="py-3.5 text-emerald-400 font-mono font-medium">
                      +{formatCOP(Number(liq.bonoHijos))}
                    </td>
                    <td className="py-3.5 text-red-400 font-mono">
                      -{formatCOP(Number(liq.valorSeguridadSocial))}
                    </td>
                    <td className="py-3.5 font-bold text-emerald-400 font-mono text-base">
                      {formatCOP(Number(liq.salarioNeto))}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          liq.estado === 'CALCULADA'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {liq.estado}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedLiquidacion(liq)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Ver Detalle
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(liq)}
                        disabled={downloadingId === liq.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        {downloadingId === liq.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Descargar PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle Completo */}
      {selectedLiquidacion && (
        <LiquidacionDetailModal
          liquidacion={selectedLiquidacion}
          isOpen={!!selectedLiquidacion}
          onClose={() => setSelectedLiquidacion(null)}
        />
      )}
    </div>
  );
};
