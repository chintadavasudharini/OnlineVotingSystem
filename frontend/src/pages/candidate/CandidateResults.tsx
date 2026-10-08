import React, { useState } from 'react';
import { Trophy, CheckCircle, Clock } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useVoteStore } from '../../stores/voteStore';
import { formatDateTime } from '../../utils/dateFormatter';
import { useCurrentTime } from '../../hooks/useCurrentTime';

export const CandidateResults: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const candidates = useCandidateStore((state) => state.candidates);
  const getElectionResults = useVoteStore((state) => state.getElectionResults);

  // Filter only completed elections
  const completedElections = elections.filter((e) => {
    return currentTime.getTime() > new Date(e.votingEnd).getTime();
  });

  const [selectedElectionId, setSelectedElectionId] = useState<string>(
    completedElections[0]?.id || ''
  );

  const selectedElection = elections.find((e) => e.id === selectedElectionId);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9a3412', marginBottom: '0.35rem' }}>
          Election Results
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Certified vote totals for published elections.
        </p>
      </div>

      {completedElections.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Clock size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>No Concluded Elections Yet</h2>
          <p style={{ color: '#64748b' }}>Results will appear here once elections conclude and official results are published.</p>
        </div>
      ) : (
        <>
          {/* Election Selector Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            {completedElections.map((election) => {
              const isSelected = election.id === selectedElectionId;
              return (
                <button
                  key={election.id}
                  onClick={() => setSelectedElectionId(election.id)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? '#ea580c' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: `1px solid ${isSelected ? '#ea580c' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease'
                  }}
                >
                  {election.name}
                </button>
              );
            })}
          </div>

          {selectedElection && (
            <div className="card" style={{ backgroundColor: '#ffffff' }}>
              <div className="card-header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    CERTIFIED RESULTS
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedElection.name}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Voting ended on {formatDateTime(selectedElection.votingEnd)}
                  </div>
                </div>

                {selectedElection.resultsPublished ? (
                  <span className="badge badge-published" style={{ fontSize: '0.8rem' }}>
                    Results Published
                  </span>
                ) : (
                  <span className="badge badge-not-published" style={{ fontSize: '0.8rem' }}>
                    Not Published
                  </span>
                )}
              </div>

              <div className="card-body" style={{ padding: '2rem' }}>
                {!selectedElection.resultsPublished ? (
                  <div style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1'
                  }}>
                    <Clock size={36} color="#64748b" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                      Results are not yet published.
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto' }}>
                      Official vote tallies are awaiting administrator publishing.
                    </p>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const { results, totalVotes } = getElectionResults(
                        selectedElection.id,
                        candidates
                      );

                      if (results.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                            No candidate votes recorded.
                          </div>
                        );
                      }

                      return (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div>
                              <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Total Valid Votes Cast:</span>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                                {totalVotes.toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ea580c', fontWeight: 600, fontSize: '0.9rem' }}>
                              <Trophy size={20} />
                              <span>Leading: {results[0]?.candidateName}</span>
                            </div>
                          </div>

                          <div className="table-container" style={{ marginBottom: '2rem' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Candidate</th>
                                  <th style={{ textAlign: 'right' }}>Votes</th>
                                  <th style={{ textAlign: 'right' }}>Share</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((r, index) => (
                                  <tr key={r.candidateId} style={{ backgroundColor: index === 0 ? '#fff7ed' : 'transparent' }}>
                                    <td style={{ fontWeight: index === 0 ? 700 : 500 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {index === 0 && <CheckCircle size={16} color="#ea580c" />}
                                        <span>{r.candidateName}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({r.candidateId})</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                                      {r.votes.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                                      {r.percentage}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                              Vote Share
                            </h4>
                            {results.map((r, idx) => (
                              <div key={r.candidateId}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.candidateName}</span>
                                  <span style={{ color: '#64748b' }}>{r.votes} votes ({r.percentage}%)</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${r.percentage}%`,
                                      height: '100%',
                                      backgroundColor: idx === 0 ? '#ea580c' : idx === 1 ? '#2563eb' : '#94a3b8',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
