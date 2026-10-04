import React from 'react';
import { Building2, ShieldCheck, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
                  Parte 1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistema de Automatización de Nómina • Gestión de Empleados
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Validaciones de Cargo Activas</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Módulo de Empleados</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
