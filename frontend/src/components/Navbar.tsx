import React from 'react';
import { Building2, Users, Clock, Calculator } from 'lucide-react';

export type NavModule = 'empleados' | 'horas' | 'liquidaciones';

interface NavbarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeModule, onSelectModule }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0 sm:h-16 gap-3">
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  FinanCorp Nómina
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Parte 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistema de Automatización de Nómina • Empresa Financiera
              </p>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => onSelectModule('empleados')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeModule === 'empleados'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión de Empleados</span>
            </button>

            <button
              onClick={() => onSelectModule('horas')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeModule === 'horas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Horas Trabajadas</span>
            </button>

            <button
              onClick={() => onSelectModule('liquidaciones')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeModule === 'liquidaciones'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Liquidación de Nómina</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
