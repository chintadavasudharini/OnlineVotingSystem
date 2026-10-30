import React from 'react';
import { Link } from 'react-router-dom';
import {
  Vote,
  ShieldCheck,
  Users,
  Award,
  ArrowRight,
  Lock,
  CheckCircle2,
  Fingerprint,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {

  return (
    <div className="container" style={{ padding: '1rem 1.25rem 4rem' }}>
      {/* Hero Section */}
      <section className="home-hero-section">
        {/* Badge Pill */}
        <div className="home-badge-pill">
          <span className="pulse-dot" style={{ backgroundColor: '#16a34a' }} />
          <span>Next-Generation Digital Democratic Infrastructure</span>
          <Sparkles size={14} />
        </div>

        {/* Hero Title */}
        <h1 className="home-title">
          Secure. Transparent.{' '}
          <span className="home-title-highlight">Digital Democracy.</span>
        </h1>

        {/* Subtitle */}
        <p className="home-subtitle">
          An integrated, cryptographic election ecosystem engineered for indisputable integrity.
          Verified citizen voting, transparent candidate nominations, and tamper-evident audit trails.
        </p>

        {/* CTA Buttons */}
        <div className="home-cta-group">
          <Link
            to="/elections"
            className="btn btn-lg btn-election"
            style={{ fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
          >
            <Vote size={20} />
            Explore Elections
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/register?role=VOTER"
            className="btn btn-lg btn-voter"
            style={{ fontWeight: 600, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
          >
            <UserCheck size={20} />
            Register to Vote
          </Link>
          <Link
            to="/login"
            className="btn btn-lg btn-outline"
            style={{ fontWeight: 600 }}
          >
            Login
          </Link>
        </div>

        {/* Trust Badges Bar */}
        <div className="home-trust-bar">
          <div className="home-trust-item">
            <ShieldCheck size={16} color="#16a34a" />
            <span>SHA-256 Audit Trail</span>
          </div>
          <div className="home-trust-item">
            <Lock size={16} color="#2563eb" />
            <span>Confidential Secret Ballots</span>
          </div>
          <div className="home-trust-item">
            <Fingerprint size={16} color="#ea580c" />
            <span>Strict Age Verification</span>
          </div>
          <div className="home-trust-item">
            <CheckCircle2 size={16} color="#0f172a" />
            <span>1-Citizen 1-Vote Guarantee</span>
          </div>
        </div>
      </section>


      {/* Dedicated Portals Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="home-section-header">
          <span className="home-section-tag">Role-Based Ecosystems</span>
          <h2 className="home-section-title">Built for Citizens and Nominees</h2>
          <p className="home-section-desc">
            Independent, purpose-built workflows tailored for citizens casting ballots and nominees seeking mandate.
          </p>
        </div>

        <div className="home-portals-grid">
          {/* Voter Card */}
          <div className="home-portal-card voter-card">
            <div>
              <div
                className="home-portal-icon"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
              >
                <Users size={28} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-published" style={{ fontSize: '0.75rem' }}>
                  Ages 18+
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Citizen Portal
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Voter Portal
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Cast your vote in ongoing elections with guaranteed privacy and verified one-person-one-ballot enforcement.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> Instant eligibility check
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> Confidential secret ballot casting
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> Upgrade to candidate if eligible (25+)
                </li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/register?role=VOTER" className="btn btn-voter" style={{ flex: 1 }}>
                Register as Voter
              </Link>
              <Link to="/login?role=VOTER" className="btn btn-outline">
                Login
              </Link>
            </div>
          </div>

          {/* Candidate Card */}
          <div className="home-portal-card candidate-card">
            <div>
              <div
                className="home-portal-icon"
                style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}
              >
                <Award size={28} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontSize: '0.75rem' }}>
                  Ages 25+
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Nominee Portal
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Candidate Portal
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Register from your verified Voter profile to contest open elections with unique Candidate identification.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#ea580c" /> Unique Candidate ID assignment
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#ea580c" /> Direct election nomination filing
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle2 size={16} color="#ea580c" /> Real-time certified result tracking
                </li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/register?role=CANDIDATE" className="btn btn-candidate" style={{ flex: 1 }}>
                Candidate Account
              </Link>
              <Link to="/login?role=CANDIDATE" className="btn btn-outline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How the Process Works */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="home-section-header">
          <span className="home-section-tag">Lifecycle Architecture</span>
          <h2 className="home-section-title">How Digital Voting Works</h2>
          <p className="home-section-desc">
            A step-by-step verifiable journey from citizen registration to official result declaration.
          </p>
        </div>

        <div className="home-steps-grid">
          <div className="home-step-card">
            <div className="home-step-number">1</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Citizen Registration
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Eligible citizens (18+) register with their date of birth, generating a unique, verified Voter ID.
            </p>
          </div>

          <div className="home-step-card">
            <div className="home-step-number">2</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Election Creation
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              The Election Commission establishes strict nomination and voting timeframes, freezing the eligible voter snapshot.
            </p>
          </div>

          <div className="home-step-card">
            <div className="home-step-number">3</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Candidate Nomination
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Qualified voters (25+) register candidate profiles and enroll in the election during the open registration period.
            </p>
          </div>

          <div className="home-step-card">
            <div className="home-step-number">4</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Voting & Certified Results
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Voters cast secret ballots during the voting window. Upon conclusion, the Admin certifies and publishes verified results.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Integrity Pillars */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="home-section-header">
          <span className="home-section-tag">Security & Verifiability</span>
          <h2 className="home-section-title">Built with Mathematical Integrity</h2>
          <p className="home-section-desc">
            Engineered from the ground up to prevent voter fraud, late manipulation, and ballot duplication.
          </p>
        </div>

        <div className="home-security-grid">
          <div className="home-security-card">
            <div style={{ color: '#2563eb', marginBottom: '0.75rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Tamper-Proof Audit Trail
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Every ballot cast, election scheduled, and profile registered generates an immutable audit entry with SHA-256 integrity verification.
            </p>
          </div>

          <div className="home-security-card">
            <div style={{ color: '#16a34a', marginBottom: '0.75rem' }}>
              <Lock size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Snapshot Eligibility Guard
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Voters must be registered before an election’s voting period commences to be eligible, preventing late illegitimate voter injection.
            </p>
          </div>

          <div className="home-security-card">
            <div style={{ color: '#ea580c', marginBottom: '0.75rem' }}>
              <Vote size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Strict Single-Ballot Rule
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              The system enforces an unbreakable constraint: exactly one vote per citizen per election. Duplicate voting attempts are completely prevented.
            </p>
          </div>

          <div className="home-security-card">
            <div style={{ color: '#0f172a', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Certified Result Publishing
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Outcome tallies remain unexposed until elections officially conclude and are verified and published by the authorized election commissioner.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="home-cta-banner">
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Ready to Exercise Your Democratic Right?
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Join your fellow citizens on a secure, certified digital voting system built for fair and transparent elections.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link
            to="/register?role=VOTER"
            className="btn btn-lg btn-voter home-cta-btn-voter"
          >
            Register as Voter
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/elections"
            className="btn btn-lg home-cta-btn-elections"
          >
            View Active Elections
          </Link>
        </div>
      </section>
    </div>
  );
};
