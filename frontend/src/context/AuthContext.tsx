import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, RolUsuario } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  role: RolUsuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRrhh: boolean;
  isEmpleado: boolean;
  loading: boolean;
  login: (correo: string, passwordPlain: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar sesión al montar
    const initAuth = async () => {
      const storedToken = authService.getStoredToken();
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('nomina_user', JSON.stringify(profile));
        } catch {
          // Token expirado o inválido
          localStorage.removeItem('nomina_token');
          localStorage.removeItem('nomina_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (correo: string, passwordPlain: string) => {
    const res = await authService.login(correo, passwordPlain);
    setUser(res.usuario);
    setToken(res.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const role = user?.rol || null;
  const isAuthenticated = !!user && !!token;
  const isAdmin = role === 'ADMIN';
  const isRrhh = role === 'RRHH';
  const isEmpleado = role === 'EMPLEADO';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isAdmin,
        isRrhh,
        isEmpleado,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
