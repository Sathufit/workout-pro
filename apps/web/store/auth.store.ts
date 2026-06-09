import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import type { LoginInput, RegisterInput } from '@workout-pro/shared';

interface User {
  id: string;
  email: string;
  name?: string | null;
  timezone: string;
  unitSystem: 'METRIC' | 'IMPERIAL';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (input) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/login', input);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
        await get().fetchMe();
      },

      register: async (input) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/register', input);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
        await get().fetchMe();
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken }).catch(() => {});
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data });
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ accessToken: state.accessToken, refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
