import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Vote, Award } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';
import api from '../../services/api';

export const PublicElectionsPage: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const [candidatesMap, setCandidatesMap] = React.useState<Record<string, Array<{ candidateId: string; name: string }>>>({});

  React.useEffect(() => {
    useElectionStore.getState().fetchElections();
  }, []);

  React.useEffect(() => {
    if (elections.length === 0) return;
    let isMounted = true;
    const fetchAllCandidates = async () => {
      try {
        const results = await Promise.all(
          elections.map(async (el) => {
            try {
              const res = await api.get(`/candidates/election/${el.id}`);
              if (res.data && res.data.success && Array.isArray(res.data.data)) {
                return {
                  id: el.id,
                  candidates: res.data.data.map((c: any) => ({
                    candidateId: c.candidateId || c.id,
                    name: c.name,
                  })),
                };
              }
            } catch (err) {
              console.error(`Error fetching candidates for ${el.id}:`, err);
            }
            return { id: el.id, candidates: [] };
          })
        );
        if (isMounted) {
          const map: Record<string, Array<{ candidateId: string; name: string }>> = {};
          results.forEach((item) => {
            map[item.id] = item.candidates;
          });
          setCandidatesMap(map);
        }
      } catch (err) {
        console.error('Error fetching candidates:', err);
      }
    };
    fetchAllCandidates();
    return () => {
      isMounted = false;
    };
  }, [elections]);

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Public Election Board
        </h1>
        <p style={{ color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
          Browse all scheduled, ongoing, and completed elections. Status updates live according to system time.
        </p>
      </div>

      {elections.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Elections Currently Scheduled
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            There are no elections available at this time. Please check back later or contact the administrator.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.75rem',
        }}>
          {elections.map((election) => {
            const status = getElectionStatus(election, currentTime);
            const isCompleted = status === 'COMPLETED';
            const candidates = candidatesMap[election.id] || [];

            return (
              <div key={election.id} className="election-card">
                <div className="election-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em' }}>
                      {election.id}
                    </span>
                    <Badge status={status} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e3a8a', lineHeight: 1.3 }}>
                    {election.name}
                  </h3>
                </div>

                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {election.description && (
                    <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.45 }}>
                      {election.description}
                    </p>
                  )}

                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    fontSize: '0.825rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Calendar size={14} color="#ea580c" />
                        <span>Candidate Registration Window:</span>
                      </div>
                      <div style={{ color: '#0f172a', paddingLeft: '1.25rem' }}>
                        {formatDateTime(election.registrationStart)} &rarr; {formatDateTime(election.registrationEnd)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Clock size={14} color="#16a34a" />
                        <span>Voting Window:</span>
                      </div>
                      <div style={{ color: '#0f172a', paddingLeft: '1.25rem' }}>
                        {formatDateTime(election.votingStart)} &rarr; {formatDateTime(election.votingEnd)}
                      </div>
                    </div>
                  </div>

                  {isCompleted ? (
                    <div style={{
                      padding: '0.85rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        Candidates Participated
                      </div>

                      {candidates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {candidates.map((c) => (
                            <div key={c.candidateId} style={{ color: '#334155', fontWeight: 500 }}>
                              {c.candidateId} - {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                          No candidates participating.
                        </div>
                      )}

                      <div style={{
                        marginTop: '0.35rem',
                        paddingTop: '0.55rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem'
                      }}>
                        <div style={{ color: '#0f172a' }}>
                          <span style={{ fontWeight: 700 }}>Total Voters:</span>{' '}
                          <span style={{ fontWeight: 600 }}>{election.totalVoters ?? 0}</span>
                        </div>
                        <div style={{ color: '#0f172a' }}>
                          <span style={{ fontWeight: 700 }}>Total Votes Cast:</span>{' '}
                          <span style={{ fontWeight: 600 }}>{election.totalVotes ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.85rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        Candidates Participating
                      </div>

                      {candidates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {candidates.map((c) => (
                            <div key={c.candidateId} style={{ color: '#334155', fontWeight: 500 }}>
                              {c.candidateId} - {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                          No candidates participating.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  {status === 'VOTING_OPEN' ? (
                    <Link
                      to="/login?role=voter"
                      className="btn btn-sm btn-voter btn-block"
                    >
                      <Vote size={16} />
                      <span>Login to Cast Vote</span>
                    </Link>
                  ) : status === 'REGISTRATION_OPEN' ? (
                    <Link
                      to="/login?role=candidate"
                      className="btn btn-sm btn-candidate btn-block"
                    >
                      <Award size={16} />
                      <span>Login as Candidate to Register</span>
                    </Link>
                  ) : status === 'COMPLETED' ? (
                    <div style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                      {election.resultsPublished ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>Results Published &bull; Login to View</span>
                      ) : (
                        <span>Voting Closed &bull; Results Awaiting Publication</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                      Scheduled to begin soon
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
