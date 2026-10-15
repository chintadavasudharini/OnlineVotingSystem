import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import api from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  token: string | null;
  login: (
    identifier: string,
    password: string,
    intendedRole: Role
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      role: null,
      token: null,

      setUser: (user: User, token: string) => {
        localStorage.setItem('voting_auth_token', token);
        set({
          currentUser: user,
          isAuthenticated: true,
          role: user.role,
          token,
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
        set({
          currentUser: null,
          isAuthenticated: false,
          role: null,
          token: null,
        });
      },
    }),
    {
      name: 'voting_auth_session',
    }
  )
);

