import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Vote, Menu, X, ShieldCheck } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="page-wrapper theme-public">
      <header className="public-header">
        <div className="container public-navbar">
          <Link to="/" className="brand-logo">
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}>
              <Vote size={22} />
            </div>
            <div>
              <span style={{ letterSpacing: '0.04em', fontWeight: 800, color: '#0f172a' }}>
                ONLINE VOTING SYSTEM
              </span>
              <div style={{ display: 'flex', gap: '4px', height: '3px', marginTop: '2px', borderRadius: '2px', overflow: 'hidden' }}>
                <span style={{ flex: 1, backgroundColor: '#ea580c' }} />
                <span style={{ flex: 1, backgroundColor: '#2563eb' }} />
                <span style={{ flex: 1, backgroundColor: '#16a34a' }} />
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-links desktop-only">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/elections" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Elections
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Login
            </NavLink>
            <NavLink
              to="/register"
              className="btn btn-sm btn-election"
              style={{ padding: '0.5rem 1.15rem', color: '#ffffff' }}
            >
              Register
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-toggle-btn btn btn-outline"
            style={{ padding: '0.4rem 0.6rem' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <Link
              to="/"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/elections"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Elections
            </Link>
            <Link
              to="/login"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-election"
              onClick={() => setMobileMenuOpen(false)}
              style={{ marginTop: '0.5rem' }}
            >
              Register
            </Link>
          </div>
        )}
      </header>

      <main className="content-area">
        <Outlet />
      </main>

      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '2rem 1.25rem',
        marginTop: 'auto',
      }}>
        <div className="container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#2563eb" />
            <span>Online Voting System &bull; Secure &bull; Transparent &bull; Digital</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span>Strict Role-Based Access for Voters and Candidates</span>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Reset all test data and restart fresh"
            >
              ↺ Reset to Fresh State
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
