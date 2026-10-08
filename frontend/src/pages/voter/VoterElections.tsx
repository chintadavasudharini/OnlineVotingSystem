import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Vote, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useAuthStore } from '../../stores/authStore';
import { useVoteStore } from '../../stores/voteStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';
import { isVoterEligible } from '../../utils/eligibility';

export const VoterElections: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasVoted = useVoteStore((state) => state.hasVoted);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532d', marginBottom: '0.35rem' }}>
          Election Catalog
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          View all scheduled elections and cast your ballot during active voting windows.
        </p>
      </div>

      {elections.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Elections Currently Available
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            There are currently no elections scheduled. When an election is created, it will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {elections.map((election) => {
          const status = getElectionStatus(election, currentTime);
          const alreadyVoted = currentUser ? hasVoted(currentUser.id, election.id) : false;
          const isEligible = currentUser ? isVoterEligible(election, currentUser.id, currentUser) : true;
          const canVote = status === 'VOTING_OPEN' && !alreadyVoted && isEligible;

          return (
            <div key={election.id} className="card election-card" style={{ borderColor: canVote ? '#86efac' : '#e2e8f0' }}>
              <div className="card-header" style={{
                backgroundColor: canVote ? '#f0fdf4' : '#f8fafc',
                borderBottom: `1px solid ${canVote ? '#bbf7d0' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                  {election.id}
                </span>
                <Badge status={status} />
              </div>

              <div className="card-body">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {election.name}
                </h3>
                {election.description && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.45 }}>
                    {election.description}
                  </p>
                )}

                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} color="#ea580c" />
                      <span>Registration Window:</span>
                    </div>
                    <div style={{ paddingLeft: '1rem', color: '#1e293b' }}>
                      {formatDateTime(election.registrationStart)} &rarr; {formatDateTime(election.registrationEnd)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} color="#15803d" />
                      <span>Voting Window:</span>
                    </div>
                    <div style={{ paddingLeft: '1rem', color: '#1e293b' }}>
                      {formatDateTime(election.votingStart)} &rarr; {formatDateTime(election.votingEnd)}
                    </div>
                  </div>
                </div>

                {!isEligible && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    color: '#991b1b',
                    fontWeight: 600
                  }}>
                    <AlertCircle size={16} />
                    <span>Not Eligible: Registered after voting period started</span>
                  </div>
                )}

                {alreadyVoted && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    color: '#166534',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={16} />
                    <span>You have cast your vote in this election</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <Link
                  to={`/voter/elections/${election.id}`}
                  className={`btn btn-sm btn-block ${canVote ? 'btn-voter' : 'btn-outline'}`}
                  style={{ fontWeight: 600 }}
                >
                  {canVote ? (
                    <>
                      <Vote size={16} />
                      <span>Cast Vote</span>
                    </>
                  ) : (
                    <>
                      <span>View Election Details</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
