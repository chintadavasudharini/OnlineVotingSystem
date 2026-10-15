import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CandidateRegistration } from '../types';
import api from '../services/api';

interface CandidateState {
  candidates: User[];
  registrations: CandidateRegistration[];
  isLoading: boolean;
  fetchCandidates: () => Promise<void>;
  registerCandidateFromVoter: (params: {
    voterId: string;
    password: string;
  }) => Promise<{ success: boolean; candidate?: User; message: string }>;
  getCandidateById: (candidateId: string) => User | undefined;
  getCandidateByVoterId: (voterId: string) => User | undefined;
  registerForElection: (
    candidateId: string,
    electionId: string,
    manifesto?: {
      manifestoTitle?: string;
      visionStatement?: string;
      keyPromises?: string[];
    },
    electionName?: string
  ) => Promise<{ success: boolean; message: string }>;
  getRegistration: (candidateId: string, electionId: string) => CandidateRegistration | undefined;
  isRegisteredForElection: (candidateId: string, electionId: string) => boolean;
  getCandidatesForElection: (electionId: string) => User[];
}

export const useCandidateStore = create<CandidateState>()(
  persist(
    (set, get) => ({
      candidates: [],
      registrations: [],
      isLoading: false,

      fetchCandidates: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/candidates');
          if (response.data && response.data.success) {
            set({ candidates: response.data.data });
          }
        } catch (err) {
          console.error('Failed to fetch candidates:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      getCandidateById: (candidateId: string) => {
        return get().candidates.find((c) => c.id.toLowerCase() === candidateId.toLowerCase());
      },

      getCandidateByVoterId: (voterId: string) => {
        return get().candidates.find(
          (c) => c.voterId?.toLowerCase() === voterId.toLowerCase()
        );
      },

      registerCandidateFromVoter: async ({ voterId, password }) => {
        try {
          const response = await api.post('/auth/register-candidate', {
            voterId: voterId.trim(),
            password,
          });

          if (response.data && response.data.success) {
            const authData = response.data.data;
            const newCandidate: User = {
              id: authData.id,
              name: authData.name,
              email: authData.email,
              dob: authData.dob,
              age: authData.age,
              password: '',
              role: 'CANDIDATE',
              status: authData.status || 'ACTIVE',
              voterId: authData.voterId,
              createdAt: new Date().toISOString(),
            };

            set((state) => ({
              candidates: [newCandidate, ...state.candidates.filter((c) => c.id !== newCandidate.id)],
            }));

            return {
              success: true,
              candidate: newCandidate,
              message: `Candidate account ${newCandidate.id} created successfully!`,
            };
          } else {
            return {
              success: false,
              message: response.data?.message || 'Registration failed.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to register candidate.';
          return { success: false, message: msg };
        }
      },

      getRegistration: (candidateId: string, electionId: string) => {
        return get().registrations.find(
          (reg) => reg.candidateId === candidateId && reg.electionId === electionId
        );
      },

      isRegisteredForElection: (candidateId: string, electionId: string) => {
        return get().registrations.some(
          (reg) => reg.candidateId === candidateId && reg.electionId === electionId
        );
      },

      registerForElection: async (
        candidateId: string,
        electionId: string,
        manifesto?: {
          manifestoTitle?: string;
          visionStatement?: string;
          keyPromises?: string[];
        }
      ) => {
        try {
          const response = await api.post('/candidates/register-for-election', {
            electionId,
            manifestoTitle: manifesto?.manifestoTitle?.trim(),
            visionStatement: manifesto?.visionStatement?.trim(),
            keyPromises: manifesto?.keyPromises,
          });

          if (response.data && response.data.success) {
            const reg = response.data.data;
            const newReg: CandidateRegistration = {
              id: reg.id || `CR-${Date.now()}`,
              candidateId,
              electionId,
              registeredAt: reg.registeredAt || new Date().toISOString(),
              manifestoTitle: reg.manifestoTitle,
              visionStatement: reg.visionStatement,
              keyPromises: reg.keyPromises,
            };

            set((state) => ({
              registrations: [...state.registrations, newReg],
            }));

            return { success: true, message: '✓ You are registered for this election.' };
          } else {
            return {
              success: false,
              message: response.data?.message || 'Enrollment failed.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to enroll candidate into election.';
          return { success: false, message: msg };
        }
      },

      getCandidatesForElection: (electionId: string) => {
        const registeredCandidateIds = get()
          .registrations.filter((r) => r.electionId === electionId)
          .map((r) => r.candidateId);

        return get().candidates.filter((c) =>
          registeredCandidateIds.includes(c.id)
        );
      },
    }),
    {
      name: 'voting_candidates',
    }
  )
);

