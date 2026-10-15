import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { UserCheck, Award, ArrowRight, CheckCircle2, Eye, EyeOff, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { voterRegistrationSchema } from '../../schemas/authSchemas';
import { calculateAge } from '../../utils/dateFormatter';
import { useVoterStore } from '../../stores/voterStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { Modal } from '../../components/common/Modal';

type RegistrationRole = 'VOTER' | 'CANDIDATE';

const MAX_BIRTH_DATE = new Date().toISOString().split('T')[0];

export const RegisterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const role: RegistrationRole = searchParams.get('role') === 'candidate' ? 'CANDIDATE' : 'VOTER';

  // Voter registration state
  const [voterData, setVoterData] = useState({
    name: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });

  // Candidate registration state (requires existing voter account)
  const [candidateData, setCandidateData] = useState({
    voterId: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCandidatePassword, setShowCandidatePassword] = useState(false);
  const [showCandidateConfirmPassword, setShowCandidateConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ id: string; role: RegistrationRole; voterId?: string } | null>(null);

  const registerVoter = useVoterStore((state) => state.registerVoter);
  const registerCandidateFromVoter = useCandidateStore((state) => state.registerCandidateFromVoter);

  const calculatedAge = voterData.dob ? calculateAge(voterData.dob) : null;
  const isVoterAgeEligible = calculatedAge !== null && calculatedAge >= 18;

  const handleRoleChange = (newRole: RegistrationRole) => {
    setSearchParams({ role: newRole.toLowerCase() });
    setErrors({});
  };

  const handleVoterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVoterData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCandidateData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      name: voterData.name,
      email: voterData.email,
      dob: voterData.dob,
      password: voterData.password,
      confirmPassword: voterData.confirmPassword,
    };

    const result = voterRegistrationSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const age = calculateAge(result.data.dob);

    const res = await registerVoter({
      name: result.data.name,
      email: result.data.email,
      dob: result.data.dob,
      age,
      password: result.data.password,
    });

    if (res.success && res.voter) {
      setSuccessInfo({ id: res.voter.id, role: 'VOTER' });
    } else {
      setErrors({ email: res.error || 'Registration failed.' });
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedVoterId = candidateData.voterId.trim();
    const fieldErrors: Record<string, string> = {};

    if (!trimmedVoterId) {
      fieldErrors.voterId = 'Existing Voter ID is required.';
    }

    if (!candidateData.password) {
      fieldErrors.password = 'Create Password is required.';
    } else if (candidateData.password.length < 6) {
      fieldErrors.password = 'Password must be at least 6 characters.';
    }

    if (!candidateData.confirmPassword) {
      fieldErrors.confirmPassword = 'Confirm Password is required.';
    } else if (candidateData.password !== candidateData.confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const result = await registerCandidateFromVoter({
      voterId: trimmedVoterId,
      password: candidateData.password,
    });

    if (!result.success || !result.candidate) {
      setErrors({ voterId: result.message });
      return;
    }

    setSuccessInfo({
      id: result.candidate.id,
      role: 'CANDIDATE',
      voterId: trimmedVoterId,
    });
  };

  const handleSuccessClose = () => {
    const roleParam = successInfo?.role.toLowerCase();
    setSuccessInfo(null);
    navigate(`/login?role=${roleParam}`);
  };

  return (
    <div className="container" style={{ maxWidth: 540, margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Create Account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Register as a verified voter or create a candidate account.
          </p>

          {/* Role Selector */}
          <div style={{ marginTop: '1.75rem', marginBottom: '0.5rem' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                marginBottom: '16px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#475569',
              }}
            >
              Register As
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '48px',
              }}
            >
              {/* Voter Option */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="registerRole"
                  value="VOTER"
                  checked={role === 'VOTER'}
                  onChange={() => handleRoleChange('VOTER')}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    borderRadius: '50%',
                    border: `2px solid ${role === 'VOTER' ? '#16a34a' : '#cbd5e1'}`,
                    backgroundColor: role === 'VOTER' ? '#16a34a' : '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 150ms ease',
                    boxShadow: role === 'VOTER' ? '0 2px 4px rgba(22, 163, 74, 0.25)' : 'none',
                  }}
                >
                  {role === 'VOTER' && <Check size={14} strokeWidth={3} />}
                </span>
                <UserCheck size={20} color={role === 'VOTER' ? '#16a34a' : '#0f172a'} />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: role === 'VOTER' ? '#16a34a' : '#0f172a',
                    transition: 'color 150ms ease',
                  }}
                >
                  Voter
                </span>
              </label>

              {/* Candidate Option */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="registerRole"
                  value="CANDIDATE"
                  checked={role === 'CANDIDATE'}
                  onChange={() => handleRoleChange('CANDIDATE')}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    borderRadius: '50%',
                    border: `2px solid ${role === 'CANDIDATE' ? '#ea580c' : '#cbd5e1'}`,
                    backgroundColor: role === 'CANDIDATE' ? '#ea580c' : '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 150ms ease',
                    boxShadow: role === 'CANDIDATE' ? '0 2px 4px rgba(234, 88, 12, 0.25)' : 'none',
                  }}
                >
                  {role === 'CANDIDATE' && <Check size={14} strokeWidth={3} />}
                </span>
                <Award size={20} color={role === 'CANDIDATE' ? '#ea580c' : '#0f172a'} />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: role === 'CANDIDATE' ? '#ea580c' : '#0f172a',
                    transition: 'color 150ms ease',
                  }}
                >
                  Candidate
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ paddingTop: '0.5rem' }}>
          {role === 'VOTER' ? (
            /* Voter Registration Form */
            <form onSubmit={handleVoterSubmit} noValidate>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Rahul Sharma"
                  value={voterData.name}
                  onChange={handleVoterChange}
                  className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={voterData.email}
                  onChange={handleVoterChange}
                  className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label" htmlFor="dob">
                  Date of Birth (Minimum 18 years)
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  max={MAX_BIRTH_DATE}
                  value={voterData.dob}
                  onChange={handleVoterChange}
                  className={`form-input ${errors.dob ? 'is-invalid' : ''}`}
                />
                {errors.dob && <div className="form-error">{errors.dob}</div>}
                {voterData.dob && !errors.dob && calculatedAge !== null && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      color: isVoterAgeEligible ? '#15803d' : '#dc2626',
                      fontWeight: 500,
                    }}
                  >
                    Calculated Age: {calculatedAge} years &bull;{' '}
                    {isVoterAgeEligible ? 'Eligible to vote (18+)' : 'Must be at least 18 years old'}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Create Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={voterData.password}
                    onChange={handleVoterChange}
                    className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={voterData.confirmPassword}
                    onChange={handleVoterChange}
                    className={`form-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-voter btn-block btn-lg"
                >
                  <span>Register as Voter</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          ) : (
            /* Candidate Account Creation (Requires Existing Voter Account) */
            <form onSubmit={handleCandidateSubmit} noValidate>
              <div style={{
                padding: '0.9rem 1rem',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#9a3412',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} />
                  <span>Candidate Account Eligibility</span>
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  <li>A candidate <strong>must have an existing Voter account</strong>.</li>
                  <li>The voter must be <strong>25 years or older</strong>.</li>
                </ul>
              </div>

              {/* Existing Voter ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="voterId" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} color="#ea580c" />
                  <span>Existing Voter ID</span>
                </label>
                <input
                  id="voterId"
                  name="voterId"
                  type="text"
                  placeholder="Enter registered Voter ID"
                  value={candidateData.voterId}
                  onChange={handleCandidateChange}
                  className={`form-input ${errors.voterId ? 'is-invalid' : ''}`}
                />
                {errors.voterId && (
                  <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{errors.voterId}</span>
                  </div>
                )}
              </div>

              {/* Create Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="candidatePassword">
                  Create Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="candidatePassword"
                    name="password"
                    type={showCandidatePassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={candidateData.password}
                    onChange={handleCandidateChange}
                    className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                    className="password-toggle-btn"
                    aria-label={showCandidatePassword ? 'Hide password' : 'Show password'}
                    title={showCandidatePassword ? 'Hide password' : 'Show password'}
                  >
                    {showCandidatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="candidateConfirmPassword">
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="candidateConfirmPassword"
                    name="confirmPassword"
                    type={showCandidateConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={candidateData.confirmPassword}
                    onChange={handleCandidateChange}
                    className={`form-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCandidateConfirmPassword(!showCandidateConfirmPassword)}
                    className="password-toggle-btn"
                    aria-label={showCandidateConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showCandidateConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCandidateConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-candidate btn-block btn-lg"
                >
                  <Award size={18} />
                  <span>Register as Candidate</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                Don't have a Voter account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleRoleChange('VOTER')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803d',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Register as Voter first
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card-footer" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Already have an ID?{' '}
            <Link to={`/login?role=${role.toLowerCase()}`} style={{ color: role === 'VOTER' ? '#15803d' : '#ea580c', fontWeight: 600 }}>
              Login here
            </Link>
          </span>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(successInfo)}
        onClose={handleSuccessClose}
        title={successInfo?.role === 'VOTER' ? 'Voter Registration Successful!' : 'Candidate Account Created!'}
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: successInfo?.role === 'VOTER' ? '#dcfce7' : '#ffedd5',
            color: successInfo?.role === 'VOTER' ? '#16a34a' : '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            {successInfo?.role === 'VOTER' ? 'Voter Registration Successful!' : 'Candidate Account Created!'}
          </h3>

          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1rem' }}>
            Your unique {successInfo?.role === 'VOTER' ? 'Voter' : 'Candidate'} ID is:
          </p>

          <div style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: successInfo?.role === 'VOTER' ? '#f0fdf4' : '#fff7ed',
            border: `2px dashed ${successInfo?.role === 'VOTER' ? '#16a34a' : '#ea580c'}`,
            borderRadius: '8px',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: successInfo?.role === 'VOTER' ? '#15803d' : '#ea580c',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            {successInfo?.id}
          </div>

          {successInfo?.voterId && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Linked Voter Account: <strong>{successInfo.voterId}</strong>
            </div>
          )}

          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Please use this ID (<strong>{successInfo?.id}</strong>) to log in.
          </p>

          <button
            onClick={handleSuccessClose}
            className={`btn btn-block btn-lg ${successInfo?.role === 'VOTER' ? 'btn-voter' : 'btn-candidate'}`}
          >
            Proceed to Login
          </button>
        </div>
      </Modal>
    </div>
  );
};
