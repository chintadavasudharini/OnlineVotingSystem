import type { Election, User } from '../types';

/**
 * Checks if a voter is eligible to vote in an election.
 * Rules:
 * - A voter can register before or after an election is created.
 * - A voter can vote in an election if they register before the voting period starts.
 * - If the voter registers after voting has started, they cannot vote in that election.
 */
export const isVoterEligible = (
  election: Election,
  _voterId?: string,
  voter?: User
): boolean => {
  if (!voter || !voter.createdAt) {
    return true;
  }

  const voterRegTime = new Date(voter.createdAt).getTime();
  const votingStartTime = new Date(election.votingStart).getTime();

  return voterRegTime <= votingStartTime;
};

/**
 * Checks if candidate registration window is currently open for an election.
 * Rule: The candidate can register for an election while the candidate registration period is open.
 */
export const isCandidateRegistrationPeriodOpen = (
  election: Election,
  referenceTime: Date = new Date()
): boolean => {
  const now = referenceTime.getTime();
  const regStart = new Date(election.registrationStart).getTime();
  const regEnd = new Date(election.registrationEnd).getTime();

  return now >= regStart && now <= regEnd;
};

/**
 * Candidate account eligibility for election participation.
 * Rule: A Candidate account can be created before or after an election is created.
 */
export const isCandidateEligible = (
  _election: Election,
  _candidateId?: string,
  _candidate?: User
): boolean => {
  return true;
};
