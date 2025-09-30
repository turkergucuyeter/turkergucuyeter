import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types/auth';
import api from '../services/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  setAuth: (data: { user: AuthUser; accessToken: string }) => void;
  clearAuth: () => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: false,
      setAuth: ({ user, accessToken }) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      refresh: async () => {
        try {
          const response = await api.post('/auth/refresh');
          set({ accessToken: response.data.accessToken });
        } catch (error) {
          console.error('Token yenileme başarısız', error);
          get().clearAuth();
        }
      }
    }),
    {
      name: 'auth-store'
    }
  )
);
