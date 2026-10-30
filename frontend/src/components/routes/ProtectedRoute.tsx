import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, role, isHydrated } = useAuthStore();
  const location = useLocation();

  // Guard against premature redirects while Zustand authentication is hydrating
  if (!isHydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '0.95rem',
        fontWeight: 500,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '3px solid #cbd5e1',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to appropriate login portal with location state
  if (!isAuthenticated) {
    if (allowedRole === 'ADMIN') {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but role doesn't match:
  // Render an in-place Access Denied screen on the exact current URL without cross-redirecting
  if (role !== allowedRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '2rem',
      }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '2.5rem 2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            This page requires <strong>{allowedRole}</strong> credentials. You are currently logged in with the <strong>{role}</strong> role.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.history.back()}
              className="btn btn-outline"
            >
              Go Back
            </button>
            <Link
              to={role === 'ADMIN' ? '/admin/dashboard' : role === 'CANDIDATE' ? '/candidate/dashboard' : '/voter/dashboard'}
              className="btn btn-election"
              style={{ color: '#ffffff' }}
            >
              Go to Your Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
