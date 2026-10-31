import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Vote,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { electionCreationSchema } from '../../schemas/authSchemas';
import type { ElectionCreationFormData } from '../../schemas/authSchemas';
import type { Election } from '../../types';

export const AdminElections: React.FC = () => {
  const currentTime = useCurrentTime(5000);

  const elections = useElectionStore((state) => state.elections);
  const isLoading = useElectionStore((state) => state.isLoading);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const createElection = useElectionStore((state) => state.createElection);
  const updateElection = useElectionStore((state) => state.updateElection);
  const deleteElection = useElectionStore((state) => state.deleteElection);

  // Modal & notification state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [deletingElection, setDeletingElection] = useState<Election | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    useElectionStore.getState().fetchElections();
  }, []);

  // Helper to split ISO string to date (YYYY-MM-DD) and time (HH:mm)
  const parseIsoToDateAndTime = (isoString?: string) => {
    if (!isoString) return { date: '', time: '09:00' };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        const parts = isoString.split('T');
        return { date: parts[0] || '', time: parts[1] ? parts[1].substring(0, 5) : '09:00' };
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
      };
    } catch {
      return { date: '', time: '09:00' };
    }
  };

  // Helper to render Period in exact 2-line layout: "mon date, year," on line 1, "time am/pm" on line 2
  const renderPeriodDateTime = (isoString?: string) => {
    if (!isoString) return <div style={{ color: '#94a3b8' }}>—</div>;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        return <div style={{ fontWeight: 600 }}>{isoString}</div>;
      }
      const datePart = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return (
        <div style={{ fontWeight: 600, lineHeight: 1.35 }}>
          <div>{datePart},</div>
          <div>{timePart}</div>
        </div>
      );
    } catch {
      return <div style={{ fontWeight: 600 }}>{isoString}</div>;
    }
  };

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

  const [createFormData, setCreateFormData] = useState<ElectionCreationFormData>(getInitialFormData);
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});

  const [editFormData, setEditFormData] = useState<ElectionCreationFormData>(getInitialFormData);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Form input handlers
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Submit Create Election
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormErrors({});

    const result = electionCreationSchema.safeParse(createFormData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      setCreateFormErrors(errors);
      return;
    }

    const padTime = (t: string) => (t.length === 5 ? `${t}:00` : t);
    const regStart = `${createFormData.registrationStartDate}T${padTime(createFormData.registrationStartTime)}`;
    const regEnd = `${createFormData.registrationEndDate}T${padTime(createFormData.registrationEndTime)}`;
    const voteStart = `${createFormData.votingStartDate}T${padTime(createFormData.votingStartTime)}`;
    const voteEnd = `${createFormData.votingEndDate}T${padTime(createFormData.votingEndTime)}`;

    setIsSaving(true);
    const res = await createElection({
      name: createFormData.name,
      description: createFormData.description,
      registrationStart: regStart,
      registrationEnd: regEnd,
      votingStart: voteStart,
      votingEnd: voteEnd,
    });
    setIsSaving(false);

    if (res.success && res.election) {
      setIsCreateModalOpen(false);
      setSuccessToast(`Election "${res.election.name}" created successfully!`);
      setCreateFormData(getInitialFormData());
      useElectionStore.getState().fetchElections();
    } else {
      setCreateFormErrors({ general: res.error || 'Failed to create election.' });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (election: Election) => {
    const status = getElectionStatus(election, currentTime);
    if (status === 'VOTING_OPEN' || status === 'COMPLETED') {
      alert('This election cannot be edited or deleted because it is voting open or completed.');
      return;
    }
    const votesCast = election.totalVotes ?? 0;
    if (votesCast > 0) {
      alert('This election cannot be edited or deleted because votes have already been cast.');
      return;
    }

    const regS = parseIsoToDateAndTime(election.registrationStart);
    const regE = parseIsoToDateAndTime(election.registrationEnd);
    const voteS = parseIsoToDateAndTime(election.votingStart);
    const voteE = parseIsoToDateAndTime(election.votingEnd);

    setEditingElection(election);
    setEditFormData({
      name: election.name,
      description: election.description || '',
      registrationStartDate: regS.date,
      registrationStartTime: regS.time,
      registrationEndDate: regE.date,
      registrationEndTime: regE.time,
      votingStartDate: voteS.date,
      votingStartTime: voteS.time,
      votingEndDate: voteE.date,
      votingEndTime: voteE.time,
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  // Submit Edit Election
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingElection) return;
    setEditFormErrors({});

    const result = electionCreationSchema.safeParse(editFormData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      setEditFormErrors(errors);
      return;
    }

    const padTime = (t: string) => (t.length === 5 ? `${t}:00` : t);
    const regStart = `${editFormData.registrationStartDate}T${padTime(editFormData.registrationStartTime)}`;
    const regEnd = `${editFormData.registrationEndDate}T${padTime(editFormData.registrationEndTime)}`;
    const voteStart = `${editFormData.votingStartDate}T${padTime(editFormData.votingStartTime)}`;
    const voteEnd = `${editFormData.votingEndDate}T${padTime(editFormData.votingEndTime)}`;

    // Chronological validation
    if (new Date(regEnd) <= new Date(regStart)) {
      setEditFormErrors({ registrationEndDate: 'Registration end must be after registration start.' });
      return;
    }
    if (new Date(voteStart) < new Date(regEnd)) {
      setEditFormErrors({ votingStartDate: 'Voting start must be after or equal to registration end.' });
      return;
    }
    if (new Date(voteEnd) <= new Date(voteStart)) {
      setEditFormErrors({ votingEndDate: 'Voting end must be after voting start.' });
      return;
    }

    setIsSaving(true);
    const res = await updateElection(editingElection.id, {
      name: editFormData.name,
      description: editFormData.description,
      registrationStart: regStart,
      registrationEnd: regEnd,
      votingStart: voteStart,
      votingEnd: voteEnd,
    });
    setIsSaving(false);

    if (res.success) {
      setIsEditModalOpen(false);
      setEditingElection(null);
      setSuccessToast(`Election "${editingElection.id} - ${editFormData.name}" updated successfully!`);
      useElectionStore.getState().fetchElections();
    } else {
      setEditFormErrors({ general: res.error || 'Failed to update election.' });
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (election: Election) => {
    const status = getElectionStatus(election, currentTime);
    if (status === 'VOTING_OPEN' || status === 'COMPLETED') {
      alert('This election cannot be edited or deleted because it is voting open or completed.');
      return;
    }
    const votesCast = election.totalVotes ?? 0;
    if (votesCast > 0) {
      alert('This election cannot be edited or deleted because votes have already been cast.');
      return;
    }
    setDeletingElection(election);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingElection) return;

    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteElection(deletingElection.id);
    setIsDeleting(false);

    if (res.success) {
      setIsDeleteModalOpen(false);
      setSuccessToast(`Election "${deletingElection.id} - ${deletingElection.name}" deleted successfully.`);
      setDeletingElection(null);
      useElectionStore.getState().fetchElections();
    } else {
      setDeleteError(res.error || 'Failed to delete election.');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            Election Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Create, manage, and schedule elections with automatic time-based status calculation.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateFormErrors({});
            setCreateFormData(getInitialFormData());
            setIsCreateModalOpen(true);
          }}
          className="btn btn-admin"
          style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={18} />
          <span>Create Election</span>
        </button>
      </div>

      {/* Success Toast Alert */}
      {successToast && (
        <div
          className="alert alert-success"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ fontWeight: 700, color: '#166534', padding: '0 0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Elections Table */}
      <div className="card">
        {isLoading && elections.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600 }}>Loading elections...</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>E.ID</th>
                  <th>Election Name</th>
                  <th>Registration Period</th>
                  <th>Voting Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Candidates</th>
                  <th style={{ textAlign: 'center' }}>Votes Cast</th>
                  <th>Results Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem' }}>
                      No elections created yet. Click &quot;Create Election&quot; above to configure your first election.
                    </td>
                  </tr>
                ) : (
                  elections.map((election) => {
                    const status = getElectionStatus(election, currentTime);
                    const candidatesCount = election.candidateCount ?? 0;
                    const votesCast = election.totalVotes ?? 0;
                    const hasVotes = votesCast > 0;

                    return (
                      <tr key={election.id}>
                        {/* E.ID */}
                        <td style={{ fontWeight: 700, color: '#2563eb' }}>
                          {election.id}
                        </td>

                        {/* Election Name */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{election.name}</div>
                        </td>

                        {/* Registration Period */}
                        <td style={{ fontSize: '0.825rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {renderPeriodDateTime(election.registrationStart)}
                          <div style={{ color: '#94a3b8', margin: '0.15rem 0' }}>to</div>
                          {renderPeriodDateTime(election.registrationEnd)}
                        </td>

                        {/* Voting Period */}
                        <td style={{ fontSize: '0.825rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {renderPeriodDateTime(election.votingStart)}
                          <div style={{ color: '#94a3b8', margin: '0.15rem 0' }}>to</div>
                          {renderPeriodDateTime(election.votingEnd)}
                        </td>

                        {/* Status */}
                        <td>
                          <Badge status={status} />
                        </td>

                        {/* Candidates */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 700,
                              padding: '0.25rem 0.6rem',
                              backgroundColor: '#f1f5f9',
                              color: '#0f172a',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            <Users size={13} color="#64748b" />
                            <span>{candidatesCount}</span>
                          </span>
                        </td>

                        {/* Votes Cast */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 700,
                              padding: '0.25rem 0.6rem',
                              backgroundColor: hasVotes ? '#eff6ff' : '#f8fafc',
                              color: hasVotes ? '#1d4ed8' : '#64748b',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            <Vote size={13} />
                            <span>{votesCast.toLocaleString()}</span>
                          </span>
                        </td>

                        {/* Results Status */}
                        <td>
                          {election.resultsPublished ? (
                            <span className="badge badge-published">Published</span>
                          ) : (
                            <span className="badge badge-not-published">Not Published</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'center' }}>
                          {status === 'VOTING_OPEN' || status === 'COMPLETED' ? (
                            <span
                              style={{
                                color: '#94a3b8',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                userSelect: 'none',
                              }}
                              title="No edit or delete available for Voting Open or Completed elections"
                            >
                              —
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(election)}
                                disabled={hasVotes || isSaving || isDeleting}
                                title={
                                  hasVotes
                                    ? 'This election cannot be edited or deleted because votes have already been cast.'
                                    : 'Edit Election'
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  border: hasVotes ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                  backgroundColor: hasVotes ? '#f8fafc' : '#ffffff',
                                  color: hasVotes ? '#94a3b8' : '#0f172a',
                                  cursor: hasVotes ? 'not-allowed' : 'pointer',
                                  opacity: hasVotes ? 0.55 : 1,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {hasVotes ? <Lock size={12} color="#94a3b8" /> : <Pencil size={12} color="#2563eb" />}
                                <span>Edit</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(election)}
                                disabled={hasVotes || isSaving || isDeleting}
                                title={
                                  hasVotes
                                    ? 'This election cannot be edited or deleted because votes have already been cast.'
                                    : 'Delete Election'
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  border: hasVotes ? '1px solid #e2e8f0' : '1px solid #fecaca',
                                  backgroundColor: hasVotes ? '#f8fafc' : '#fff5f5',
                                  color: hasVotes ? '#94a3b8' : '#dc2626',
                                  cursor: hasVotes ? 'not-allowed' : 'pointer',
                                  opacity: hasVotes ? 0.55 : 1,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Trash2 size={12} color={hasVotes ? '#94a3b8' : '#dc2626'} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Election Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSaving && setIsCreateModalOpen(false)}
        title="Create New Election"
        maxWidth="640px"
      >
        <form onSubmit={handleCreateSubmit} noValidate>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '0.825rem',
                color: '#166534',
                lineHeight: 1.45,
              }}
            >
              <strong>Participation Rules:</strong> Candidates can register while candidate registration is open.
              Voters can register before or after election creation, and can vote in this election as long as they
              register before voting starts.
            </div>

            {createFormErrors.general && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                {createFormErrors.general}
              </div>
            )}

            {/* Election Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="create_name">
                Election Name *
              </label>
              <input
                id="create_name"
                name="name"
                type="text"
                placeholder="City Assembly Election"
                value={createFormData.name}
                onChange={handleCreateInputChange}
                className={`form-input ${createFormErrors.name ? 'is-invalid' : ''}`}
                disabled={isSaving}
              />
              {createFormErrors.name && <div className="form-error">{createFormErrors.name}</div>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="create_description">
                Description (Optional)
              </label>
              <input
                id="create_description"
                name="description"
                type="text"
                placeholder="Brief purpose of this election"
                value={createFormData.description}
                onChange={handleCreateInputChange}
                className="form-input"
                disabled={isSaving}
              />
            </div>

            {/* Candidate Registration Section */}
            <div
              style={{
                margin: '1.25rem 0 1rem',
                padding: '1rem',
                backgroundColor: '#fff7ed',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#9a3412',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar size={16} />
                <span>Candidate Registration Window</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="registrationStartDate"
                    value={createFormData.registrationStartDate}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="registrationStartTime"
                    value={createFormData.registrationStartTime}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="registrationEndDate"
                    value={createFormData.registrationEndDate}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="registrationEndTime"
                    value={createFormData.registrationEndTime}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {createFormErrors.registrationEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {createFormErrors.registrationEndDate}
                </div>
              )}
            </div>

            {/* Voting Period Section */}
            <div
              style={{
                margin: '1rem 0 1.25rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#166534',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Clock size={16} />
                <span>Voting Window</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="votingStartDate"
                    value={createFormData.votingStartDate}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="votingStartTime"
                    value={createFormData.votingStartTime}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {createFormErrors.votingStartDate && (
                <div className="form-error" style={{ marginBottom: '0.75rem' }}>
                  {createFormErrors.votingStartDate}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="votingEndDate"
                    value={createFormData.votingEndDate}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="votingEndTime"
                    value={createFormData.votingEndTime}
                    onChange={handleCreateInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {createFormErrors.votingEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {createFormErrors.votingEndDate}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-outline"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-admin"
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={isSaving}
            >
              {isSaving && <Loader2 size={16} className="spin" />}
              <span>{isSaving ? 'Saving...' : 'Create Election'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Election Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSaving && setIsEditModalOpen(false)}
        title={`Edit Election: ${editingElection?.id || ''}`}
        maxWidth="640px"
      >
        <form onSubmit={handleEditSubmit} noValidate>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {/* System Info Banner (Read-only metadata) */}
            {editingElection && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Election ID
                  </div>
                  <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>
                    {editingElection.id}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Candidates
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                    {editingElection.candidateCount ?? 0}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Votes Cast
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                    {(editingElection.totalVotes ?? 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Status
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <Badge status={getElectionStatus(editingElection, currentTime)} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Results
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    {editingElection.resultsPublished ? (
                      <span className="badge badge-published" style={{ fontSize: '0.7rem' }}>Published</span>
                    ) : (
                      <span className="badge badge-not-published" style={{ fontSize: '0.7rem' }}>Not Published</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {editFormErrors.general && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                {editFormErrors.general}
              </div>
            )}

            {/* Election Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit_name">
                Election Name *
              </label>
              <input
                id="edit_name"
                name="name"
                type="text"
                placeholder="Election Title"
                value={editFormData.name}
                onChange={handleEditInputChange}
                className={`form-input ${editFormErrors.name ? 'is-invalid' : ''}`}
                disabled={isSaving}
              />
              {editFormErrors.name && <div className="form-error">{editFormErrors.name}</div>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit_description">
                Description
              </label>
              <textarea
                id="edit_description"
                name="description"
                rows={2}
                placeholder="Brief description of this election"
                value={editFormData.description}
                onChange={handleEditInputChange}
                className="form-input"
                disabled={isSaving}
              />
            </div>

            {/* Candidate Registration Section */}
            <div
              style={{
                margin: '1.25rem 0 1rem',
                padding: '1rem',
                backgroundColor: '#fff7ed',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#9a3412',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar size={16} />
                <span>Registration Period</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="registrationStartDate"
                    value={editFormData.registrationStartDate}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="registrationStartTime"
                    value={editFormData.registrationStartTime}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="registrationEndDate"
                    value={editFormData.registrationEndDate}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="registrationEndTime"
                    value={editFormData.registrationEndTime}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {editFormErrors.registrationEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {editFormErrors.registrationEndDate}
                </div>
              )}
            </div>

            {/* Voting Period Section */}
            <div
              style={{
                margin: '1rem 0 1.25rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#166534',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Clock size={16} />
                <span>Voting Period</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="votingStartDate"
                    value={editFormData.votingStartDate}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="votingStartTime"
                    value={editFormData.votingStartTime}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {editFormErrors.votingStartDate && (
                <div className="form-error" style={{ marginBottom: '0.75rem' }}>
                  {editFormErrors.votingStartDate}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="votingEndDate"
                    value={editFormData.votingEndDate}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="votingEndTime"
                    value={editFormData.votingEndTime}
                    onChange={handleEditInputChange}
                    className="form-input"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {editFormErrors.votingEndDate && (
                <div className="form-error" style={{ marginTop: '0.25rem' }}>
                  {editFormErrors.votingEndDate}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-outline"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-admin"
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={isSaving}
            >
              {isSaving && <Loader2 size={16} className="spin" />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        maxWidth="480px"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                backgroundColor: '#fee2e2',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                Are you sure you want to delete this election?
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                This action is permanent and will remove this election and any candidate registrations associated with it.
              </p>
            </div>
          </div>

          {deletingElection && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.9rem' }}>
                  {deletingElection.id}
                </span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                  {deletingElection.name}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Votes Cast: <strong>{deletingElection.totalVotes ?? 0}</strong> • Candidates: <strong>{deletingElection.candidateCount ?? 0}</strong>
              </div>
            </div>
          )}

          {deleteError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              {deleteError}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-outline"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="btn btn-danger"
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 size={16} className="spin" />}
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
