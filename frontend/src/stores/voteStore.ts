import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vote, CandidateResult, User } from '../types';
import { useAuditStore } from './auditStore';
import { useElectionStore } from './electionStore';
import { useVoterStore } from './voterStore';
import { isVoterEligible } from '../utils/eligibility';

interface VoteState {
  votes: Vote[];
  castVote: (params: {
    voterId: string;
    electionId: string;
    candidateId: string;
    electionName?: string;
  }) => { success: boolean; message: string };
  hasVoted: (voterId: string, electionId: string) => boolean;
  getVotesForElection: (electionId: string) => Vote[];
  getElectionResults: (electionId: string, candidates: User[]) => {
    results: CandidateResult[];
    totalVotes: number;
  };
}

export const useVoteStore = create<VoteState>()(
  persist(
    (set, get) => ({
      votes: [],

      hasVoted: (voterId: string, electionId: string) => {
        return get().votes.some((v) => v.voterId === voterId && v.electionId === electionId);
      },

      castVote: ({ voterId, electionId, candidateId, electionName }) => {
        const voter = useVoterStore.getState().getVoterById(voterId);
        if (!voter) {
          return {
            success: false,
            message: 'A voter must have a valid Voter account.',
          };
        }

        const election = useElectionStore.getState().getElectionById(electionId);
        if (!election) {
          return {
            success: false,
            message: 'Election not found.',
          };
        }

        const status = useElectionStore.getState().getElectionStatus(election);
        if (status !== 'VOTING_OPEN') {
          return {
            success: false,
            message: 'Voting is not currently open for this election.',
          };
        }

        if (!isVoterEligible(election, voterId, voter)) {
          return {
            success: false,
            message: 'You are not eligible to vote in this election because your voter account was registered after the voting period started.',
          };
        }

        if (get().hasVoted(voterId, electionId)) {
          return {
            success: false,
            message: 'You have already voted in this election. A voter can cast only one vote per election.',
          };
        }

        const newVote: Vote = {
          id: `VOTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          electionId,
          voterId,
          candidateId,
          votedAt: new Date().toISOString(),
        };

        set((state) => ({
          votes: [...state.votes, newVote],
        }));

        useAuditStore.getState().addLog({
          userId: voterId,
          role: 'VOTER',
          action: 'Cast Vote',
          details: `${voterId} cast vote in ${electionName || electionId}`,
        });

        return {
          success: true,
          message: '✓ Vote Submitted Successfully. Your vote has been recorded.',
        };
      },

      getVotesForElection: (electionId: string) => {
        return get().votes.filter((v) => v.electionId === electionId);
      },

      getElectionResults: (electionId: string, candidates: User[]) => {
        const electionVotes = get().getVotesForElection(electionId);
        const totalVotes = electionVotes.length;

        // Group votes per candidate
        const voteCounts: Record<string, number> = {};
        for (const candidate of candidates) {
          voteCounts[candidate.id] = 0;
        }

        for (const vote of electionVotes) {
          voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
        }

        const results: CandidateResult[] = candidates.map((cand) => {
          const count = voteCounts[cand.id] || 0;
          return {
            candidateId: cand.id,
            candidateName: cand.name,
            votes: count,
            percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
          };
        });

        // Sort descending by votes
        results.sort((a, b) => b.votes - a.votes);

        return {
          results,
          totalVotes,
        };
      },
    }),
    {
      name: 'voting_votes',
    }
  )
);
