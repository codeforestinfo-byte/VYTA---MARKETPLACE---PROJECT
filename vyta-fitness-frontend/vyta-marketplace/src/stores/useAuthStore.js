import { create } from 'zustand';
import { api, setToken, clearToken, getToken, getRole } from '../api';

export const useAuthStore = create((set) => ({
  user: null,
  token: getToken(),
  role: getRole(),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token, data.role);
      set({ token: data.access_token, role: data.role, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(data.access_token, data.role);
      set({ token: data.access_token, role: data.role, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  googleLogin: async (idToken) => {
    set({ loading: true });
    try {
      const data = await api('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ id_token: idToken }),
      });
      setToken(data.access_token, data.role);
      set({ token: data.access_token, role: data.role, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchUser: async () => {
    try {
      const user = await api('/auth/me');
      set({ user });
      return user;
    } catch {
      return null;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, role: null });
  },
}));
