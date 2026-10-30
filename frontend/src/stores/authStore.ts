import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import api from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  token: string | null;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  login: (
    identifier: string,
    password: string,
    intendedRole: Role
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
}

const isTokenExpired = (jwt: string): boolean => {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number') {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return false;
  }
};

const getInitialAuth = () => {
  try {
    const raw = localStorage.getItem('voting_auth_session');
    let token = localStorage.getItem('voting_auth_token');

    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed.state || parsed;
      const effectiveToken = state.token || token;

      if (effectiveToken && !isTokenExpired(effectiveToken)) {
        if (!token) {
          localStorage.setItem('voting_auth_token', effectiveToken);
        }
        if (state.currentUser) {
          return {
            currentUser: state.currentUser,
            isAuthenticated: true,
            role: (state.role || state.currentUser.role) as Role,
            token: effectiveToken,
            isHydrated: true,
          };
        }
      }
    }

    if (token && !isTokenExpired(token)) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const role = payload.role as Role;
          const sub = payload.sub as string;
          const name = payload.name as string;
          if (role && sub) {
            return {
              currentUser: {
                id: sub,
                name: name || sub,
                email: '',
                age: 0,
                password: '',
                role: role,
              },
              isAuthenticated: true,
              role: role,
              token: token,
              isHydrated: true,
            };
          }
        }
      } catch {}
    }
  } catch {}

  return {
    currentUser: null,
    isAuthenticated: false,
    role: null,
    token: null,
    isHydrated: true,
  };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: initialAuth.currentUser,
      isAuthenticated: initialAuth.isAuthenticated,
      role: initialAuth.role,
      token: initialAuth.token,
      isHydrated: initialAuth.isHydrated,

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },

      setUser: (user: User, token: string) => {
        localStorage.setItem('voting_auth_token', token);
        set({
          currentUser: user,
          isAuthenticated: true,
          role: user.role,
          token,
          isHydrated: true,
        });
      },

      login: async (identifier, password, intendedRole) => {
        const trimmedId = identifier.trim();

        try {
          const response = await api.post('/auth/login', {
            identifier: trimmedId,
            password,
            role: intendedRole,
          });

          if (response.data && response.data.success) {
            const data = response.data.data;
            const token = data.token;
            const user: User = {
              id: data.id,
              name: data.name,
              email: data.email,
              dob: data.dob,
              age: data.age,
              password: '',
              role: data.role as Role,
              status: data.status,
              voterId: data.voterId,
            };

            localStorage.setItem('voting_auth_token', token);
            set({
              currentUser: user,
              isAuthenticated: true,
              role: user.role,
              token,
              isHydrated: true,
            });

            return { success: true };
          } else {
            return {
              success: false,
              error: response.data?.message || 'Login failed. Please check your credentials.',
            };
          }
        } catch (error: any) {
          const errMsg =
            error.response?.data?.message ||
            error.message ||
            'Unable to connect to authentication server.';
          return { success: false, error: errMsg };
        }
      },

      logout: () => {
        localStorage.removeItem('voting_auth_token');
        localStorage.removeItem('voting_auth_session');
        set({
          currentUser: null,
          isAuthenticated: false,
          role: null,
          token: null,
          isHydrated: true,
        });
      },
    }),
    {
      name: 'voting_auth_session',
      merge: (persistedState: any, currentState: any) => {
        if (persistedState && persistedState.token && isTokenExpired(persistedState.token)) {
          localStorage.removeItem('voting_auth_token');
          localStorage.removeItem('voting_auth_session');
          return {
            ...currentState,
            currentUser: null,
            isAuthenticated: false,
            role: null,
            token: null,
            isHydrated: true,
          };
        }
        return {
          ...currentState,
          ...persistedState,
          isHydrated: true,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
