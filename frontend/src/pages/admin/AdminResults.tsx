import React, { useState } from 'react';
import { Trophy, CheckCircle2, Clock, Calculator, Send, BarChart3 } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useVoteStore } from '../../stores/voteStore';
import { formatDateTime } from '../../utils/dateFormatter';
import { Modal } from '../../components/common/Modal';
import { useCurrentTime } from '../../hooks/useCurrentTime';

export const AdminResults: React.FC = () => {
  const currentTime = useCurrentTime(5000);
  const elections = useElectionStore((state) => state.elections);
  const publishResults = useElectionStore((state) => state.publishResults);
  const candidates = useCandidateStore((state) => state.candidates);
  const getElectionResults = useVoteStore((state) => state.getElectionResults);
  const getVotesForElection = useVoteStore((state) => state.getVotesForElection);

  // Filter completed elections
  const completedElections = elections.filter((e) => {
    return currentTime.getTime() > new Date(e.votingEnd).getTime();
  });

  const [selectedElectionId, setSelectedElectionId] = useState<string>('');

  // Calculate results locally displayed upon button press
  const [calculatedMap, setCalculatedMap] = useState<Record<string, boolean>>({});
  const [publishModalElectionId, setPublishModalElectionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendResults, setBackendResults] = useState<{ results: any[]; totalVotes: number } | null>(null);

  const currentElectionId = selectedElectionId || completedElections[0]?.id || '';
  const selectedElection = elections.find((e) => e.id === currentElectionId);

  React.useEffect(() => {
    useElectionStore.getState().fetchElections();
    useCandidateStore.getState().fetchCandidates();
  }, []);

  React.useEffect(() => {
    if (currentElectionId) {
      useVoteStore.getState().fetchResults(currentElectionId).then((res) => {
        if (res && res.results.length > 0) {
          setBackendResults(res);
        } else {
          setBackendResults(null);
        }
      });
    }
  }, [currentElectionId]);

  const handleCalculateResults = (electionId: string) => {
    setCalculatedMap((prev) => ({ ...prev, [electionId]: true }));
    setToastMessage('Vote tally calculated successfully.');
  };

  const handleConfirmPublish = () => {
    if (!publishModalElectionId) return;
    publishResults(publishModalElectionId);
    setToastMessage(`Official results published for election.`);
    setPublishModalElectionId(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          Election Results & Tally Verification
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Calculate ballot tallies and publish official outcomes for concluded elections.
        </p>
      </div>

      {toastMessage && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ fontWeight: 700, color: '#166534', padding: '0 0.5rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {completedElections.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Clock size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            No Completed Elections
          </h2>
          <p style={{ color: '#64748b' }}>
            Only elections whose voting windows have passed appear here for tally verification and publishing.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Election Selector */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {completedElections.map((election) => {
              const isSelected = election.id === currentElectionId;
              return (
                <button
                  key={election.id}
                  onClick={() => setSelectedElectionId(election.id)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: `1px solid ${isSelected ? '#0f172a' : '#e2e8f0'}`,
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
            <div className="card">
              <div className="card-header">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    {selectedElection.id}
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedElection.name}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Concluded on: {formatDateTime(selectedElection.votingEnd)}
                  </div>
                </div>

                <div>
                  {selectedElection.resultsPublished ? (
                    <span className="badge badge-published" style={{ fontSize: '0.85rem' }}>
                      Results Published
                    </span>
                  ) : (
                    <span className="badge badge-not-published" style={{ fontSize: '0.85rem' }}>
                      NOT PUBLISHED
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body">
                {(() => {
                  const votes = getVotesForElection(selectedElection.id);
                  const isCalculated = calculatedMap[selectedElection.id] || selectedElection.resultsPublished;
                  const localRes = getElectionResults(selectedElection.id, candidates);
                  const results = (backendResults && backendResults.results.length > 0) ? backendResults.results : localRes.results;
                  const totalVotesCount = backendResults ? backendResults.totalVotes : votes.length;

                  return (
                    <div>
                      {/* Metric Banner */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        padding: '1.25rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                            Total Ballots Cast
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                            {totalVotesCount.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                            Results Status
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: selectedElection.resultsPublished ? '#15803d' : '#ea580c', marginTop: '0.35rem' }}>
                            {selectedElection.resultsPublished ? 'Published to Public' : 'NOT PUBLISHED'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => handleCalculateResults(selectedElection.id)}
                            className="btn btn-outline"
                            style={{ fontWeight: 600 }}
                          >
                            <Calculator size={16} />
                            <span>Calculate Results</span>
                          </button>

                          {!selectedElection.resultsPublished ? (
                            <button
                              type="button"
                              onClick={() => setPublishModalElectionId(selectedElection.id)}
                              className="btn btn-admin"
                              style={{ fontWeight: 600 }}
                            >
                              <Send size={16} />
                              <span>Publish Results</span>
                            </button>
                          ) : (
                            <button disabled className="btn btn-outline" style={{ color: '#16a34a' }}>
                              <CheckCircle2 size={16} />
                              <span>Published</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Results Display */}
                      {isCalculated ? (
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart3 size={18} />
                            <span>Candidate Vote Counts</span>
                          </h3>

                          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Candidate</th>
                                  <th>Candidate ID</th>
                                  <th style={{ textAlign: 'right' }}>Votes</th>
                                  <th style={{ textAlign: 'right' }}>Percentage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((r, i) => (
                                  <tr key={r.candidateId} style={{ backgroundColor: i === 0 ? '#f0fdf4' : 'transparent' }}>
                                    <td style={{ fontWeight: i === 0 ? 700 : 500 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {i === 0 && <Trophy size={16} color="#15803d" />}
                                        <span>{r.candidateName}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <code>{r.candidateId}</code>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.05rem' }}>
                                      {r.votes.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                                      {r.percentage}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Progress breakdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {results.map((r, i) => (
                              <div key={r.candidateId}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600 }}>{r.candidateName}</span>
                                  <span style={{ color: '#64748b' }}>{r.votes} votes ({r.percentage}%)</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${r.percentage}%`,
                                      height: '100%',
                                      backgroundColor: i === 0 ? '#15803d' : i === 1 ? '#2563eb' : '#64748b',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '2.5rem',
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px dashed #cbd5e1'
                        }}>
                          <Calculator size={36} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                            Tallies Not Yet Calculated
                          </h4>
                          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                            Click "Calculate Results" above to compute the candidate vote breakdown.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCalculateResults(selectedElection.id)}
                            className="btn btn-outline"
                          >
                            Calculate Results
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal to Publish Results */}
      <Modal
        isOpen={Boolean(publishModalElectionId)}
        onClose={() => setPublishModalElectionId(null)}
        title="Confirm Publish Results"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            marginBottom: '1.25rem'
          }}>
            <Trophy size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Publish Certified Outcomes
              </div>
              <div style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
                Once published, verified totals and winning candidates will immediately become visible to voters, candidates, and the public.
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
            Are you sure you want to officially publish results for this election?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPublishModalElectionId(null)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPublish}
              className="btn btn-admin"
              style={{ fontWeight: 600 }}
            >
              Confirm & Publish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
