import React from 'react';
import { Award, Mail, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const CandidateProfile: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9a3412', marginBottom: '0.35rem' }}>
          Candidate Profile
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Official registered candidate credentials (Read-only)
        </p>
      </div>

      <div className="card">
        <div className="card-header" style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                {currentUser?.name}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Candidate ID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} color="#ea580c" />
                <span>Candidate ID</span>
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.id || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#ea580c' }}
              />
            </div>

            {/* Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={16} color="#ea580c" />
                <span>Name</span>
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.name || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>

            {/* Date of Birth */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} color="#ea580c" />
                <span>Date of Birth</span>
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.dob || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>

            {/* Age */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} color="#ea580c" />
                <span>Age</span>
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.age !== undefined ? `${currentUser.age} years old` : ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={16} color="#ea580c" />
                <span>Email</span>
              </label>
              <input
                type="email"
                readOnly
                value={currentUser?.email || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>
          </div>
        </div>

        <div className="card-footer" style={{ backgroundColor: '#fff7ed' }}>
          <span style={{ fontSize: '0.8rem', color: '#9a3412' }}>
            Candidate eligibility requirement: Minimum age 25 years.
          </span>
        </div>
      </div>
    </div>
  );
};
