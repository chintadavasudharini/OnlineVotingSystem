import React, { useEffect, useState } from 'react';
import { Award, Mail, Calendar, Clock, ShieldCheck, UserCheck, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import type { User } from '../../types';

export const CandidateProfile: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [profile, setProfile] = useState<User | null>(currentUser);

  useEffect(() => {
    let isMounted = true;
    api.get('/voters/profile')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setProfile(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const user = profile || currentUser;

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
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9a3412', fontWeight: 600 }}>
                Candidate Account {user?.voterId ? `• Linked Voter ID: ${user.voterId}` : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={16} color="#ea580c" />
                <span>Name</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.name || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}
              />
            </div>

            {/* 2. Candidate ID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} color="#ea580c" />
                <span>Candidate ID</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.id || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#ea580c' }}
              />
            </div>

            {/* 3. Voter ID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={16} color="#15803d" />
                <span>Voter ID</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.voterId || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#15803d' }}
              />
            </div>

            {/* 4. Date of Birth */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} color="#ea580c" />
                <span>Date of Birth</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.dob || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>

            {/* 5. Age */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} color="#ea580c" />
                <span>Age</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.age !== undefined ? `${user.age} years old` : ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>

            {/* 6. Email */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={16} color="#ea580c" />
                <span>Email</span>
              </label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="form-input"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>
          </div>
        </div>

        <div className="card-footer" style={{ backgroundColor: '#fff7ed' }}>
          <span style={{ fontSize: '0.8rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={14} color="#ea580c" />
            Candidate eligibility verified: Minimum age 25 years & linked to verified voter registry.
          </span>
        </div>
      </div>
    </div>
  );
};
