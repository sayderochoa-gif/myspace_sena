import React, { useState, useEffect } from 'react';
import { X, Briefcase, User, Mail, FileText, DollarSign, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Cargo, Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload } from '../types';
import { formatCOP } from '../utils/formatters';

interface EmployeeFormModalProps {
  isOpen: boolean;
  empleadoToEdit?: Empleado | null;
  cargos: Cargo[];
  onClose: () => void;
  onSubmit: (data: CreateEmpleadoPayload | UpdateEmpleadoPayload) => Promise<void>;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  empleadoToEdit,
  cargos,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(empleadoToEdit);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documento, setDocumento] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargoId, setCargoId] = useState<number | ''>('');
  const [valorHora, setValorHora] = useState<string>('');
  const [numeroHijos, setNumeroHijos] = useState<number>(0);
  const [activo, setActivo] = useState<boolean>(true);

  // Estados de control
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Cargo seleccionado actualmente
  const selectedCargo = cargos.find((c) => c.id === Number(cargoId));

  // Cargar datos al abrir o cambiar de modo
  useEffect(() => {
    if (empleadoToEdit) {
      setNombre(empleadoToEdit.nombre);
      setApellido(empleadoToEdit.apellido);
      setDocumento(empleadoToEdit.documento);
      setCorreo(empleadoToEdit.correo);
      setCargoId(empleadoToEdit.cargoId);
      setValorHora(empleadoToEdit.valorHora.toString());
      setNumeroHijos(empleadoToEdit.numeroHijos);
      setActivo(empleadoToEdit.activo);
    } else {
      setNombre('');
      setApellido('');
      setDocumento('');
      setCorreo('');
      setCargoId(cargos.length > 0 ? cargos[0].id : '');
      setValorHora('');
      setNumeroHijos(0);
      setActivo(true);
    }
    setErrors({});
    setServerError(null);
  }, [empleadoToEdit, cargos, isOpen]);

  // Validación de valorHora cuando cambia el valor o el cargo seleccionado
  useEffect(() => {
    if (!selectedCargo || !valorHora) return;

    const numericValor = Number(valorHora);
    if (isNaN(numericValor)) {
      setErrors((prev) => ({ ...prev, valorHora: 'El valor por hora debe ser un número válido' }));
      return;
    }

    const min = selectedCargo.valorHoraMinimo;
    const max = selectedCargo.valorHoraMaximo;

    if (numericValor < min || numericValor > max) {
      setErrors((prev) => ({
        ...prev,
        valorHora: `El valor por hora debe estar entre ${formatCOP(min)} y ${formatCOP(max)} para el cargo de ${selectedCargo.nombre}.`,
      }));
    } else {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.valorHora;
        return newErr;
      });
    }
  }, [valorHora, selectedCargo]);

  if (!isOpen) return null;

  // Validación completa antes de enviar
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    }

    if (!apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio.';
    }

    if (!documento.trim()) {
      newErrors.documento = 'El documento es obligatorio.';
    }

    if (!correo.trim()) {
      newErrors.correo = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo.trim())) {
        newErrors.correo = 'Ingrese un correo electrónico válido (ejemplo: empleado@empresa.com).';
      }
    }

    if (!cargoId) {
      newErrors.cargoId = 'Debe seleccionar un cargo.';
    }

    if (!valorHora) {
      newErrors.valorHora = 'El valor por hora es obligatorio.';
    } else if (selectedCargo) {
      const numericValor = Number(valorHora);
      if (isNaN(numericValor)) {
        newErrors.valorHora = 'El valor por hora debe ser numérico.';
      } else if (numericValor < selectedCargo.valorHoraMinimo || numericValor > selectedCargo.valorHoraMaximo) {
        newErrors.valorHora = `El valor por hora debe estar entre ${formatCOP(selectedCargo.valorHoraMinimo)} y ${formatCOP(selectedCargo.valorHoraMaximo)}.`;
      }
    }

    if (numeroHijos < 0 || isNaN(numeroHijos)) {
      newErrors.numeroHijos = 'El número de hijos no puede ser negativo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateEmpleadoPayload | UpdateEmpleadoPayload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: documento.trim(),
        correo: correo.trim().toLowerCase(),
        cargoId: Number(cargoId),
        valorHora: Number(valorHora),
        numeroHijos: Number(numeroHijos),
        ...(isEditing ? { activo } : {}),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Ocurrió un error inesperado al guardar el empleado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEditing ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Modifique los datos respetando los rangos salariales'
                  : 'Complete todos los campos obligatorios'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error general del servidor si ocurre */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan"
                  className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.nombre
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.nombre && (
                <p className="text-xs text-rose-600 mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: Pérez"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.apellido
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.apellido && (
                <p className="text-xs text-rose-600 mt-1">{errors.apellido}</p>
              )}
            </div>
          </div>

          {/* Documento y Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Documento <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 100000001"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.documento
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.documento && (
                <p className="text-xs text-rose-600 mt-1">{errors.documento}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Correo Electrónico <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="empleado@empresa.com"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.correo
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.correo && (
                <p className="text-xs text-rose-600 mt-1">{errors.correo}</p>
              )}
            </div>
          </div>

          {/* Selector de Cargo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Cargo <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={cargoId}
              onChange={(e) => setCargoId(Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.cargoId
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
              }`}
              disabled={isSubmitting}
            >
              <option value="">[ Seleccionar cargo ▼ ]</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
            {errors.cargoId && (
              <p className="text-xs text-rose-600 mt-1">{errors.cargoId}</p>
            )}

            {/* Visualización clara del rango permitido al seleccionar cargo */}
            {selectedCargo && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">
                  Cargo seleccionado: {selectedCargo.nombre}
                </span>
                <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  Valor permitido: {formatCOP(selectedCargo.valorHoraMinimo)} - {formatCOP(selectedCargo.valorHoraMaximo)}
                </span>
              </div>
            )}
          </div>

          {/* Valor por Hora y Número de Hijos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                <span>Valor por Hora (COP) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="number"
                step="any"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
                placeholder="Ej: 55000"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.valorHora
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.valorHora && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.valorHora}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Número de Hijos <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={numeroHijos}
                onChange={(e) => setNumeroHijos(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.numeroHijos
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.numeroHijos && (
                <p className="text-xs text-rose-600 mt-1">{errors.numeroHijos}</p>
              )}
            </div>
          </div>

          {/* Toggle de Estado (Activo / Inactivo) sólo si está editando */}
          {isEditing && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-800">Estado del Empleado</span>
                <p className="text-xs text-slate-500">
                  {activo ? 'El empleado se encuentra activo en nómina' : 'El empleado se encuentra inactivo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  activo ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    activo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
