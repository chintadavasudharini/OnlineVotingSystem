import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { useAuditStore } from './auditStore';

interface VoterState {
  voters: User[];
  registerVoter: (data: { name: string; email: string; dob?: string; age: number; password: string }) => User;
  getVoterById: (voterId: string) => User | undefined;
  getNextVoterId: () => string;
}

export const useVoterStore = create<VoterState>()(
  persist(
    (set, get) => ({
      voters: [],

      getNextVoterId: () => {
        const { voters } = get();
        let maxId = 0;
        for (const v of voters) {
          if (v.id.startsWith('V')) {
            const num = parseInt(v.id.slice(1), 10);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        }
        return `V${maxId + 1}`;
      },

      registerVoter: (data) => {
        const id = get().getNextVoterId();
        const newVoter: User = {
          id,
          name: data.name,
          email: data.email,
          dob: data.dob,
          age: data.age,
          password: data.password,
          role: 'VOTER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          voters: [...state.voters, newVoter],
        }));

        useAuditStore.getState().addLog({
          userId: id,
          role: 'VOTER',
          action: 'Registration',
          details: `${id} (${newVoter.name}) registered as Voter`,
        });

        return newVoter;
      },

      getVoterById: (voterId: string) => {
        return get().voters.find((v) => v.id === voterId);
      },
    }),
    {
      name: 'voting_voters',
    }
  )
);
