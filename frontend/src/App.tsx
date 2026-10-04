import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavModule } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { HorasPage } from './pages/HorasPage';
import { LiquidacionesPage } from './pages/LiquidacionesPage';
import { AuditoriaPage } from './pages/AuditoriaPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, role } = useAuth();
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');

  useEffect(() => {
    if (role === 'EMPLEADO') {
      setActiveModule('portal');
    } else if (role === 'ADMIN' || role === 'RRHH') {
      setActiveModule('dashboard');
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
            Iniciando Entorno Seguro...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <Navbar activeModule={activeModule} onSelectModule={setActiveModule} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeModule === 'dashboard' && role !== 'EMPLEADO' && (
          <DashboardPage onNavigateToLiquidaciones={() => setActiveModule('liquidaciones')} />
        )}
        {activeModule === 'empleados' && role !== 'EMPLEADO' && <EmployeesPage />}
        {activeModule === 'horas' && role !== 'EMPLEADO' && <HorasPage />}
        {activeModule === 'liquidaciones' && role !== 'EMPLEADO' && <LiquidacionesPage />}
        {activeModule === 'auditoria' && role === 'ADMIN' && <AuditoriaPage />}
        {activeModule === 'portal' && <EmployeePortalPage />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-400">
            FinanCorp S.A. • Sistema de Automatización de Nómina (Parte 3: Solución Integral)
          </p>
          <p className="text-slate-500">
            Auditoría Inmutable • PDFKit • Nodemailer • RBAC • PostgreSQL &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
