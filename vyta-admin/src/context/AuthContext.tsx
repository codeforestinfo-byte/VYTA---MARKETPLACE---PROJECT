import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '@/src/api/auth';
import type { User } from '@/src/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vyta_admin_token');
    const stored = localStorage.getItem('vyta_admin_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('vyta_admin_token');
        localStorage.removeItem('vyta_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);

      if (res.role !== 'admin') {
        throw new Error('Access Denied. Administrator privileges required.');
      }

      localStorage.setItem('vyta_admin_token', res.access_token);

      const me = await authApi.getMe();
      const userData: User = {
        id: me.id,
        email: me.email,
        role: 'admin',
        is_active: me.is_active,
        created_at: me.created_at,
      };

      localStorage.setItem('vyta_admin_user', JSON.stringify(userData));
      setUser(userData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vyta_admin_token');
    localStorage.removeItem('vyta_admin_user');
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
