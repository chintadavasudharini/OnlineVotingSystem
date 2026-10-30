import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await login(username, password, 'ADMIN');
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(res.error || 'Invalid administrator credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      color: '#f8fafc'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '12px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            System Administrator
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Authorized election administrator access only
          </p>
        </div>

        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} />
                <span>Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#ffffff',
                }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} />
                <span>Password</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.75rem 0.65rem 0.85rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#ffffff',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  style={{ color: '#94a3b8' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-block btn-lg"
              style={{
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              <span>Login to Console</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            &larr; Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
