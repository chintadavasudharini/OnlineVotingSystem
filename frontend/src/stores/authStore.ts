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

export const normalizeRole = (r?: any): Role | null => {
  if (!r || typeof r !== 'string') return null;
  const upper = r.toUpperCase();
  if (upper === 'ADMIN' || upper === 'VOTER' || upper === 'CANDIDATE') {
    return upper as Role;
  }
  return null;
};

export const decodeJwtPayload = (jwt: string): any | null => {
  try {
    if (!jwt || typeof jwt !== 'string') return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const decoded = atob(b64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenExpired = (jwt: string): boolean => {
  try {
    if (!jwt || typeof jwt !== 'string') return true;
    const payload = decodeJwtPayload(jwt);
    if (!payload) return false;
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

    let parsedState: any = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsedState = parsed.state || parsed;
      } catch {}
    }

    const effectiveToken = parsedState?.token || token;

    if (effectiveToken && !isTokenExpired(effectiveToken)) {
      if (!token) {
        localStorage.setItem('voting_auth_token', effectiveToken);
      }

      const userRole = normalizeRole(parsedState?.role || parsedState?.currentUser?.role);
      const payload = decodeJwtPayload(effectiveToken);
      const jwtRole = normalizeRole(payload?.role);
      const finalRole = userRole || jwtRole;

      if (finalRole) {
        let finalUser = parsedState?.currentUser;
        if (!finalUser || !finalUser.id) {
          const sub = (payload?.sub || 'user') as string;
          const name = (payload?.name || sub) as string;
          finalUser = {
            id: sub,
            name: name,
            email: parsedState?.currentUser?.email || '',
            age: parsedState?.currentUser?.age || 0,
            password: '',
            role: finalRole,
            voterId: parsedState?.currentUser?.voterId,
          };
        } else {
          finalUser = {
            ...finalUser,
            role: finalRole,
          };
        }

        return {
          currentUser: finalUser,
          isAuthenticated: true,
          role: finalRole,
          token: effectiveToken,
          isHydrated: true,
        };
      }
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
        if (!persistedState) return currentState;

        const effectiveToken = persistedState.token || currentState.token;
        if (effectiveToken && isTokenExpired(effectiveToken)) {
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

        const role = normalizeRole(persistedState.role || persistedState.currentUser?.role || currentState.role);
        const user = persistedState.currentUser || currentState.currentUser;
        const validAuth = !!(effectiveToken && !isTokenExpired(effectiveToken) && role);

        return {
          ...currentState,
          ...persistedState,
          currentUser: user ? { ...user, role: role || user.role } : null,
          role: role,
          isAuthenticated: validAuth,
          token: effectiveToken,
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
