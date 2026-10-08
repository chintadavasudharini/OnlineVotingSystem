import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CandidateRegistration } from '../types';
import { useAuditStore } from './auditStore';
import { useElectionStore } from './electionStore';
import { useVoterStore } from './voterStore';

interface CandidateState {
  candidates: User[];
  registrations: CandidateRegistration[];
  registerCandidateFromVoter: (params: {
    voterId: string;
    password: string;
  }) => { success: boolean; candidate?: User; message: string };
  getCandidateById: (candidateId: string) => User | undefined;
  getCandidateByVoterId: (voterId: string) => User | undefined;
  getNextCandidateId: () => string;
  registerForElection: (
    candidateId: string,
    electionId: string,
    manifesto?: {
      manifestoTitle?: string;
      visionStatement?: string;
      keyPromises?: string[];
    },
    electionName?: string
  ) => { success: boolean; message: string };
  getRegistration: (candidateId: string, electionId: string) => CandidateRegistration | undefined;
  isRegisteredForElection: (candidateId: string, electionId: string) => boolean;
  getCandidatesForElection: (electionId: string) => User[];
}

export const useCandidateStore = create<CandidateState>()(
  persist(
    (set, get) => ({
      candidates: [],
      registrations: [],

      getNextCandidateId: () => {
        const { candidates } = get();
        let maxId = 0;
        for (const c of candidates) {
          if (c.id.startsWith('C')) {
            const num = parseInt(c.id.slice(1), 10);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        }
        return `C${maxId + 1}`;
      },

      getCandidateById: (candidateId: string) => {
        return get().candidates.find((c) => c.id === candidateId);
      },

      getCandidateByVoterId: (voterId: string) => {
        return get().candidates.find((c) => c.voterId === voterId);
      },

      registerCandidateFromVoter: ({ voterId, password }) => {
        const voter = useVoterStore.getState().getVoterById(voterId);
        if (!voter) {
          return {
            success: false,
            message: 'No registered voter found with this Voter ID. A candidate must have an existing Voter account.',
          };
        }

        if (voter.age < 25) {
          return {
            success: false,
            message: `Voter must be 25 years or older to create a Candidate account. (Current age: ${voter.age})`,
          };
        }

        if (!password || password.trim().length < 6) {
          return {
            success: false,
            message: 'Candidate password must be at least 6 characters long.',
          };
        }

        const existing = get().getCandidateByVoterId(voter.id) || get().candidates.find((c) => c.email === voter.email);
        if (existing) {
          return {
            success: false,
            message: `A Candidate account (${existing.id}) is already linked to this Voter account.`,
          };
        }

        const id = get().getNextCandidateId();
        const newCandidate: User = {
          id,
          name: voter.name,
          email: voter.email,
          dob: voter.dob,
          age: voter.age,
          password,
          role: 'CANDIDATE',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          voterId: voter.id,
        };

        set((state) => ({
          candidates: [...state.candidates, newCandidate],
        }));

        useAuditStore.getState().addLog({
          userId: id,
          role: 'CANDIDATE',
          action: 'Candidate Account Created',
          details: `${id} (${newCandidate.name}) created Candidate account linked to Voter ${voter.id}`,
        });

        return {
          success: true,
          candidate: newCandidate,
          message: `Candidate account ${id} created successfully!`,
        };
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

      registerForElection: (
        candidateId: string,
        electionId: string,
        manifesto?: {
          manifestoTitle?: string;
          visionStatement?: string;
          keyPromises?: string[];
        },
        electionName?: string
      ) => {
        const candidate = get().getCandidateById(candidateId);
        if (!candidate) {
          return { success: false, message: 'Candidate not found.' };
        }

        const election = useElectionStore.getState().getElectionById(electionId);
        if (!election) {
          return { success: false, message: 'Election not found.' };
        }

        const status = useElectionStore.getState().getElectionStatus(election);
        if (status !== 'REGISTRATION_OPEN') {
          return {
            success: false,
            message: 'Candidate registration is currently closed for this election.',
          };
        }

        if (get().isRegisteredForElection(candidateId, electionId)) {
          return { success: false, message: 'You cannot register twice for the same election.' };
        }

        const newReg: CandidateRegistration = {
          id: `CR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          candidateId,
          electionId,
          registeredAt: new Date().toISOString(),
          manifestoTitle: manifesto?.manifestoTitle?.trim(),
          visionStatement: manifesto?.visionStatement?.trim(),
          keyPromises: manifesto?.keyPromises,
        };

        set((state) => ({
          registrations: [...state.registrations, newReg],
        }));

        useAuditStore.getState().addLog({
          userId: candidateId,
          role: 'CANDIDATE',
          action: 'Election Registration',
          details: `${candidateId} registered for election ${electionName || electionId}${
            newReg.manifestoTitle ? ` with manifesto: "${newReg.manifestoTitle}"` : ''
          }`,
        });

        return { success: true, message: '✓ You are registered for this election.' };
      },

      getCandidatesForElection: (electionId: string) => {
        const registeredCandidateIds = get()
          .registrations.filter((r) => r.electionId === electionId)
          .map((r) => r.candidateId);

        return get().candidates.filter(
          (c) => registeredCandidateIds.includes(c.id)
        );
      },
    }),
    {
      name: 'voting_candidates',
    }
  )
);
