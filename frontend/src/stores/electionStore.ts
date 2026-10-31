import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Election, ElectionStatus } from '../types';
import api from '../services/api';

export { isVoterEligible, isCandidateEligible } from '../utils/eligibility';

interface ElectionState {
  elections: Election[];
  isLoading: boolean;
  fetchElections: () => Promise<void>;
  createElection: (
    data: Omit<
      Election,
      'id' | 'resultsPublished' | 'createdAt' | 'eligibleVoterIds' | 'eligibleCandidateIds'
    >
  ) => Promise<{ success: boolean; election?: Election; error?: string }>;
  updateElection: (
    id: string,
    data: Partial<Election>
  ) => Promise<{ success: boolean; election?: Election; error?: string }>;
  deleteElection: (id: string) => Promise<{ success: boolean; error?: string }>;
  publishResults: (electionId: string) => Promise<{ success: boolean; error?: string }>;
  getElectionById: (id: string) => Election | undefined;
  getElectionStatus: (election: Election, referenceTime?: Date) => ElectionStatus;
}

export const calculateElectionStatus = (election: Election, referenceTime: Date = new Date()): ElectionStatus => {
  const now = referenceTime.getTime();
  const regStart = new Date(election.registrationStart).getTime();
  const regEnd = new Date(election.registrationEnd).getTime();
  const voteStart = new Date(election.votingStart).getTime();
  const voteEnd = new Date(election.votingEnd).getTime();

  if (now < regStart) {
    return 'UPCOMING';
  } else if (now >= regStart && now <= regEnd) {
    return 'REGISTRATION_OPEN';
  } else if (now >= voteStart && now <= voteEnd) {
    return 'VOTING_OPEN';
  } else if (now > voteEnd) {
    return 'COMPLETED';
  } else {
    // between registrationEnd and votingStart
    return 'UPCOMING';
  }
};

export const useElectionStore = create<ElectionState>()(
  persist(
    (set, get) => ({
      elections: [],
      isLoading: false,

      fetchElections: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/elections');
          if (response.data && response.data.success) {
            const backendElections: Election[] = response.data.data.map((e: any) => ({
              id: e.id,
              name: e.title || e.name,
              description: e.description,
              registrationStart: e.registrationStart,
              registrationEnd: e.registrationEnd,
              votingStart: e.votingStart,
              votingEnd: e.votingEnd,
              resultsPublished: e.resultsPublished,
              createdAt: e.createdAt,
              eligibleVoterIds: [],
              eligibleCandidateIds: [],
              totalVotes: e.totalVotes ?? 0,
              totalVoters: e.totalVoters ?? 0,
              candidateCount: e.candidateCount ?? 0,
            }));
            set({ elections: backendElections });
          }
        } catch (err) {
          console.error('Failed to load elections from backend:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      getElectionStatus: (election, referenceTime) => {
        return calculateElectionStatus(election, referenceTime);
      },

      getElectionById: (id: string) => {
        return get().elections.find((e) => e.id.toLowerCase() === id.toLowerCase());
      },

      createElection: async (data) => {
        try {
          const payload = {
            title: data.name,
            description: data.description,
            registrationStart: data.registrationStart.includes('.')
              ? data.registrationStart.split('.')[0]
              : data.registrationStart.replace('Z', ''),
            registrationEnd: data.registrationEnd.includes('.')
              ? data.registrationEnd.split('.')[0]
              : data.registrationEnd.replace('Z', ''),
            votingStart: data.votingStart.includes('.')
              ? data.votingStart.split('.')[0]
              : data.votingStart.replace('Z', ''),
            votingEnd: data.votingEnd.includes('.')
              ? data.votingEnd.split('.')[0]
              : data.votingEnd.replace('Z', ''),
          };

          const response = await api.post('/elections', payload);

          if (response.data && response.data.success) {
            const e = response.data.data;
            const newElection: Election = {
              id: e.id,
              name: e.title || data.name,
              description: e.description,
              registrationStart: e.registrationStart,
              registrationEnd: e.registrationEnd,
              votingStart: e.votingStart,
              votingEnd: e.votingEnd,
              resultsPublished: e.resultsPublished || false,
              createdAt: e.createdAt || new Date().toISOString(),
              eligibleVoterIds: [],
              eligibleCandidateIds: [],
            };

            set((state) => ({
              elections: [newElection, ...state.elections.filter((x) => x.id !== newElection.id)],
            }));

            return { success: true, election: newElection };
          } else {
            return {
              success: false,
              error: response.data?.message || 'Failed to create election.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Error creating election on backend.';
          return { success: false, error: msg };
        }
      },

      publishResults: async (electionId: string) => {
        try {
          const response = await api.post(`/elections/${electionId}/publish-results`);
          if (response.data && response.data.success) {
            set((state) => ({
              elections: state.elections.map((e) =>
                e.id.toLowerCase() === electionId.toLowerCase() ? { ...e, resultsPublished: true } : e
              ),
            }));
            return { success: true };
          } else {
            return { success: false, error: response.data?.message || 'Publishing failed.' };
          }
        } catch (err: any) {
          return {
            success: false,
            error: err.response?.data?.message || err.message || 'Error publishing results.',
          };
        }
      },

      updateElection: async (id: string, data: Partial<Election>) => {
        try {
          const payload = {
            title: data.name,
            description: data.description,
            registrationStart: data.registrationStart?.includes('.')
              ? data.registrationStart.split('.')[0]
              : data.registrationStart?.replace('Z', ''),
            registrationEnd: data.registrationEnd?.includes('.')
              ? data.registrationEnd.split('.')[0]
              : data.registrationEnd?.replace('Z', ''),
            votingStart: data.votingStart?.includes('.')
              ? data.votingStart.split('.')[0]
              : data.votingStart?.replace('Z', ''),
            votingEnd: data.votingEnd?.includes('.')
              ? data.votingEnd.split('.')[0]
              : data.votingEnd?.replace('Z', ''),
          };

          const response = await api.put(`/elections/${id}`, payload);

          if (response.data && response.data.success) {
            const e = response.data.data;
            const updatedElection: Election = {
              id: e.id,
              name: e.title || data.name || '',
              description: e.description,
              registrationStart: e.registrationStart,
              registrationEnd: e.registrationEnd,
              votingStart: e.votingStart,
              votingEnd: e.votingEnd,
              resultsPublished: e.resultsPublished || false,
              createdAt: e.createdAt,
              eligibleVoterIds: [],
              eligibleCandidateIds: [],
              candidateCount: e.candidateCount ?? 0,
              totalVotes: e.totalVotes ?? 0,
              totalVoters: e.totalVoters ?? 0,
            };

            set((state) => ({
              elections: state.elections.map((item) =>
                item.id.toLowerCase() === id.toLowerCase() ? updatedElection : item
              ),
            }));

            return { success: true, election: updatedElection };
          } else {
            return {
              success: false,
              error: response.data?.message || 'Failed to update election.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Error updating election on backend.';
          return { success: false, error: msg };
        }
      },

      deleteElection: async (id: string) => {
        try {
          const response = await api.delete(`/elections/${id}`);
          if (response.data && response.data.success) {
            set((state) => ({
              elections: state.elections.filter((item) => item.id.toLowerCase() !== id.toLowerCase()),
            }));
            return { success: true };
          } else {
            return {
              success: false,
              error: response.data?.message || 'Failed to delete election.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Error deleting election on backend.';
          return { success: false, error: msg };
        }
      },
    }),
    {
      name: 'voting_elections',
    }
  )
);
