import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, Clock, CheckCircle2, KeyRound } from 'lucide-react';
import { Modal } from './Modal';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purposeTitle: string;
  onVerify: (otp: string) => Promise<{ success: boolean; message?: string }>;
  onResend: () => Promise<{ success: boolean; message?: string }>;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  email,
  purposeTitle,
  onVerify,
  onResend,
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setCountdown(30);
      setResendCooldown(30);
      setError(null);
      setSuccessMsg(null);
      setIsVerifying(false);
      setIsResending(false);
    }
  }, [isOpen]);

  // 1-second countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = countdown === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired || otp.trim().length !== 6 || isVerifying) return;

    setError(null);
    setSuccessMsg(null);
    setIsVerifying(true);

    try {
      const result = await onVerify(otp.trim());
      if (result.success) {
        setSuccessMsg(result.message || 'Verification successful!');
      } else {
        setError(result.message || 'Invalid verification code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setSuccessMsg(null);
    setIsResending(true);

    try {
      const result = await onResend();
      if (result.success) {
        setSuccessMsg(result.message || 'New OTP sent to your email.');
        setCountdown(30);
        setResendCooldown(30);
        setOtp('');
      } else {
        setError(result.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Verification" maxWidth="460px">
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '2px solid #bfdbfe',
          }}
        >
          <KeyRound size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          {purposeTitle}
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          We sent a 6-character verification code to:
          <br />
          <strong style={{ color: '#1e293b', fontWeight: 600 }}>{email}</strong>
        </p>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              textAlign: 'left',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Enter 6-Character OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              placeholder="e.g. Bv3Ch8"
              maxLength={6}
              disabled={isExpired || isVerifying}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '0.35em',
                textAlign: 'center',
                fontFamily: 'monospace',
                borderRadius: '0.5rem',
                border: isExpired ? '2px solid #ef4444' : '2px solid #cbd5e1',
                backgroundColor: isExpired ? '#fef2f2' : '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Pattern: Uppercase + Lowercase + Number (e.g. <code>Bv3Ch8</code>)
            </div>
          </div>

          {/* Countdown & Expiry Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              marginBottom: '1.25rem',
              borderRadius: '0.375rem',
              background: isExpired ? '#fee2e2' : '#f1f5f9',
              color: isExpired ? '#b91c1c' : '#334155',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Clock size={16} />
            {isExpired ? (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>OTP Expired</span>
            ) : (
              <span>Valid for: {formatTime(countdown)}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={isExpired || otp.trim().length !== 6 || isVerifying}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                opacity: isExpired || otp.trim().length !== 6 || isVerifying ? 0.6 : 1,
                cursor: isExpired || otp.trim().length !== 6 || isVerifying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Verifying OTP...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Verify & Complete
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: resendCooldown > 0 || isResending ? 0.6 : 1,
                cursor: resendCooldown > 0 || isResending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <RefreshCw size={15} className={isResending ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend OTP in (${formatTime(resendCooldown)})` : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
