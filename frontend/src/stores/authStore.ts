import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import { useVoterStore } from './voterStore';
import { useCandidateStore } from './candidateStore';
import { useAuditStore } from './auditStore';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  login: (
    identifier: string,
    password: string,
    intendedRole: Role
  ) => { success: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      role: null,

      login: (identifier, password, intendedRole) => {
        const trimmedId = identifier.trim();

        if (intendedRole === 'ADMIN') {
          if (trimmedId.toLowerCase() === 'admin' && password === 'admin') {
            const adminUser: User = {
              id: 'admin',
              name: 'System Administrator',
              email: 'admin@system.local',
              age: 99,
              password: '',
              role: 'ADMIN',
              status: 'ACTIVE',
            };
            set({
              currentUser: adminUser,
              isAuthenticated: true,
              role: 'ADMIN',
            });
            return { success: true };
          } else {
            return { success: false, error: 'Invalid admin credentials.' };
          }
        }

        if (intendedRole === 'VOTER') {
          const voters = useVoterStore.getState().voters;
          const voter = voters.find(
            (v) => v.id.toLowerCase() === trimmedId.toLowerCase()
          );

          if (!voter || voter.password !== password) {
            return { success: false, error: 'Invalid Voter ID or password.' };
          }

          set({
            currentUser: voter,
            isAuthenticated: true,
            role: 'VOTER',
          });

          useAuditStore.getState().addLog({
            userId: voter.id,
            role: 'VOTER',
            action: 'Login',
            details: `${voter.id} (${voter.name}) logged in`,
          });

          return { success: true };
        }

        if (intendedRole === 'CANDIDATE') {
          const candidates = useCandidateStore.getState().candidates;
          const candidate = candidates.find(
            (c) => c.id.toLowerCase() === trimmedId.toLowerCase()
          );

          if (!candidate || candidate.password !== password) {
            return { success: false, error: 'Invalid Candidate ID or password.' };
          }

          set({
            currentUser: candidate,
            isAuthenticated: true,
            role: 'CANDIDATE',
          });

          useAuditStore.getState().addLog({
            userId: candidate.id,
            role: 'CANDIDATE',
            action: 'Login',
            details: `${candidate.id} (${candidate.name}) logged in`,
          });

          return { success: true };
        }

        return { success: false, error: 'Invalid login role.' };
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser && currentUser.role !== 'ADMIN') {
          useAuditStore.getState().addLog({
            userId: currentUser.id,
            role: currentUser.role,
            action: 'Logout',
            details: `${currentUser.id} logged out`,
          });
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          role: null,
        });
      },
    }),
    {
      name: 'voting_auth_session',
    }
  )
);
