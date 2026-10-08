import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useVoterStore } from '../../stores/voterStore';

export const ViewVoters: React.FC = () => {
  const voters = useVoterStore((state) => state.voters);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoters = voters.filter(
    (v) =>
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            View Voters
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Inspect registered voters and their details.
          </p>
        </div>

        {/* Search */}
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
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No voters found matching your search.
                  </td>
                </tr>
              ) : (
                filteredVoters.map((voter) => (
                  <tr key={voter.id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{voter.id}</td>
                    <td style={{ fontWeight: 600 }}>{voter.name}</td>
                    <td style={{ color: '#475569' }}>{voter.email}</td>
                    <td>{voter.dob || '—'}</td>
                    <td>{voter.age}</td>
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
