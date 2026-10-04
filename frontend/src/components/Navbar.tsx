import React from 'react';
import {
  Building2,
  Users,
  Clock,
  Calculator,
  LayoutDashboard,
  Shield,
  FileText,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export type NavModule = 'dashboard' | 'empleados' | 'horas' | 'liquidaciones' | 'auditoria' | 'portal';

interface NavbarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeModule, onSelectModule }) => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'RRHH':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'EMPLEADO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-3 lg:py-0 lg:h-16 gap-3">
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">
                  FinanCorp <span className="text-blue-500">Nómina</span>
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  v3.0 Automatización Total
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Sistema Integral de Liquidación y Auditoría
              </p>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
            {role !== 'EMPLEADO' && (
              <>
                <button
                  onClick={() => onSelectModule('dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeModule === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onSelectModule('empleados')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeModule === 'empleados'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Empleados</span>
                </button>

                <button
                  onClick={() => onSelectModule('horas')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeModule === 'horas'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Horas</span>
                </button>

                <button
                  onClick={() => onSelectModule('liquidaciones')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeModule === 'liquidaciones'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Liquidaciones</span>
                </button>
              </>
            )}

            {role === 'ADMIN' && (
              <button
                onClick={() => onSelectModule('auditoria')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeModule === 'auditoria'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Auditoría</span>
              </button>
            )}

            {role === 'EMPLEADO' && (
              <button
                onClick={() => onSelectModule('portal')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeModule === 'portal'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Mis Volantes de Pago</span>
              </button>
            )}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-slate-800 lg:border-t-0">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{user.nombre}</div>
                  <div className="text-[10px] text-slate-400">{user.correo}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleBadge()}`}>
                  {role}
                </span>
              </div>
            )}

            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="sm:hidden">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
