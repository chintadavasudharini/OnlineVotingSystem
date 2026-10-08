import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Vote, Award } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';

export const PublicElectionsPage: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);

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
