import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: string;
  store_role: string | null;
  token: string;
}

interface PendingMFA {
  tempToken: string;
  email: string;
  uid: string;
  name: string;
  role: string;
}

interface AuthContextType {
  adminUser: AdminUser | null;
  pendingMFA: PendingMFA | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'vyta_admin_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [pendingMFA, setPendingMFA] = useState<PendingMFA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/v1/auth/admin-me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        setAdminUser({ uid: data.id, email: data.email, name: data.name, role: data.role, store_role: data.store_role, token });
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        setError('Server returned an invalid response. Is the backend running?');
        return false;
      }
      if (!res.ok) {
        setError(data?.detail || 'Login failed');
        return false;
      }

      if (data.mfa_required) {
        setPendingMFA({
          tempToken: data.temp_token,
          email: data.email,
          uid: data.uid,
          name: data.name || data.email,
          role: data.role,
        });
        return true;
      }

      setStoredToken(data.access_token);
      setAdminUser({ uid: data.uid, email: data.email, name: data.name || data.email, role: data.role, store_role: data.store_role, token: data.access_token });
      return true;
    } catch {
      setError('Could not connect to server. Is the backend running?');
      return false;
    }
  };

  const verifyMFA = async (code: string): Promise<boolean> => {
    if (!pendingMFA) return false;
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/admin/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: pendingMFA.tempToken, code }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        setError('Server returned an invalid response');
        return false;
      }
      if (!res.ok) {
        setError(data?.detail || 'Verification failed');
        return false;
      }
      setStoredToken(data.access_token);
      setAdminUser({ uid: data.uid, email: data.email, name: data.name || data.email, role: data.role, store_role: data.store_role, token: data.access_token });
      setPendingMFA(null);
      return true;
    } catch {
      setError('Could not connect to server');
      return false;
    }
  };

  const logout = () => {
    setStoredToken(null);
    setAdminUser(null);
    setPendingMFA(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ adminUser, pendingMFA, loading, error, login, verifyMFA, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
