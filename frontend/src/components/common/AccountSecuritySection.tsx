import React, { useState } from 'react';
import { Shield, KeyRound, Mail, AlertCircle, CheckCircle2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { OtpModal } from './OtpModal';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface AccountSecuritySectionProps {
  currentEmail: string;
  themeColor?: string; // e.g. '#15803d' for voter or '#ea580c' for candidate
}

export const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  currentEmail,
  themeColor = '#2563eb',
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const setUser = useAuthStore((state) => state.setUser);
  const token = useAuthStore((state) => state.token);

  // Update Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);

  // Update Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  // Global OtpModal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'PASSWORD' | 'EMAIL'>('PASSWORD');
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // ----------------------------------------------------
  // Update Password Handlers
  // ----------------------------------------------------
  const handleInitiatePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSendingPasswordOtp(true);
    try {
      const res = await api.post('/auth/update-password/send-otp', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data && res.data.success) {
        setShowPasswordModal(false);
        setOtpTargetEmail(currentEmail);
        setOtpPurpose('PASSWORD');
        setShowOtpModal(true);
      } else {
        setPasswordError(res.data?.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to initiate password update.');
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  // ----------------------------------------------------
  // Update Email Handlers
  // ----------------------------------------------------
  const handleInitiateEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setEmailError('New email must be different from current registered email.');
      return;
    }

    setIsSendingEmailOtp(true);
    try {
      const res = await api.post('/auth/update-email/send-otp', {
        newEmail: trimmed,
      });

      if (res.data && res.data.success) {
        setShowEmailModal(false);
        setOtpTargetEmail(trimmed);
        setOtpPurpose('EMAIL');
        setShowOtpModal(true);
      } else {
        setEmailError(res.data?.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setEmailError(err.response?.data?.message || err.message || 'Failed to initiate email update.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // ----------------------------------------------------
  // OTP Verification & Resend Handlers
  // ----------------------------------------------------
  const handleOtpVerify = async (otp: string) => {
    try {
      if (otpPurpose === 'PASSWORD') {
        const res = await api.post('/auth/update-password/verify-otp', {
          email: currentEmail,
          otp,
          purpose: 'UPDATE_PASSWORD',
        });
        if (res.data && res.data.success) {
          setShowOtpModal(false);
          setGlobalSuccess('Account password updated successfully! A confirmation email has been dispatched.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          return { success: true };
        }
        return { success: false, message: res.data?.message || 'Invalid OTP code.' };
      } else {
        const res = await api.post('/auth/update-email/verify-otp', {
          email: otpTargetEmail,
          otp,
          purpose: 'UPDATE_EMAIL',
        });
        if (res.data && res.data.success) {
          setShowOtpModal(false);
          setGlobalSuccess(`Email updated successfully to ${otpTargetEmail}!`);
          if (currentUser && token) {
            setUser({ ...currentUser, email: otpTargetEmail }, token);
          }
          setNewEmail('');
          return { success: true };
        }
        return { success: false, message: res.data?.message || 'Invalid OTP code.' };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Verification failed.';
      return { success: false, message: msg };
    }
  };

  const handleOtpResend = async () => {
    try {
      if (otpPurpose === 'PASSWORD') {
        const res = await api.post('/auth/update-password/send-otp', {
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        });
        return { success: true, message: res.data?.message || 'New OTP sent to email.' };
      } else {
        const res = await api.post('/auth/update-email/send-otp', {
          newEmail: otpTargetEmail.trim(),
        });
        return { success: true, message: res.data?.message || 'New OTP sent to new email.' };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP.';
      return { success: false, message: msg };
    }
  };

  return (
    <div style={{ marginTop: '1.75rem' }}>
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color={themeColor} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Account Security & Credentials
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            OTP Protected
          </span>
        </div>

        <div className="card-body">
          {globalSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
              <span>{globalSuccess}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Update Password Action Card */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <KeyRound size={18} color={themeColor} />
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>Account Password</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Update your login password. Requires 30-second OTP email verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setShowPasswordModal(true);
                }}
                className="btn btn-outline"
                style={{
                  marginTop: '0.85rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  width: '100%',
                }}
              >
                Change Password
              </button>
            </div>

            {/* Update Email Action Card */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <Mail size={18} color={themeColor} />
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>Email Address</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Current: <strong style={{ color: '#334155' }}>{currentEmail}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmailError(null);
                  setNewEmail('');
                  setShowEmailModal(true);
                }}
                className="btn btn-outline"
                style={{
                  marginTop: '0.85rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  width: '100%',
                }}
              >
                Update Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Account Password"
        maxWidth="460px"
      >
        <form onSubmit={handleInitiatePasswordChange}>
          {passwordError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.375rem',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Current Password</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="password-toggle-btn"
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="password-toggle-btn"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="password-toggle-btn"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSendingPasswordOtp}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
          >
            {isSendingPasswordOtp ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Sending Verification OTP...
              </>
            ) : (
              'Send OTP & Continue'
            )}
          </button>
        </form>
      </Modal>

      {/* Update Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Update Registered Email"
        maxWidth="460px"
      >
        <form onSubmit={handleInitiateEmailChange}>
          {emailError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.375rem',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{emailError}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Current Email</label>
            <input
              type="text"
              readOnly
              value={currentEmail}
              className="form-input"
              style={{ backgroundColor: '#f1f5f9' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
              className="form-input"
              autoFocus
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
              We will send a 30-second verification code to the <strong>new</strong> email address.
            </div>
          </div>

          <button
            type="submit"
            disabled={isSendingEmailOtp}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
          >
            {isSendingEmailOtp ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Sending OTP to New Email...
              </>
            ) : (
              'Send OTP & Verify'
            )}
          </button>
        </form>
      </Modal>

      {/* Shared OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={otpTargetEmail}
        purposeTitle={otpPurpose === 'PASSWORD' ? 'Password Update Verification' : 'Email Change Verification'}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
      />
    </div>
  );
};
export default AccountSecuritySection;
