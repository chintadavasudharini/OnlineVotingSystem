import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vote, CandidateResult, User } from '../types';
import api from '../services/api';

interface VoteState {
  votes: Vote[];
  castVote: (params: {
    voterId: string;
    electionId: string;
    candidateId: string;
    electionName?: string;
  }) => Promise<{ success: boolean; message: string }>;
  hasVoted: (voterId: string, electionId: string) => boolean;
  checkHasVoted: (electionId: string) => Promise<boolean>;
  getVotesForElection: (electionId: string) => Vote[];
  fetchResults: (electionId: string) => Promise<{ results: CandidateResult[]; totalVotes: number }>;
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

      checkHasVoted: async (electionId: string) => {
        try {
          const response = await api.get(`/votes/has-voted/${electionId}`);
          if (response.data && response.data.success) {
            return !!response.data.data;
          }
          return false;
        } catch {
          return false;
        }
      },

      castVote: async ({ voterId, electionId, candidateId }) => {
        try {
          const response = await api.post('/votes/cast', {
            electionId,
            candidateId,
          });

          if (response.data && response.data.success) {
            const recorded = response.data.data;
            const newVote: Vote = {
              id: recorded.id?.toString() || `VOTE-${Date.now()}`,
              electionId,
              voterId,
              candidateId,
              votedAt: recorded.votedAt || new Date().toISOString(),
            };

            set((state) => ({
              votes: [...state.votes, newVote],
            }));

            return {
              success: true,
              message: '✓ Vote Submitted Successfully. Your vote has been recorded securely.',
            };
          } else {
            return {
              success: false,
              message: response.data?.message || 'Vote casting failed.',
            };
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Unable to submit ballot to voting server.';
          return { success: false, message: msg };
        }
      },

      fetchResults: async (electionId: string) => {
        try {
          const response = await api.get(`/votes/results/${electionId}`);
          if (response.data && response.data.success) {
            const data = response.data.data;
            const results: CandidateResult[] = (data.candidateResults || []).map((r: any) => ({
              candidateId: r.candidateId,
              candidateName: r.candidateName,
              votes: r.votesReceived || 0,
              percentage: Math.round(r.votePercentage || 0),
            }));

            return {
              results,
              totalVotes: data.totalVotes || 0,
            };
          }
        } catch (err) {
          console.error('Error fetching results:', err);
        }
        return { results: [], totalVotes: 0 };
      },

      getVotesForElection: (electionId: string) => {
        return get().votes.filter((v) => v.electionId === electionId);
      },

      getElectionResults: (electionId: string, candidates: User[]) => {
        const electionVotes = get().getVotesForElection(electionId);
        const totalVotes = electionVotes.length;

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

