import React, { useState } from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import { useAuditStore } from '../../stores/auditStore';
import { formatDateTime } from '../../utils/dateFormatter';

export const AdminAuditLogs: React.FC = () => {
  const logs = useAuditStore((state) => state.logs);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Filter strictly for voters and candidates only (excluding admin)
  const voterAndCandidateLogs = logs.filter(
    (log) => log.role === 'VOTER' || log.role === 'CANDIDATE'
  );

  const filteredLogs = voterAndCandidateLogs.filter((log) => {
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    const matchesSearch =
      log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          System Audit Logs
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Trace of voter and candidate registrations, logins, election enrollments, and ballot submissions.
        </p>
      </div>

      {/* Filters row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem',
        backgroundColor: '#ffffff',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search action or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="#64748b" />
          <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-select"
            style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.85rem', width: 'auto' }}
          >
            <option value="ALL">All (Voters & Candidates) ({voterAndCandidateLogs.length})</option>
            <option value="VOTER">Voters</option>
            <option value="CANDIDATE">Candidates</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem' }}>
                    <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <div>No audit logs found for voters or candidates.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isVoter = log.role === 'VOTER';
                  const roleBadgeColor = isVoter ? '#dcfce7' : '#ffedd5';
                  const roleTextColor = isVoter ? '#166534' : '#c2410c';

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {log.userId}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: roleBadgeColor,
                          color: roleTextColor
                        }}>
                          {log.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>
                        {log.action}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#334155' }}>
                        {log.details}
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
