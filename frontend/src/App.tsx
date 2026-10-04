import React, { useState } from 'react';
import { Navbar, NavModule } from './components/Navbar';
import { EmployeesPage } from './pages/EmployeesPage';
import { HorasPage } from './pages/HorasPage';
import { LiquidacionesPage } from './pages/LiquidacionesPage';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<NavModule>('liquidaciones');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeModule={activeModule} onSelectModule={setActiveModule} />
      
      <main className="flex-1">
        {activeModule === 'empleados' && <EmployeesPage />}
        {activeModule === 'horas' && <HorasPage />}
        {activeModule === 'liquidaciones' && <LiquidacionesPage />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Sistema de Automatización de Nómina • Parte 2: Motor de Liquidación
          </p>
          <p className="mt-1 text-slate-400">
            Empresa Financiera &copy; {new Date().getFullYear()} - Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
