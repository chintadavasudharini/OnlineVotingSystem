import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Election, ElectionStatus } from '../types';
import { useVoterStore } from './voterStore';
import { useCandidateStore } from './candidateStore';

export { isVoterEligible, isCandidateEligible } from '../utils/eligibility';

interface ElectionState {
  elections: Election[];
  createElection: (
    data: Omit<
      Election,
      'id' | 'resultsPublished' | 'createdAt' | 'eligibleVoterIds' | 'eligibleCandidateIds'
    >
  ) => Election;
  publishResults: (electionId: string) => void;
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

      getElectionStatus: (election, referenceTime) => {
        return calculateElectionStatus(election, referenceTime);
      },

      getElectionById: (id: string) => {
        return get().elections.find((e) => e.id === id);
      },

      createElection: (data) => {
        const id = `E${get().elections.length + 1}`;
        const createdAt = new Date().toISOString();
        const eligibleVoterIds = useVoterStore.getState().voters.map((v) => v.id);
        const eligibleCandidateIds = useCandidateStore.getState().candidates.map((c) => c.id);

        const newElection: Election = {
          ...data,
          id,
          createdAt,
          eligibleVoterIds,
          eligibleCandidateIds,
          resultsPublished: false,
        };

        set((state) => ({
          elections: [newElection, ...state.elections],
        }));

        return newElection;
      },

      publishResults: (electionId: string) => {
        set((state) => ({
          elections: state.elections.map((e) =>
            e.id === electionId ? { ...e, resultsPublished: true } : e
          ),
        }));
      },
    }),
    {
      name: 'voting_elections',
    }
  )
);
