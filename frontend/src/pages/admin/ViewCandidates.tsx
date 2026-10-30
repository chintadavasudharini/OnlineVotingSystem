import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useCandidateStore } from '../../stores/candidateStore';
import { formatDob } from '../../utils/dateFormatter';

export const ViewCandidates: React.FC = () => {
  const candidates = useCandidateStore((state) => state.candidates);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    useCandidateStore.getState().fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.voterId && c.voterId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            View Candidates
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Inspect registered election candidates and their details.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>C.ID</th>
                <th>Name</th>
                <th>V.ID</th>
                <th>Date of Birth</th>
                <th>Age</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No candidates found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td style={{ fontWeight: 700, color: '#ea580c' }}>{candidate.id}</td>
                    <td style={{ fontWeight: 600 }}>{candidate.name}</td>
                    <td style={{ fontWeight: 600, color: '#15803d' }}>{candidate.voterId || '—'}</td>
                    <td>{formatDob(candidate.dob)}</td>
                    <td>{candidate.age}</td>
                    <td style={{ color: '#475569' }}>{candidate.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
