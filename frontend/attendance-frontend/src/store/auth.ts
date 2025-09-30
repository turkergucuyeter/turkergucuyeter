import { create } from 'zustand';
import api from '../lib/api';
import { AuthUser } from '../types/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setCredentials: (user: AuthUser, token: string) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  setCredentials: (user, token) => set({ user, token }),
  logout: () => {
    api.post('/auth/logout');
    set({ user: null, token: null });
  },
  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { data } = response.data;
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      set({ user: data.user, token: data.accessToken, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
