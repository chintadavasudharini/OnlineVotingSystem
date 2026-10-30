import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserCheck, Vote, Trophy, LogOut, Menu, X, Award } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const CandidateLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout theme-candidate">
      {/* Sidebar */}
      <aside className={`sidebar candidate-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>CANDIDATE PORTAL</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>SECURE VOTE</div>
            </div>
          </div>
          <button
            className="mobile-toggle-btn"
            style={{ color: '#ffffff' }}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
          padding: '1rem 1.25rem',
          margin: '0.75rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Logged in as:</div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentUser?.name}</div>
          <div style={{
            display: 'inline-block',
            marginTop: '0.35rem',
            padding: '0.15rem 0.5rem',
            backgroundColor: '#fb923c',
            color: '#7c2d12',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            Candidate ID: {currentUser?.id}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          <NavLink
            to="/candidate/profile"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <UserCheck size={18} />
            <span>Profile</span>
          </NavLink>
          <NavLink
            to="/candidate/elections"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Vote size={18} />
            <span>Elections</span>
          </NavLink>
          <NavLink
            to="/candidate/results"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Trophy size={18} />
            <span>Results</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-link-logout"
            style={{ width: '100%' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="mobile-toggle-btn btn btn-outline btn-sm"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div style={{ fontWeight: 600, color: '#ea580c', fontSize: '1rem' }}>
              Candidate Area
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              ID: <strong style={{ color: '#ea580c' }}>{currentUser?.id}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-logout"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="desktop-only">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
