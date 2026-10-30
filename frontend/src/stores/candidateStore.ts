import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CandidateRegistration } from '../types';
import api from '../services/api';

export const normalizeKeyPromises = (promises: any): string[] => {
  if (Array.isArray(promises)) {
    return promises
      .map((p) => (typeof p === 'string' ? p.trim() : String(p || '')))
      .filter((p) => p.length > 0);
  }
  if (typeof promises === 'string') {
    return promises
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  return [];
};

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
  checkIsRegistered: (electionId: string) => Promise<boolean>;
  getCandidatesForElection: (electionId: string) => User[];
  fetchCandidatesForElection: (electionId: string) => Promise<User[]>;
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
        const found = get().registrations.find(
          (reg) =>
            reg.candidateId?.toLowerCase() === candidateId?.toLowerCase() &&
            reg.electionId?.toLowerCase() === electionId?.toLowerCase()
        );
        if (!found) return undefined;
        return {
          ...found,
          keyPromises: normalizeKeyPromises(found.keyPromises),
        };
      },

      isRegisteredForElection: (candidateId: string, electionId: string) => {
        return get().registrations.some(
          (reg) =>
            reg.candidateId?.toLowerCase() === candidateId?.toLowerCase() &&
            reg.electionId?.toLowerCase() === electionId?.toLowerCase()
        );
      },

      checkIsRegistered: async (electionId: string) => {
        try {
          const response = await api.get('/candidates/is-registered', {
            params: { electionId },
          });
          if (response.data && response.data.success) {
            return !!response.data.data;
          }
        } catch {}
        return false;
      },

      fetchCandidatesForElection: async (electionId: string) => {
        try {
          const response = await api.get(`/candidates/election/${electionId}`);
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const rawList = response.data.data;
            const newCandidates: User[] = rawList.map((item: any) => ({
              id: item.candidateId,
              name: item.name,
              email: item.email,
              dob: '',
              age: item.age,
              password: '',
              role: 'CANDIDATE' as const,
              status: 'ACTIVE' as const,
              voterId: item.voterId,
              createdAt: item.registeredAt || new Date().toISOString(),
            }));

            const newRegs: CandidateRegistration[] = rawList.map((item: any) => ({
              id: `CR-${item.candidateId}-${electionId}`,
              candidateId: item.candidateId,
              electionId,
              registeredAt: item.registeredAt || new Date().toISOString(),
              manifestoTitle: item.manifestoTitle,
              visionStatement: item.visionStatement,
              keyPromises: normalizeKeyPromises(item.keyPromises),
            }));

            set((state) => {
              const candMap = new Map(state.candidates.map((c) => [c.id.toLowerCase(), c]));
              newCandidates.forEach((c) => candMap.set(c.id.toLowerCase(), c));

              const regMap = new Map(
                state.registrations.map((r) => [`${r.candidateId.toLowerCase()}_${r.electionId.toLowerCase()}`, r])
              );
              newRegs.forEach((r) => regMap.set(`${r.candidateId.toLowerCase()}_${r.electionId.toLowerCase()}`, r));

              return {
                candidates: Array.from(candMap.values()),
                registrations: Array.from(regMap.values()),
              };
            });

            return newCandidates;
          }
        } catch (err) {
          console.error('Failed to fetch candidates for election:', err);
        }
        return get().getCandidatesForElection(electionId);
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
            const parsedPromises = normalizeKeyPromises(reg?.keyPromises || manifesto?.keyPromises);
            const newReg: CandidateRegistration = {
              id: reg?.id ? String(reg.id) : `CR-${Date.now()}`,
              candidateId,
              electionId,
              registeredAt: reg?.registeredAt || new Date().toISOString(),
              manifestoTitle: reg?.manifestoTitle || manifesto?.manifestoTitle,
              visionStatement: reg?.visionStatement || manifesto?.visionStatement,
              keyPromises: parsedPromises,
            };

            set((state) => ({
              registrations: [
                ...state.registrations.filter(
                  (r) =>
                    !(
                      r.candidateId?.toLowerCase() === candidateId.toLowerCase() &&
                      r.electionId?.toLowerCase() === electionId.toLowerCase()
                    )
                ),
                newReg,
              ],
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
          .registrations.filter((r) => r.electionId?.toLowerCase() === electionId?.toLowerCase())
          .map((r) => r.candidateId);

        return get().candidates.filter((c) =>
          registeredCandidateIds.some((candId) => candId.toLowerCase() === c.id.toLowerCase())
        );
      },
    }),
    {
      name: 'voting_candidates',
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.registrations)) {
          state.registrations = state.registrations.map((r) => ({
            ...r,
            keyPromises: normalizeKeyPromises(r.keyPromises),
          }));
        }
      },
    }
  )
);

