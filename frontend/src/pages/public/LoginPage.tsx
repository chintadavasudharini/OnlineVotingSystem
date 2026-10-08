import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { UserCheck, Award, ArrowRight, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

type LoginRole = 'VOTER' | 'CANDIDATE';

export const LoginPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const role: LoginRole = searchParams.get('role') === 'candidate' ? 'CANDIDATE' : 'VOTER';

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  const handleRoleChange = (newRole: LoginRole) => {
    setSearchParams({ role: newRole.toLowerCase() });
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!id.trim() || !password) {
      setErrorMessage(`Please enter your ${role === 'VOTER' ? 'Voter' : 'Candidate'} ID and password.`);
      return;
    }

    const result = login(id, password, role);

    if (result.success) {
      if (role === 'VOTER') {
        navigate('/voter/profile');
      } else {
        navigate('/candidate/profile');
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480, margin: '2.5rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Login
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Access your secure voting or candidate portal
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
              Login As
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
                  name="loginRole"
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
                  name="loginRole"
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
          {errorMessage && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ID Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="userId">
                {role === 'VOTER' ? 'Voter ID' : 'Candidate ID'}
              </label>
              <input
                id="userId"
                type="text"
                placeholder={role === 'VOTER' ? 'Enter Voter ID' : 'Enter Candidate ID'}
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="form-input"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  autoComplete="current-password"
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
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                className={`btn btn-block btn-lg ${role === 'VOTER' ? 'btn-voter' : 'btn-candidate'}`}
              >
                <span>Login as {role === 'VOTER' ? 'Voter' : 'Candidate'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="card-footer" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Don't have an ID yet?{' '}
            <Link to={`/register?role=${role.toLowerCase()}`} style={{ color: role === 'VOTER' ? '#15803d' : '#ea580c', fontWeight: 600 }}>
              Register here
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};
