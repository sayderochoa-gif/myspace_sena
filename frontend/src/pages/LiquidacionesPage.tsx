import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  History,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  Settings,
  ShieldCheck,
  DollarSign,
  User,
  Ban,
  Download,
  Mail,
  Send,
  Building2,
} from 'lucide-react';
import {
  Liquidacion,
  Empleado,
  PrevisualizacionLiquidacion,
  CreateLiquidacionPayload,
  ConfiguracionEmpresa,
} from '../types';
import { liquidacionService } from '../services/liquidacionService';
import { empleadoService } from '../services/empleadoService';
import { horasService } from '../services/horasService';
import { empresaService } from '../services/empresaService';
import { LiquidacionDetailModal } from '../components/LiquidacionDetailModal';
import { AlertBanner } from '../components/AlertBanner';
import { formatCOP, formatPeriodo } from '../utils/formatters';


export const LiquidacionesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'liquidar' | 'historial' | 'configuracion'>('liquidar');

  // Datos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  // Formulario de Liquidación
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number>(0);
  const [periodo, setPeriodo] = useState<string>('');
  const [horasTrabajadas, setHorasTrabajadas] = useState<string>('176');
  const [preview, setPreview] = useState<PrevisualizacionLiquidacion | null>(null);

  // Configuración de Seguridad Social y Empresa
  const [porcentajeConfig, setPorcentajeConfig] = useState<number>(4);
  const [nuevoPorcentajeInput, setNuevoPorcentajeInput] = useState<string>('4');
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa | null>(null);

  // Filtros de Historial
  const [filterEmpleadoId, setFilterEmpleadoId] = useState<number>(0);
  const [filterPeriodo, setFilterPeriodo] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  // Modales y Alertas
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; data: Liquidacion | null }>({
    isOpen: false,
    data: null,
  });
  const [anularConfirm, setAnularConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('Ajuste o corrección de liquidación');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


  // Inicializar periodo por defecto al mes actual (YYYY-MM)
  useEffect(() => {
    const now = new Date();
    const currentPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setPeriodo(currentPeriodo);
  }, []);

  // Cargar Empleados y Configuración
  const loadInitialData = useCallback(async () => {
    try {
      const [emps, config, empConfig] = await Promise.all([
        empleadoService.getEmpleados({ activo: 'all' }),
        liquidacionService.getConfiguracionSeguridadSocial(),
        empresaService.getEmpresa(),
      ]);
      setEmpleados(emps);
      if (emps.length > 0 && selectedEmpleadoId === 0) {
        const primeroActivo = emps.find((e: Empleado) => e.activo);
        if (primeroActivo) setSelectedEmpleadoId(primeroActivo.id);
      }
      setPorcentajeConfig(config.porcentajeSeguridadSocial);
      setNuevoPorcentajeInput(config.porcentajeSeguridadSocial.toString());
      setEmpresa(empConfig);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos iniciales';
      setAlert({ type: 'error', message: msg });
    }
  }, [selectedEmpleadoId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cargar Historial de Liquidaciones
  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await liquidacionService.getAll({
        empleadoId: filterEmpleadoId || undefined,
        periodo: filterPeriodo || undefined,
        estado: filterEstado || undefined,
      });
      setLiquidaciones(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar historial de liquidaciones';
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [filterEmpleadoId, filterPeriodo, filterEstado]);

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistorial();
    }
  }, [activeTab, fetchHistorial]);

  // Descargar Comprobante en PDF
  const handleDownloadPdf = async (liq: Liquidacion) => {
    try {
      await liquidacionService.descargarPdf(
        liq.id,
        liq.numeroComprobante || `${liq.id}`
      );
      setAlert({
        type: 'success',
        message: `Comprobante ${liq.numeroComprobante || liq.id} descargado exitosamente`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar PDF';
      setAlert({ type: 'error', message: msg });
    }
  };

  // Reenviar Comprobante por Correo
  const handleResendEmail = async (liq: Liquidacion) => {
    try {
      const res = await liquidacionService.enviarCorreo(liq.id);
      if (res.exito) {
        setAlert({ type: 'success', message: 'Volante despachado exitosamente por correo electrónico' });
      } else {
        setAlert({ type: 'error', message: res.mensaje });
      }
      fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error despachando correo';
      setAlert({ type: 'error', message: msg });
    }
  };

  // Guardar Datos Institucionales de la Empresa
  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;
    try {
      const updated = await empresaService.updateEmpresa(empresa);
      setEmpresa(updated);
      setAlert({
        type: 'success',
        message: 'Información institucional de la empresa actualizada correctamente',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar información de la empresa';
      setAlert({ type: 'error', message: msg });
    }
  };

  // Autocargar horas registradas para el empleado y periodo seleccionado
  const handleAutoCargarHoras = async () => {

    if (!selectedEmpleadoId || !periodo) return;
    try {
      const horasRegs = await horasService.getAll({
        empleadoId: selectedEmpleadoId,
        periodo,
      });
      if (horasRegs.length > 0) {
        setHorasTrabajadas(horasRegs[0].horas.toString());
        setAlert({
          type: 'success',
          message: `Se cargaron ${horasRegs[0].horas} horas registradas previamente para este periodo.`,
        });
      } else {
        setAlert({
          type: 'error',
          message: 'No hay registro de horas previas para este empleado en el periodo seleccionado.',
        });
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // PASO 1: Calcular Previsualización (Sin Guardar)
  const handleCalcularPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!selectedEmpleadoId) {
      setAlert({ type: 'error', message: 'Debe seleccionar un empleado para liquidar' });
      return;
    }

    if (!periodo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
      setAlert({ type: 'error', message: 'El periodo debe tener el formato YYYY-MM (ej: 2026-09)' });
      return;
    }

    const horasNum = parseFloat(horasTrabajadas);
    if (isNaN(horasNum) || horasNum <= 0) {
      setAlert({ type: 'error', message: 'Las horas trabajadas deben ser un número mayor a 0' });
      return;
    }

    if (horasNum > 300) {
      setAlert({ type: 'error', message: 'Las horas trabajadas no pueden superar 300 mensuales' });
      return;
    }

    setLoadingAction(true);
    try {
      const payload: CreateLiquidacionPayload = {
        empleadoId: selectedEmpleadoId,
        periodo,
        horasTrabajadas: horasNum,
      };
      const calculo = await liquidacionService.calcularPreview(payload);
      setPreview(calculo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar la previsualización';
      setAlert({ type: 'error', message: msg });
      setPreview(null);
    } finally {
      setLoadingAction(false);
    }
  };

  // PASO 2: Confirmar y Guardar Liquidación Definitiva
  const handleConfirmarLiquidacion = async () => {
    if (!preview) return;

    setLoadingAction(true);
    setAlert(null);
    try {
      const payload: CreateLiquidacionPayload = {
        empleadoId: preview.empleadoId,
        periodo: preview.periodo,
        horasTrabajadas: preview.horasTrabajadas,
      };

      const guardada = await liquidacionService.crear(payload);
      setAlert({
        type: 'success',
        message: `¡Liquidación confirmada y guardada exitosamente para ${guardada.empleado?.nombre} ${guardada.empleado?.apellido} (Periodo: ${guardada.periodo})!`,
      });
      setPreview(null);
      setDetailModal({ isOpen: true, data: guardada });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la liquidación';
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoadingAction(false);
    }
  };

  // Anular Liquidación
  const handleAnularLiquidacion = async () => {
    if (!anularConfirm.id) return;
    try {
      await liquidacionService.anular(anularConfirm.id);
      setAlert({ type: 'success', message: 'Liquidación anulada exitosamente' });
      fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular liquidación';
      setAlert({ type: 'error', message: msg });
    } finally {
      setAnularConfirm({ isOpen: false, id: null });
    }
  };

  // Actualizar Porcentaje de Seguridad Social
  const handleUpdatePorcentaje = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(nuevoPorcentajeInput);
    if (isNaN(val) || val <= 0 || val > 100) {
      setAlert({
        type: 'error',
        message: 'El porcentaje debe ser un valor numérico entre 0.01% y 100%',
      });
      return;
    }

    try {
      const updated = await liquidacionService.updateConfiguracionSeguridadSocial(val);
      setPorcentajeConfig(updated.porcentajeSeguridadSocial);
      setAlert({
        type: 'success',
        message: `Porcentaje de seguridad social actualizado a ${updated.porcentajeSeguridadSocial}%. Las nuevas liquidaciones usarán este valor.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setAlert({ type: 'error', message: msg });
    }
  };

  const empleadoSeleccionado = empleados.find((e) => e.id === selectedEmpleadoId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Motor de Liquidación de Nómina
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Cálculo automático de salarios brutos, bonos por hijos, seguridad social y salarios netos.
          </p>
        </div>

        {/* Dynamic Percentage Badge */}
        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-600">Aporte Seguridad Social:</span>
          <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
            {porcentajeConfig}%
          </span>
        </div>
      </div>

      <AlertBanner
        alert={alert ? { type: alert.type, text: alert.message } : null}
        onClose={() => setAlert(null)}
      />

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('liquidar')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'liquidar'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Liquidar Nómina</span>
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'historial'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Liquidaciones</span>
        </button>

        <button
          onClick={() => setActiveTab('configuracion')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'configuracion'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración del Sistema</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIQUIDAR NÓMINA (Cálculo -> Previsualización -> Confirmar) */}
      {/* ============================================================== */}
      {activeTab === 'liquidar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario de Entrada */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-emerald-600" />
              <h2>Paso 1: Parámetros de Liquidación</h2>
            </div>

            <form onSubmit={handleCalcularPreview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Empleado a Liquidar <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmpleadoId}
                  onChange={(e) => {
                    setSelectedEmpleadoId(Number(e.target.value));
                    setPreview(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                >
                  <option value={0}>Seleccione un empleado...</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id} disabled={!emp.activo}>
                      {emp.nombre} {emp.apellido} - {emp.cargo?.nombre} {emp.activo ? `(${formatCOP(emp.valorHora)}/h)` : '(INACTIVO)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tarjeta de Resumen del Empleado Seleccionado */}
              {empleadoSeleccionado && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Documento:</span>
                    <span className="font-semibold text-slate-800">{empleadoSeleccionado.documento}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cargo:</span>
                    <span className="font-semibold text-slate-800">{empleadoSeleccionado.cargo?.nombre}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Valor por Hora:</span>
                    <span className="font-bold text-emerald-700">{formatCOP(empleadoSeleccionado.valorHora)} / h</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hijos Registrados:</span>
                    <span className="font-semibold text-slate-800">{empleadoSeleccionado.numeroHijos} hijos</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Periodo de Nómina (YYYY-MM) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="month"
                    value={periodo}
                    onChange={(e) => {
                      setPeriodo(e.target.value);
                      setPreview(null);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAutoCargarHoras}
                    title="Buscar horas registradas para este periodo"
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition shrink-0"
                  >
                    Cargar Horas
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Ejemplo: 2026-09 ({formatPeriodo(periodo)})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Horas Trabajadas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    step="0.5"
                    value={horasTrabajadas}
                    onChange={(e) => {
                      setHorasTrabajadas(e.target.value);
                      setPreview(null);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                    placeholder="176"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-semibold">
                    horas
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Límite mensual permitido: 1 a 300 horas.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingAction || !selectedEmpleadoId}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Calculator className="w-5 h-5" />
                  <span>{loadingAction ? 'Calculando...' : 'Calcular Liquidación'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta de Previsualización y Confirmación */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h2>Paso 2: Previsualización de Liquidación</h2>
                </div>
                {preview && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                    Pendiente de Confirmar
                  </span>
                )}
              </div>

              {!preview ? (
                <div className="py-16 text-center space-y-3">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-slate-200">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Sin cálculo para previsualizar</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Seleccione un empleado, defina el periodo y horas trabajadas, y haga clic en{' '}
                    <strong>"Calcular Liquidación"</strong> para revisar el desglose antes de guardar.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  {/* Resumen del cálculo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block">Empleado:</span>
                      <strong className="text-slate-800">{preview.empleadoNombre} {preview.empleadoApellido}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Cargo:</span>
                      <strong className="text-slate-800">{preview.cargoNombre}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Periodo:</span>
                      <strong className="text-slate-800">{formatPeriodo(preview.periodo)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Horas / Tarifa:</span>
                      <strong className="text-slate-800">{preview.horasTrabajadas}h @ {formatCOP(preview.valorHora)}</strong>
                    </div>
                  </div>

                  {/* Tabla de Conceptos */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {/* Salario Bruto */}
                      <div className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">Salario Bruto</p>
                          <p className="text-xs text-slate-400">
                            {preview.horasTrabajadas} horas × {formatCOP(preview.valorHora)}
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900 text-base">
                          {formatCOP(preview.salarioBruto)}
                        </span>
                      </div>

                      {/* Bono por Hijos */}
                      <div className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">Bono por Hijos</p>
                          <p className="text-xs text-slate-400">
                            {preview.numeroHijos} {preview.numeroHijos === 1 ? 'hijo' : 'hijos'} registrados
                          </p>
                        </div>
                        <span className="font-semibold text-emerald-600 text-base">
                          + {formatCOP(preview.bonoHijos)}
                        </span>
                      </div>

                      {/* Seguridad Social */}
                      <div className="p-3 flex justify-between items-center bg-white">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">Seguridad Social</p>
                          <p className="text-xs text-slate-400">
                            {preview.porcentajeSeguridadSocial}% sobre Salario Bruto
                          </p>
                        </div>
                        <span className="font-semibold text-rose-600 text-base">
                          - {formatCOP(preview.valorSeguridadSocial)}
                        </span>
                      </div>

                      {/* Salario Neto */}
                      <div className="p-4 flex justify-between items-center bg-slate-900 text-white">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Salario Neto Calculado
                          </p>
                          <p className="text-xs text-slate-300">
                            (Bruto + Bono Hijos - Seguridad Social)
                          </p>
                        </div>
                        <span className="text-2xl font-black text-white">
                          {formatCOP(preview.salarioNeto)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Verifique que los valores sean correctos. Al confirmar, la liquidación se
                      almacenará permanentemente con su snapshot histórico.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Confirmación */}
            {preview && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Modificar Parámetros
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarLiquidacion}
                  disabled={loadingAction}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loadingAction ? 'Guardando...' : 'Confirmar Liquidación'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: HISTORIAL DE LIQUIDACIONES */}
      {/* ============================================================== */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Filtros de Historial */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-700 font-semibold text-sm">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filtrar Historial</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Empleado
                </label>
                <select
                  value={filterEmpleadoId}
                  onChange={(e) => setFilterEmpleadoId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                >
                  <option value={0}>Todos los empleados</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Periodo
                </label>
                <input
                  type="month"
                  value={filterPeriodo}
                  onChange={(e) => setFilterPeriodo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Estado
                </label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800"
                >
                  <option value="">Todos los estados</option>
                  <option value="CALCULADA">CALCULADA</option>
                  <option value="ANULADA">ANULADA</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={() => {
                    setFilterEmpleadoId(0);
                    setFilterPeriodo('');
                    setFilterEstado('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                >
                  Limpiar
                </button>
                <button
                  onClick={fetchHistorial}
                  className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
                  title="Refrescar lista"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Liquidaciones */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-4">Comprobante</th>
                    <th className="px-4 py-4">Empleado</th>
                    <th className="px-4 py-4">Periodo</th>
                    <th className="px-4 py-4">Horas</th>
                    <th className="px-4 py-4">Salario Bruto</th>
                    <th className="px-4 py-4">Bono Hijos</th>
                    <th className="px-4 py-4">Seg. Social</th>
                    <th className="px-4 py-4">Salario Neto</th>
                    <th className="px-4 py-4">Estado</th>
                    <th className="px-4 py-4">Correo</th>
                    <th className="px-4 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && liquidaciones.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                          <p>Cargando historial de liquidaciones...</p>
                        </div>
                      </td>
                    </tr>
                  ) : liquidaciones.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p className="font-medium text-slate-700">No hay liquidaciones registradas</p>
                          <p className="text-xs text-slate-400">
                            Use la pestaña "Liquidar Nómina" para calcular y confirmar una nueva liquidación.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    liquidaciones.map((liq) => {
                      const ultimaNotif = liq.notificaciones && liq.notificaciones.length > 0 ? liq.notificaciones[0] : null;
                      const compId = liq.numeroComprobante || `NOM-${liq.periodo}-${String(liq.id).padStart(6, '0')}`;

                      return (
                        <tr key={liq.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-600 whitespace-nowrap">
                            {compId}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">
                              {liq.empleado
                                ? `${liq.empleado.nombre} ${liq.empleado.apellido}`
                                : `ID: ${liq.empleadoId}`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {liq.cargoNombre} • Doc: {liq.empleado?.documento || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-medium text-slate-700">
                              {formatPeriodo(liq.periodo)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">
                            {liq.horasTrabajadas}h
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            {formatCOP(liq.salarioBruto)}
                          </td>
                          <td className="px-4 py-3.5 text-emerald-600 font-medium">
                            {formatCOP(liq.bonoHijos)}
                          </td>
                          <td className="px-4 py-3.5 text-rose-600 font-medium">
                            {formatCOP(liq.valorSeguridadSocial)}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900 font-mono text-sm">
                            {formatCOP(liq.salarioNeto)}
                          </td>
                          <td className="px-4 py-3.5">
                            {liq.estado === 'CALCULADA' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                CALCULADA
                              </span>
                            )}
                            {liq.estado === 'ANULADA' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                                ANULADA
                              </span>
                            )}
                            {liq.estado === 'PENDIENTE' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                PENDIENTE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {ultimaNotif ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  ultimaNotif.estado === 'ENVIADO'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : ultimaNotif.estado === 'ERROR'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                <Mail className="w-3 h-3" />
                                {ultimaNotif.estado}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sin despacho</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setDetailModal({ isOpen: true, data: liq })}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Ver Comprobante y Detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(liq)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Descargar Comprobante PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {liq.estado !== 'ANULADA' && (
                              <button
                                onClick={() => handleResendEmail(liq)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Reenviar comprobante por correo electrónico"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {liq.estado !== 'ANULADA' && (
                              <button
                                onClick={() => setAnularConfirm({ isOpen: true, id: liq.id })}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Anular Liquidación"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* TAB 3: CONFIGURACIÓN DINÁMICA DE SEGURIDAD SOCIAL Y EMPRESA */}
      {/* ============================================================== */}
      {activeTab === 'configuracion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seguridad Social */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Parámetros de Liquidación</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ajuste dinámico de porcentajes globales para las liquidaciones del sistema.
              </p>
            </div>

            <form onSubmit={handleUpdatePorcentaje} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Porcentaje de Deducción por Seguridad Social (%)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={nuevoPorcentajeInput}
                    onChange={(e) => setNuevoPorcentajeInput(e.target.value)}
                    className="w-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800 font-bold"
                  />
                  <span className="text-slate-600 font-semibold">%</span>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition cursor-pointer"
                  >
                    Guardar Porcentaje
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Valor configurado actualmente: <strong>{porcentajeConfig}%</strong>.
                </p>
              </div>

              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1.5">
                <p className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Regla de Preservación Histórica:</span>
                </p>
                <p>
                  Al modificar este porcentaje, únicamente las <strong>nuevas liquidaciones</strong>{' '}
                  creadas a partir de este momento utilizarán el nuevo valor. Todas las liquidaciones
                  anteriores conservarán inalterado el porcentaje con el que fueron calculadas originalmente.
                </p>
              </div>
            </form>
          </div>

          {/* Información Institucional de la Empresa */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Membrete e Información de la Empresa</span>
              </h2>
              <p className="text-xs text-slate-500">
                Datos corporativos que figuran en el volante de pago en PDF y comunicaciones por correo.
              </p>
            </div>

            {empresa && (
              <form onSubmit={handleSaveEmpresa} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Razón Social</label>
                    <input
                      type="text"
                      value={empresa.nombre}
                      onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">NIT</label>
                    <input
                      type="text"
                      value={empresa.nit}
                      onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dirección Corporativa</label>
                  <input
                    type="text"
                    value={empresa.direccion}
                    onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={empresa.telefono}
                      onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Correo Nómina</label>
                    <input
                      type="email"
                      value={empresa.correo}
                      onChange={(e) => setEmpresa({ ...empresa, correo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sitio Web</label>
                    <input
                      type="text"
                      value={empresa.sitioWeb}
                      onChange={(e) => setEmpresa({ ...empresa, sitioWeb: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition cursor-pointer"
                  >
                    Guardar Datos Corporativos
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      <LiquidacionDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, data: null })}
        liquidacion={detailModal.data}
        onLiquidacionUpdated={fetchHistorial}
      />

      {/* Modal de Anulación con Motivo */}
      {anularConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
              <Ban className="w-5 h-5" />
              Anular Liquidación de Nómina
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Esta acción marcará el comprobante como <strong>ANULADA</strong> e incluirá una marca de anulación en el comprobante PDF oficial.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Motivo / Justificación de la Anulación: <span className="text-red-400">*</span>
              </label>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: Corrección en el registro de horas o reclamo salarial del colaborador..."
                rows={3}
                required
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAnularConfirm({ isOpen: false, id: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAnularLiquidacion}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

