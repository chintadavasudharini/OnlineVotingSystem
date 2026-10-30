import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Calendar,
  Trophy,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const AdminLayout: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="dashboard-layout theme-admin admin-main">
      {/* Sidebar */}
      <aside className={`sidebar admin-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em' }}>ADMIN CONSOLE</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Election Management</div>
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

        {/* Admin Badge */}
        <div style={{
          padding: '0.85rem 1.25rem',
          margin: '0.75rem',
          borderRadius: '8px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Access Level
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
            <span>Super Administrator</span>
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: '#3b82f6', borderRadius: '4px' }}>ROOT</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/voters"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>View Voters</span>
          </NavLink>
          <NavLink
            to="/admin/candidates"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <UserSquare2 size={18} />
            <span>View Candidates</span>
          </NavLink>
          <NavLink
            to="/admin/elections"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Elections</span>
          </NavLink>
          <NavLink
            to="/admin/audit-logs"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>Audit Logs</span>
          </NavLink>
          <NavLink
            to="/admin/results"
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
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar" style={{ backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="mobile-toggle-btn btn btn-outline btn-sm"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
              System Administration
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Logged in as <strong style={{ color: '#0f172a' }}>admin</strong>
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
