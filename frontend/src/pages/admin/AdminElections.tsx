import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle2, Users, Vote } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useVoteStore } from '../../stores/voteStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { electionCreationSchema } from '../../schemas/authSchemas';
import type { ElectionCreationFormData } from '../../schemas/authSchemas';
import { formatDateTime } from '../../utils/dateFormatter';

export const AdminElections: React.FC = () => {
  const currentTime = useCurrentTime(5000);

  const elections = useElectionStore((state) => state.elections);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const createElection = useElectionStore((state) => state.createElection);

  const registrations = useCandidateStore((state) => state.registrations);
  const getVotesForElection = useVoteStore((state) => state.getVotesForElection);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    useElectionStore.getState().fetchElections();
  }, []);

  // Form state
  const getInitialFormData = (): ElectionCreationFormData => {
    const today = new Date().toISOString().split('T')[0];
    return {
      name: '',
      description: '',
      registrationStartDate: today,
      registrationStartTime: '09:00',
      registrationEndDate: today,
      registrationEndTime: '17:00',
      votingStartDate: today,
      votingStartTime: '09:00',
      votingEndDate: today,
      votingEndTime: '17:00',
    };
  };

  const [formData, setFormData] = useState<ElectionCreationFormData>(getInitialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = electionCreationSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFormErrors(errors);
      return;
    }

    const regStart = `${formData.registrationStartDate}T${formData.registrationStartTime}:00`;
    const regEnd = `${formData.registrationEndDate}T${formData.registrationEndTime}:00`;
    const voteStart = `${formData.votingStartDate}T${formData.votingStartTime}:00`;
    const voteEnd = `${formData.votingEndDate}T${formData.votingEndTime}:00`;

    const res = await createElection({
      name: formData.name,
      description: formData.description,
      registrationStart: new Date(regStart).toISOString(),
      registrationEnd: new Date(regEnd).toISOString(),
      votingStart: new Date(voteStart).toISOString(),
      votingEnd: new Date(voteEnd).toISOString(),
    });

    if (res.success && res.election) {
      setIsModalOpen(false);
      setSuccessToast(`Election "${res.election.name}" created successfully!`);
      setFormData(getInitialFormData());
    } else {
      setFormErrors({ general: res.error || 'Failed to create election.' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            Election Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Create and schedule elections with automatic time-based status calculation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-admin"
          style={{ fontWeight: 600 }}
        >
          <Plus size={18} />
          <span>Create Election</span>
        </button>
      </div>

      {successToast && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ fontWeight: 700, color: '#166534', padding: '0 0.5rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Elections Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Election Name</th>
                <th>Registration Period</th>
                <th>Voting Period</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Candidates</th>
                <th style={{ textAlign: 'center' }}>Votes Cast</th>
                <th>Results Status</th>
              </tr>
            </thead>
            <tbody>
              {elections.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem' }}>
                    No elections created yet. Click &quot;Create Election&quot; above to configure your first election.
                  </td>
                </tr>
              ) : (
                elections.map((election) => {
                  const status = getElectionStatus(election, currentTime);
                  const candidateCount = registrations.filter((r) => r.electionId === election.id).length;
                  const voteCount = getVotesForElection(election.id).length;

                  return (
                    <tr key={election.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{election.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {election.id}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                        <div>{formatDateTime(election.registrationStart)}</div>
                        <div style={{ color: '#94a3b8' }}>to</div>
                        <div>{formatDateTime(election.registrationEnd)}</div>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                        <div>{formatDateTime(election.votingStart)}</div>
                        <div style={{ color: '#94a3b8' }}>to</div>
                        <div>{formatDateTime(election.votingEnd)}</div>
                      </td>
                      <td>
                        <Badge status={status} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          <Users size={12} color="#64748b" />
                          <span>{candidateCount}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          <Vote size={12} />
                          <span>{voteCount.toLocaleString()}</span>
                        </span>
                      </td>
                      <td>
                        {election.resultsPublished ? (
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

      {/* Create Election Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Election"
        maxWidth="640px"
      >
        <form onSubmit={handleCreateSubmit} noValidate>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '0.825rem',
              color: '#166534',
              lineHeight: 1.45
            }}>
              <strong>Participation Rules:</strong> Candidates can register while candidate registration is open. Voters can register before or after election creation, and can vote in this election as long as they register before voting starts.
            </div>

            {/* Election Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Election Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="City Assembly Election"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${formErrors.name ? 'is-invalid' : ''}`}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description (Optional)
              </label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Brief purpose of this election"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Candidate Registration Section */}
            <div style={{
              margin: '1.25rem 0 1rem',
              padding: '1rem',
              backgroundColor: '#fff7ed',
              borderRadius: '8px',
              border: '1px solid #fed7aa'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#9a3412', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} />
                <span>Candidate Registration Window</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="registrationStartDate"
                    value={formData.registrationStartDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="registrationStartTime"
                    value={formData.registrationStartTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="registrationEndDate"
                    value={formData.registrationEndDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="registrationEndTime"
                    value={formData.registrationEndTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              {formErrors.registrationEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {formErrors.registrationEndDate}
                </div>
              )}
            </div>

            {/* Voting Period Section */}
            <div style={{
              margin: '1rem 0 1.25rem',
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} />
                <span>Voting Window</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="votingStartDate"
                    value={formData.votingStartDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="votingStartTime"
                    value={formData.votingStartTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              {formErrors.votingStartDate && (
                <div className="form-error" style={{ marginBottom: '0.75rem' }}>
                  {formErrors.votingStartDate}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="votingEndDate"
                    value={formData.votingEndDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="votingEndTime"
                    value={formData.votingEndTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              {formErrors.votingEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {formErrors.votingEndDate}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-admin"
              style={{ fontWeight: 600 }}
            >
              Create Election
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
