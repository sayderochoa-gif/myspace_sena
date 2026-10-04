import React, { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { Empleado, Cargo, CreateEmpleadoPayload, UpdateEmpleadoPayload } from '../types';
import { empleadoService } from '../services/empleadoService';
import { cargoService } from '../services/cargoService';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertBanner, AlertMessage } from '../components/AlertBanner';

export const EmployeesPage: React.FC = () => {
  // Datos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCargoFilter, setSelectedCargoFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Selección activa
  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null);

  // Alertas / Notificaciones
  const [alert, setAlert] = useState<AlertMessage | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    if (type === 'success') {
      setTimeout(() => {
        setAlert((current) => (current?.text === text ? null : current));
      }, 5000);
    }
  };

  // Cargar Cargos disponibles
  const loadCargos = useCallback(async () => {
    try {
      const data = await cargoService.getCargos();
      setCargos(data);
    } catch (err: unknown) {
      console.error('Error al cargar cargos:', err);
      showAlert('error', 'No se pudieron cargar los cargos del sistema.');
    }
  }, []);

  // Cargar Empleados con los filtros actuales
  const loadEmpleados = useCallback(async () => {
    setIsLoading(true);
    try {
      let activoParam: boolean | 'all' | undefined = undefined;
      if (selectedStatusFilter === 'true') activoParam = true;
      if (selectedStatusFilter === 'false') activoParam = false;
      if (selectedStatusFilter === 'all') activoParam = 'all';

      const data = await empleadoService.getEmpleados({
        search: searchTerm,
        cargoId: selectedCargoFilter ? Number(selectedCargoFilter) : undefined,
        activo: activoParam,
      });
      setEmpleados(data);
    } catch (err: unknown) {
      console.error('Error al cargar empleados:', err);
      showAlert('error', 'Error al consultar la lista de empleados.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCargoFilter, selectedStatusFilter]);

  // Carga inicial
  useEffect(() => {
    loadCargos();
  }, [loadCargos]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      loadEmpleados();
    }, 250);

    return () => clearTimeout(debounceTimeout);
  }, [loadEmpleados]);

  // Manejo de creación y edición
  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (empleado: Empleado) => {
    setSelectedEmployee(empleado);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (empleado: Empleado) => {
    setSelectedEmployee(empleado);
    setIsDetailModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateEmpleadoPayload | UpdateEmpleadoPayload) => {
    if (selectedEmployee) {
      // Actualizar empleado
      await empleadoService.updateEmpleado(selectedEmployee.id, data);
      showAlert('success', `Empleado ${data.nombre} ${data.apellido} actualizado exitosamente.`);
    } else {
      // Crear empleado nuevo
      await empleadoService.createEmpleado(data as CreateEmpleadoPayload);
      showAlert('success', `Empleado ${data.nombre} ${data.apellido} registrado exitosamente.`);
    }
    await loadEmpleados();
  };

  // Manejo de desactivación (eliminación lógica)
  const handleOpenDeactivateConfirm = (empleado: Empleado) => {
    setSelectedEmployee(empleado);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedEmployee) return;

    setIsDeactivating(true);
    try {
      await empleadoService.deactivateEmpleado(selectedEmployee.id);
      showAlert(
        'success',
        `El empleado ${selectedEmployee.nombre} ${selectedEmployee.apellido} fue desactivado correctamente.`
      );
      setIsConfirmModalOpen(false);
      setSelectedEmployee(null);
      await loadEmpleados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar empleado';
      showAlert('error', msg);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Título de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-7 h-7 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestión de Empleados
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administración centralizada del personal, asignación de cargos y control de tarifas por hora.
          </p>
        </div>

        {/* Resumen de contadores */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
            <span className="text-slate-500">Total: </span>
            <span className="font-bold text-slate-800">{empleados.length}</span>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
            <span className="text-slate-500">Activos: </span>
            <span className="font-bold text-emerald-600">
              {empleados.filter((e) => e.activo).length}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <AlertBanner alert={alert} onClose={() => setAlert(null)} />

      {/* Tabla de Empleados */}
      <EmployeeTable
        empleados={empleados}
        cargos={cargos}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedCargoFilter={selectedCargoFilter}
        selectedStatusFilter={selectedStatusFilter}
        onSearchChange={setSearchTerm}
        onCargoFilterChange={setSelectedCargoFilter}
        onStatusFilterChange={setSelectedStatusFilter}
        onRefresh={loadEmpleados}
        onOpenCreateModal={handleOpenCreate}
        onViewEmployee={handleOpenDetail}
        onEditEmployee={handleOpenEdit}
        onDeactivateEmployee={handleOpenDeactivateConfirm}
      />

      {/* Modal Formulario (Crear / Editar) */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        empleadoToEdit={selectedEmployee}
        cargos={cargos}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Modal de Detalle */}
      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        empleado={selectedEmployee}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
      />

      {/* Modal de Confirmación para Desactivar */}
      <ConfirmDialog
        isOpen={isConfirmModalOpen}
        title="Confirmar Desactivación de Empleado"
        message={
          selectedEmployee
            ? `¿Está seguro de que desea desactivar a ${selectedEmployee.nombre} ${selectedEmployee.apellido} (Documento: ${selectedEmployee.documento})? El registro permanecerá en el historial de nómina pero no figurará como personal activo.`
            : '¿Está seguro de desactivar a este empleado?'
        }
        confirmLabel="Sí, Desactivar"
        cancelLabel="Cancelar"
        isLoading={isDeactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};
