import React from 'react';
import { Navbar } from './components/Navbar';
import { EmployeesPage } from './pages/EmployeesPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <EmployeesPage />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">Sistema de Automatización de Nómina • Parte 1</p>
          <p className="mt-1">
            Empresa Financiera &copy; {new Date().getFullYear()} - Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
