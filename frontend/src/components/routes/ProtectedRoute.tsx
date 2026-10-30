import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

  if (!isAuthenticated) {
    if (allowedRole === 'ADMIN') {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but role doesn't match
  if (role !== allowedRole) {
    if (role === 'VOTER') {
      return <Navigate to="/voter/profile" replace />;
    }
    if (role === 'CANDIDATE') {
      return <Navigate to="/candidate/profile" replace />;
    }
    if (role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
