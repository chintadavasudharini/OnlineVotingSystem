export type Role = 'VOTER' | 'CANDIDATE' | 'ADMIN';

export type UserStatus = 'ACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  dob?: string;
  age: number;
  password: string;
  role: Role;
  status?: UserStatus;
  createdAt?: string;
  voterId?: string;
}

export type ElectionStatus = 'UPCOMING' | 'REGISTRATION_OPEN' | 'VOTING_OPEN' | 'COMPLETED';

export interface Election {
  id: string;
  name: string;
  registrationStart: string;
  registrationEnd: string;
  votingStart: string;
  votingEnd: string;
  resultsPublished: boolean;
  description?: string;
  createdAt?: string;
  eligibleVoterIds?: string[];
  eligibleCandidateIds?: string[];
}

export interface CandidateRegistration {
  id: string;
  candidateId: string;
  electionId: string;
  registeredAt: string;
  manifestoTitle?: string;
  visionStatement?: string;
  keyPromises?: string[];
}

export interface Vote {
  id: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  votedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  role: string;
  action: string;
  details: string;
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  votes: number;
  percentage?: number;
}
