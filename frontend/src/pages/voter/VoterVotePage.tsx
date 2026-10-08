import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, Award } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useVoteStore } from '../../stores/voteStore';
import { useAuthStore } from '../../stores/authStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatDateTime } from '../../utils/dateFormatter';
import { isVoterEligible } from '../../utils/eligibility';

export const VoterVotePage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const currentTime = useCurrentTime(5000);

  const currentUser = useAuthStore((state) => state.currentUser);
  const getElectionById = useElectionStore((state) => state.getElectionById);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const getCandidatesForElection = useCandidateStore((state) => state.getCandidatesForElection);
  const getRegistration = useCandidateStore((state) => state.getRegistration);
  const hasVoted = useVoteStore((state) => state.hasVoted);
  const castVote = useVoteStore((state) => state.castVote);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [voteSubmittedSuccess, setVoteSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const election = electionId ? getElectionById(electionId) : undefined;

  if (!election) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>Election Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The requested election ID could not be found.</p>
        <Link to="/voter/elections" className="btn btn-voter">
          Back to Elections
        </Link>
      </div>
    );
  }

  const status = getElectionStatus(election, currentTime);
  const candidates = electionId ? getCandidatesForElection(electionId) : [];
  const alreadyVoted = currentUser ? hasVoted(currentUser.id, election.id) : false;
  const isEligible = currentUser ? isVoterEligible(election, currentUser.id, currentUser) : true;

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) {
      setErrorMessage('You are not eligible to vote in this election.');
      return;
    }
    if (!selectedCandidateId) {
      setErrorMessage('Please select a candidate to cast your vote.');
      return;
    }
    setErrorMessage(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmVote = () => {
    if (!currentUser || !selectedCandidateId) return;

    const result = castVote({
      voterId: currentUser.id,
      electionId: election.id,
      candidateId: selectedCandidateId,
      electionName: election.name,
    });

    setConfirmModalOpen(false);

    if (result.success) {
      setVoteSubmittedSuccess(true);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/voter/elections"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontWeight: 600, fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Elections</span>
        </Link>
      </div>

      {/* Election Header Card */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', letterSpacing: '0.05em' }}>
              ELECTION DETAILS
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {election.name}
            </h1>
          </div>
          <Badge status={status} />
        </div>

        <div className="card-body">
          {election.description && (
            <p style={{ color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {election.description}
            </p>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Clock size={16} color="#15803d" />
                <span>Voting Starts:</span>
              </div>
              <div style={{ color: '#0f172a', fontWeight: 600, paddingLeft: '1.4rem' }}>
                {formatDateTime(election.votingStart)}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Calendar size={16} color="#15803d" />
                <span>Voting Ends:</span>
              </div>
              <div style={{ color: '#0f172a', fontWeight: 600, paddingLeft: '1.4rem' }}>
                {formatDateTime(election.votingEnd)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Area */}
      {voteSubmittedSuccess ? (
        /* Success Screen */
        <div className="card" style={{ borderColor: '#86efac', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14532d', marginBottom: '0.5rem' }}>
            ✓ Vote Submitted Successfully
          </h2>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Your vote has been recorded.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/voter/elections" className="btn btn-voter">
              Go to Elections
            </Link>
            <Link to="/voter/results" className="btn btn-outline">
              View Results
            </Link>
          </div>
        </div>
      ) : alreadyVoted ? (
        /* Duplicate Vote Protection Notice */
        <div className="card" style={{ borderColor: '#fed7aa', backgroundColor: '#fffbeb', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <ShieldAlert size={30} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem' }}>
            You have already voted in this election.
          </h2>
          <p style={{ color: '#78350f', fontSize: '0.925rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
            To preserve voting integrity, voters may only cast a ballot once per election. Your vote has already been securely logged.
          </p>
          <Link to="/voter/elections" className="btn btn-outline">
            Return to Elections
          </Link>
        </div>
      ) : !isEligible ? (
        /* Ineligible Notice */
        <div className="card" style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <ShieldAlert size={30} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
            Not Eligible to Vote in this Election
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.925rem', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Voters must register before the voting period starts to be eligible. Because your voter account was registered after voting started for this election, you are not eligible to cast a ballot in this election.
          </p>
          <Link to="/voter/elections" className="btn btn-outline">
            Return to Elections
          </Link>
        </div>
      ) : status === 'VOTING_OPEN' ? (
        /* Voting Form */
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Select Candidate</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Choose 1 candidate
            </span>
          </div>

          <div className="card-body">
            {errorMessage && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {candidates.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p>No active registered candidates found for this election.</p>
              </div>
            ) : (
              <form onSubmit={handleOpenConfirm}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  {candidates.map((candidate) => {
                    const isSelected = selectedCandidateId === candidate.id;
                    const reg = election ? getRegistration(candidate.id, election.id) : undefined;

                    return (
                      <label
                        key={candidate.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '8px',
                          border: `2px solid ${isSelected ? '#15803d' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="candidateVote"
                          value={candidate.id}
                          checked={isSelected}
                          onChange={() => setSelectedCandidateId(candidate.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#15803d', cursor: 'pointer', marginTop: '4px' }}
                        />
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: '#ffedd5',
                          color: '#ea580c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          <Award size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>
                            {candidate.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Candidate ID: {candidate.id} &bull; Age: {candidate.age}
                          </div>

                          {/* Candidate Manifesto Details - Always Visible */}
                          <div style={{
                            marginTop: '0.65rem',
                            padding: '0.75rem 0.9rem',
                            backgroundColor: isSelected ? '#ffffff' : '#fffbeb',
                            border: `1px solid ${isSelected ? '#86efac' : '#fed7aa'}`,
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}>
                            {/* Manifesto */}
                            <div>
                              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Manifesto:
                              </span>{' '}
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                                {reg?.manifestoTitle || 'Not specified'}
                              </span>
                            </div>

                            {/* Vision */}
                            <div>
                              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                Vision:
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                                {reg?.visionStatement || 'Not specified'}
                              </div>
                            </div>

                            {/* Key Promises */}
                            <div>
                              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                Key Promises:
                              </div>
                              {reg?.keyPromises && reg.keyPromises.length > 0 ? (
                                <ul style={{ margin: '3px 0 0', paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#334155', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  {reg.keyPromises.map((p, pIdx) => (
                                    <li key={pIdx}>{p}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ fontSize: '0.825rem', color: '#64748b', fontStyle: 'italic' }}>
                                  Not specified
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={!selectedCandidateId}
                  className="btn btn-voter btn-lg btn-block"
                  style={{ fontWeight: 600 }}
                >
                  Submit Vote
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Voting Not Open Notice */
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            {status === 'COMPLETED' ? 'Voting Has Ended' : 'Voting Is Not Open Yet'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            {status === 'COMPLETED'
              ? 'This election has concluded. You can check published results once authorized by the election administrator.'
              : `Voting will open on ${formatDateTime(election.votingStart)}. Please return during the scheduled voting period.`}
          </p>
          <Link to="/voter/elections" className="btn btn-outline">
            Back to Election Catalog
          </Link>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Your Vote"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1rem' }}>
            You are voting for:
          </p>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Award size={24} color="#15803d" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#14532d' }}>
                  {selectedCandidate?.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  Candidate ID: {selectedCandidate?.id}
                </div>
              </div>
            </div>

            {selectedCandidate && (
              <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                <div>
                  <strong style={{ color: '#c2410c' }}>Manifesto:</strong>{' '}
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {(election && getRegistration(selectedCandidate.id, election.id)?.manifestoTitle) || 'Not specified'}
                  </span>
                </div>

                <div>
                  <strong style={{ color: '#c2410c' }}>Vision:</strong>{' '}
                  <span style={{ color: '#334155' }}>
                    {(election && getRegistration(selectedCandidate.id, election.id)?.visionStatement) || 'Not specified'}
                  </span>
                </div>

                <div>
                  <strong style={{ color: '#c2410c' }}>Key Promises:</strong>
                  {election && getRegistration(selectedCandidate.id, election.id)?.keyPromises && getRegistration(selectedCandidate.id, election.id)!.keyPromises!.length > 0 ? (
                    <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem', color: '#334155' }}>
                      {getRegistration(selectedCandidate.id, election.id)!.keyPromises!.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '4px' }}>Not specified</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Once submitted, your vote cannot be changed.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmVote}
              className="btn btn-voter"
              style={{ fontWeight: 600 }}
            >
              Confirm Vote
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
