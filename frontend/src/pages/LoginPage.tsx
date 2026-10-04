import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Building2, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(correo, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (emailPreset: string) => {
    setCorreo(emailPreset);
    setPassword('NominaSegura2026!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              FinanCorp <span className="text-blue-500">Nómina</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Sistema Integral de Automatización</p>
          </div>
        </div>

        <h2 className="mt-8 text-center text-xl font-bold tracking-tight text-white">
          Iniciar Sesión en la Plataforma
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Ingrese sus credenciales corporativas autorizadas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@financorp.com"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Acceso Rápido para Pruebas y Demostración */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              Accesos Demo por Rol (Pruebas Académicas):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@financorp.com')}
                className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-left transition text-xs group"
              >
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">Control Total</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rrhh@financorp.com')}
                className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-left transition text-xs group"
              >
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> RRHH
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">Gestión Nómina</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('juan.perez@empresa.com')}
                className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-left transition text-xs group"
              >
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Empleado
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">Mis Volantes</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Clave general: <span className="font-mono text-slate-400">NominaSegura2026!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
