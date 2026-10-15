import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import api from '../services/api';

interface VoterState {
  voters: User[];
  isLoading: boolean;
  fetchVoters: () => Promise<void>;
  registerVoter: (data: { name: string; email: string; dob?: string; age: number; password: string }) => Promise<{ success: boolean; voter?: User; error?: string }>;
  getVoterById: (voterId: string) => User | undefined;
}

export const useVoterStore = create<VoterState>()(
  persist(
    (set, get) => ({
      voters: [],
      isLoading: false,

      fetchVoters: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/voters');
          if (response.data && response.data.success) {
            set({ voters: response.data.data });
          }
        } catch (err) {
          console.error('Failed to fetch voters:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      registerVoter: async (data) => {
        try {
          const response = await api.post('/auth/register-voter', {
            name: data.name,
            email: data.email,
            dob: data.dob,
            age: data.age,
            password: data.password,
          });

          if (response.data && response.data.success) {
            const authData = response.data.data;
            const newVoter: User = {
              id: authData.id,
              name: authData.name,
              email: authData.email,
              dob: authData.dob,
              age: authData.age,
              password: '',
              role: 'VOTER',
              status: authData.status || 'ACTIVE',
              createdAt: new Date().toISOString(),
            };

            set((state) => ({
              voters: [newVoter, ...state.voters.filter((v) => v.id !== newVoter.id)],
            }));

            return { success: true, voter: newVoter };
          } else {
            return {
              success: false,
              error: response.data?.message || 'Registration failed.',
            };
          }
        } catch (err: any) {
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            'Registration request failed.';
          return { success: false, error: errorMsg };
        }
      },

      getVoterById: (voterId: string) => {
        return get().voters.find((v) => v.id.toLowerCase() === voterId.toLowerCase());
      },
    }),
    {
      name: 'voting_voters',
    }
  )
);

