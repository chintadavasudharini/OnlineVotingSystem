import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserSquare2, Calendar, ShieldCheck, Award, Clock } from 'lucide-react';
import { useVoterStore } from '../../stores/voterStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useElectionStore } from '../../stores/electionStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';

export const AdminDashboard: React.FC = () => {
  const currentTime = useCurrentTime(5000);

  const voters = useVoterStore((state) => state.voters);
  const candidates = useCandidateStore((state) => state.candidates);
  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);

  // Voter stats
  const totalVoters = voters.length;

  // Candidate stats
  const totalCandidates = candidates.length;

  // Election stats
  const totalElections = elections.length;
  const upcomingElections = elections.filter((e) => getElectionStatus(e, currentTime) === 'UPCOMING').length;
  const ongoingElections = elections.filter((e) => {
    const s = getElectionStatus(e, currentTime);
    return s === 'VOTING_OPEN' || s === 'REGISTRATION_OPEN';
  }).length;
  const completedElections = elections.filter((e) => getElectionStatus(e, currentTime) === 'COMPLETED').length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          Administrator Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Live system overview, voter participation, candidate registries, and election statuses.
        </p>
      </div>

      {/* Voters Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            Voter Registry Statistics
          </h2>
          <Link to="/admin/voters" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600 }}>
            View Voters &rarr;
          </Link>
        </div>
        <div className="stats-grid">
          <StatCard
            label="Total Voters"
            value={totalVoters}
            icon={<Users size={22} />}
            variant="default"
          />
        </div>
      </div>

      {/* Candidate Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            Candidate Registry Statistics
          </h2>
          <Link to="/admin/candidates" style={{ fontSize: '0.825rem', color: '#ea580c', fontWeight: 600 }}>
            View Candidates &rarr;
          </Link>
        </div>
        <div className="stats-grid">
          <StatCard
            label="Total Candidates"
            value={totalCandidates}
            icon={<UserSquare2 size={22} />}
            variant="default"
          />
        </div>
      </div>

      {/* Election Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            Election Lifecycle Statistics
          </h2>
          <Link to="/admin/elections" style={{ fontSize: '0.825rem', color: '#0f172a', fontWeight: 600 }}>
            Configure Elections &rarr;
          </Link>
        </div>
        <div className="stats-grid">
          <StatCard
            label="Total Elections"
            value={totalElections}
            icon={<Calendar size={22} />}
            variant="default"
          />
          <StatCard
            label="Upcoming"
            value={upcomingElections}
            icon={<Clock size={22} />}
            variant="warning"
          />
          <StatCard
            label="Ongoing"
            value={ongoingElections}
            icon={<ShieldCheck size={22} />}
            variant="info"
          />
          <StatCard
            label="Completed"
            value={completedElections}
            icon={<Award size={22} />}
            variant="default"
          />
        </div>
      </div>

      {/* Quick Recent Elections Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Elections</h3>
          <Link to="/admin/elections" className="btn btn-sm btn-outline">
            View All
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Election Name</th>
                <th>Status</th>
                <th>Voting Window</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              {elections.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No elections created yet.
                  </td>
                </tr>
              ) : (
                elections.slice(0, 4).map((el) => {
                  const status = getElectionStatus(el, currentTime);
                  return (
                    <tr key={el.id}>
                      <td style={{ fontWeight: 700 }}>{el.id}</td>
                      <td style={{ fontWeight: 600 }}>{el.name}</td>
                      <td><Badge status={status} /></td>
                      <td style={{ fontSize: '0.825rem', color: '#64748b' }}>
                        {formatDateTime(el.votingStart)} &rarr; {formatDateTime(el.votingEnd)}
                      </td>
                      <td>
                        {el.resultsPublished ? (
                          <span className="badge badge-published">Published</span>
                        ) : (
                          <span className="badge badge-not-published">Not Published</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
