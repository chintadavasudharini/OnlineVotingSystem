import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useAuthStore } from '../../stores/authStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';

export const CandidateElections: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isRegisteredForElection = useCandidateStore((state) => state.isRegisteredForElection);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9a3412', marginBottom: '0.35rem' }}>
          Candidate Elections
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Browse all scheduled elections and register as a candidate during open registration windows.
        </p>
      </div>

      {elections.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Elections Available
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            There are currently no elections scheduled. When an election is created with an open candidate registration period, you can register here.
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
          const isRegistered = currentUser ? isRegisteredForElection(currentUser.id, election.id) : false;
          const isRegOpen = status === 'REGISTRATION_OPEN';
          const canRegister = isRegOpen && !isRegistered;

          return (
            <div key={election.id} className="card" style={{ borderColor: canRegister ? '#fed7aa' : '#e2e8f0' }}>
              <div className="card-header" style={{
                backgroundColor: canRegister ? '#fff7ed' : '#f8fafc',
                borderBottom: `1px solid ${canRegister ? '#fed7aa' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>
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
                    <div style={{ fontWeight: 600, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} />
                      <span>Registration Window:</span>
                    </div>
                    <div style={{ paddingLeft: '1rem', color: '#1e293b' }}>
                      {formatDateTime(election.registrationStart)} &rarr; {formatDateTime(election.registrationEnd)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} color="#16a34a" />
                      <span>Voting Window:</span>
                    </div>
                    <div style={{ paddingLeft: '1rem', color: '#1e293b' }}>
                      {formatDateTime(election.votingStart)} &rarr; {formatDateTime(election.votingEnd)}
                    </div>
                  </div>
                </div>

                {isRegistered && (
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
                    fontWeight: 700
                  }}>
                    <CheckCircle2 size={16} />
                    <span>✓ Registered for this election</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <Link
                  to={`/candidate/elections/${election.id}`}
                  className={`btn btn-sm btn-block ${canRegister ? 'btn-candidate' : 'btn-outline'}`}
                  style={{ fontWeight: 600 }}
                >
                  {canRegister ? (
                    <>
                      <Award size={16} />
                      <span>Register for Election</span>
                    </>
                  ) : (
                    <>
                      <span>View Details</span>
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
