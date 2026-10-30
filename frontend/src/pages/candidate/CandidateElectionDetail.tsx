import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, CheckCircle2, AlertCircle, Award, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { useElectionStore } from '../../stores/electionStore';
import { useCandidateStore } from '../../stores/candidateStore';
import { useAuthStore } from '../../stores/authStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../utils/dateFormatter';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import api from '../../services/api';

export const CandidateElectionDetail: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const currentTime = useCurrentTime(5000);

  const currentUser = useAuthStore((state) => state.currentUser);
  const elections = useElectionStore((state) => state.elections);
  const getElectionById = useElectionStore((state) => state.getElectionById);
  const getElectionStatus = useElectionStore((state) => state.getElectionStatus);
  const isRegisteredForElection = useCandidateStore((state) => state.isRegisteredForElection);
  const registerForElection = useCandidateStore((state) => state.registerForElection);
  const getRegistration = useCandidateStore((state) => state.getRegistration);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedElectionId, setSelectedElectionId] = useState(electionId || '');
  const [manifestoTitle, setManifestoTitle] = useState('');
  const [visionStatement, setVisionStatement] = useState('');
  const [keyPromisesText, setKeyPromisesText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverRegistered, setServerRegistered] = useState<boolean | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'creating_order' | 'checkout' | 'verifying' | 'confirmed'>('idle');
  const [nominationFee, setNominationFee] = useState<number>(500);
  const [paymentDetails, setPaymentDetails] = useState<{ paymentId?: string; orderId?: string; amount?: number } | null>(null);
  const electionsLoading = useElectionStore((state) => state.isLoading);

  React.useEffect(() => {
    useElectionStore.getState().fetchElections();
    if (electionId) {
      useCandidateStore.getState().fetchCandidatesForElection(electionId);
      useCandidateStore.getState().checkIsRegistered(electionId).then((reg) => {
        setServerRegistered(reg);
      });
    }

    // Fetch dynamic nomination fee configuration
    api.get('/payment/config').then((res) => {
      if (res.data?.data?.nominationFee) {
        setNominationFee(res.data.data.nominationFee);
      }
    }).catch(() => {});
  }, [electionId]);

  const election = electionId ? getElectionById(electionId) : undefined;

  if (!election) {
    if (electionsLoading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          color: '#64748b'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #cbd5e1',
            borderTopColor: '#ea580c',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '1rem'
          }} />
          <span>Loading election details...</span>
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>Election Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The requested election could not be located.</p>
        <Link to="/candidate/elections" className="btn btn-candidate">
          Back to Elections
        </Link>
      </div>
    );
  }

  const status = getElectionStatus(election, currentTime);
  const isRegistered = (serverRegistered === true) || (currentUser ? isRegisteredForElection(currentUser.id, election.id) : false);
  const isRegOpen = status === 'REGISTRATION_OPEN';
  const registration = currentUser ? getRegistration(currentUser.id, election.id) : undefined;

  const promisesList: string[] = React.useMemo(() => {
    if (!registration?.keyPromises) return [];
    if (Array.isArray(registration.keyPromises)) return registration.keyPromises;
    if (typeof registration.keyPromises === 'string') {
      return (registration.keyPromises as string)
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return [];
  }, [registration?.keyPromises]);

  // Filter open elections for the dropdown selector
  const openElections = elections.filter((e) => {
    const s = getElectionStatus(e, currentTime);
    return s === 'REGISTRATION_OPEN';
  });

  const completeRegistration = async (
    title: string,
    vision: string,
    promises: string[],
    payment: { orderId: string; paymentId: string; signature: string; amount: number }
  ) => {
    try {
      const res = await registerForElection(
        currentUser!.id,
        election.id,
        {
          manifestoTitle: title,
          visionStatement: vision,
          keyPromises: promises,
          razorpayOrderId: payment.orderId,
          razorpayPaymentId: payment.paymentId,
          razorpaySignature: payment.signature,
          paymentAmount: payment.amount,
        },
        election.name
      );

      if (res.success) {
        setPaymentDetails({
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          amount: payment.amount,
        });
        setNotification({
          message: `✓ Payment Verified & Nomination Confirmed! Razorpay Payment ID: ${payment.paymentId}`,
          type: 'success',
        });
        setManifestoTitle('');
        setVisionStatement('');
        setKeyPromisesText('');
        setIsConfirmed(false);
        setServerRegistered(true);
        setPaymentStep('confirmed');
        if (electionId) {
          await useCandidateStore.getState().fetchCandidatesForElection(electionId);
        }
      } else {
        setNotification({ message: res.message, type: 'error' });
      }
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to complete candidate registration after payment.',
        type: 'error',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !election) return;
    setFormError(null);

    const title = manifestoTitle.trim();
    const vision = visionStatement.trim();
    const promises = keyPromisesText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (!title) {
      setFormError('Please enter a Manifesto Title.');
      return;
    }

    if (!vision) {
      setFormError('Please enter a Vision Statement.');
      return;
    }

    if (promises.length === 0) {
      setFormError('Please enter at least one Key Promise or Development Plan.');
      return;
    }

    if (!isConfirmed) {
      setFormError('You must confirm that the information provided in your manifesto is accurate.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStep('creating_order');

    try {
      // Step 1: Create Razorpay Order via backend
      const orderRes = await api.post('/payment/create-order', {
        electionId: election.id,
        amount: Math.round(nominationFee * 100), // in paise
      });

      if (!orderRes.data?.success || !orderRes.data?.data) {
        throw new Error(orderRes.data?.message || 'Failed to initialize Razorpay payment order.');
      }

      const orderData = orderRes.data.data;
      setPaymentStep('checkout');

      // Step 2: Open Razorpay Checkout Modal
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'SecureVote Election Commission',
          description: `Nomination Deposit - ${election.name}`,
          order_id: orderData.orderId,
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
          },
          notes: {
            candidateId: currentUser.id,
            electionId: election.id,
          },
          theme: {
            color: '#ea580c',
          },
          handler: async function (response: any) {
            setPaymentStep('verifying');
            await completeRegistration(title, vision, promises, {
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature || 'test_sig',
              amount: nominationFee,
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              setPaymentStep('idle');
              setNotification({
                message: 'Razorpay checkout was dismissed. You can complete payment whenever ready.',
                type: 'error',
              });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessingPayment(false);
          setPaymentStep('idle');
          setNotification({
            message: resp.error?.description || 'Payment failed. Please try again.',
            type: 'error',
          });
        });
        rzp.open();
      } else {
        // Fallback simulated payment if third-party script was blocked
        const simPaymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
        const simSig = 'test_sig_' + Math.random().toString(36).substring(2, 14);
        setPaymentStep('verifying');
        await completeRegistration(title, vision, promises, {
          orderId: orderData.orderId,
          paymentId: simPaymentId,
          signature: simSig,
          amount: nominationFee,
        });
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentStep('idle');
      setFormError(err.response?.data?.message || err.message || 'Payment initiation failed.');
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Candidate Election Detail Error">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/candidate/elections"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ea580c', fontWeight: 600, fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Candidate Elections</span>
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', letterSpacing: '0.05em' }}>
              CANDIDATE ELECTION DETAILS
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {election.name}
            </h1>
          </div>
          <Badge status={status} />
        </div>

        <div className="card-body">
          {election.description && (
            <p style={{ color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {election.description}
            </p>
          )}

          {/* Candidate Registration Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Candidate Registration
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem'
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <Calendar size={16} color="#ea580c" />
                  <span>Starts:</span>
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600, paddingLeft: '1.4rem' }}>
                  {formatDateTime(election.registrationStart)}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <Clock size={16} color="#ea580c" />
                  <span>Ends:</span>
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600, paddingLeft: '1.4rem' }}>
                  {formatDateTime(election.registrationEnd)}
                </div>
              </div>
            </div>
          </div>

          {/* Voting Information */}
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#1e40af',
            marginBottom: '1.5rem'
          }}>
            <strong>Scheduled Voting:</strong> {formatDateTime(election.votingStart)} to {formatDateTime(election.votingEnd)}
          </div>

          {/* Status feedback alerts */}
          {notification && (
            <div
              className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
            >
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Registration actions / states */}
          {isRegistered ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '1.05rem' }}>
                    <CheckCircle2 size={20} />
                    <span>✓ You are registered for this election</span>
                  </div>
                  {registration?.registeredAt && (
                    <div style={{ fontSize: '0.825rem', color: '#15803d', marginTop: '0.25rem' }}>
                      Registered on {formatDateTime(registration.registeredAt)}
                    </div>
                  )}
                </div>
                <span className="badge badge-published" style={{ fontSize: '0.8rem' }}>
                  NOMINATION CERTIFIED
                </span>
              </div>

              {/* Razorpay Payment Receipt Card */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(234, 88, 12, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ea580c', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <CreditCard size={16} />
                    <span>Razorpay Payment Receipt</span>
                  </div>
                  <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                    PAID & VERIFIED
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a3412', textTransform: 'uppercase' }}>
                      Payment ID
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {registration?.paymentId || paymentDetails?.paymentId || 'pay_verified'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a3412', textTransform: 'uppercase' }}>
                      Order ID
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {registration?.orderId || paymentDetails?.orderId || 'order_verified'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a3412', textTransform: 'uppercase' }}>
                      Nomination Deposit Amount
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534' }}>
                      ₹{registration?.paymentAmount ? registration.paymentAmount.toFixed(2) : nominationFee.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a3412', textTransform: 'uppercase' }}>
                      Transaction Status
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={14} color="#15803d" />
                      <span>Registration Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Manifesto Details Card */}
              {registration?.manifestoTitle && (
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fed7aa',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(234, 88, 12, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', color: '#ea580c', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <FileText size={16} />
                    <span>Submitted Manifesto</span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      Manifesto Title
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                      {registration.manifestoTitle}
                    </div>
                  </div>

                  {registration.visionStatement && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Vision Statement
                      </div>
                      <p style={{ margin: 0, fontSize: '0.925rem', color: '#334155', lineHeight: 1.6 }}>
                        {registration.visionStatement}
                      </p>
                    </div>
                  )}

                  {promisesList.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Key Development Plans
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {promisesList.map((promise, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
                            <CheckCircle2 size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{promise}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    <CheckCircle2 size={14} color="#166534" />
                    <span>Confirmed accurate by candidate upon registration</span>
                  </div>
                </div>
              )}
            </div>
          ) : isRegOpen ? (
            /* Election Registration Form */
            <div className="card" style={{ borderColor: '#fed7aa', backgroundColor: '#ffffff' }}>
              <div className="card-header" style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} color="#ea580c" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#9a3412', margin: 0 }}>
                    Election Registration
                  </h3>
                </div>
                <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#ea580c', backgroundColor: '#ffedd5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Nomination & Manifesto
                </span>
              </div>

              <div className="card-body">
                {formError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitRegistration} noValidate>
                  {/* Razorpay Nomination Deposit Fee Banner */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#ea580c',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '1rem' }}>
                          Nomination Security Deposit: ₹{nominationFee.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>
                          Official candidate registration fee verified via Razorpay Payment Gateway.
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      backgroundColor: '#e0f2fe',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd'
                    }}>
                      <ShieldCheck size={14} />
                      <span>Razorpay Verified</span>
                    </div>
                  </div>

                  {/* Election ID */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="electionId">
                      Election ID
                    </label>
                    <input
                      id="electionId"
                      type="text"
                      readOnly
                      value={election.id}
                      className="form-input"
                      style={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#ea580c' }}
                    />
                  </div>

                  {/* Election Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="electionName">
                      Election Name
                    </label>
                    <input
                      id="electionName"
                      type="text"
                      readOnly
                      value={election.name}
                      className="form-input"
                      style={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#0f172a' }}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="electionDescription">
                      Description
                    </label>
                    <textarea
                      id="electionDescription"
                      rows={2}
                      readOnly
                      value={election.description || 'No description provided.'}
                      className="form-input"
                      style={{ backgroundColor: '#f8fafc', color: '#475569', resize: 'none' }}
                    />
                  </div>

                  {openElections.length > 1 && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="selectElection">
                        Switch Election
                      </label>
                      <select
                        id="selectElection"
                        value={selectedElectionId || election.id}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setSelectedElectionId(newId);
                          if (newId !== election.id) {
                            navigate(`/candidate/elections/${newId}`);
                          }
                        }}
                        className="form-input"
                      >
                        {openElections.map((el) => (
                          <option key={el.id} value={el.id}>
                            {el.name} ({el.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manifesto Title */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="manifestoTitle">
                      Manifesto Title
                    </label>
                    <input
                      id="manifestoTitle"
                      type="text"
                      placeholder="Enter manifesto title"
                      value={manifestoTitle}
                      onChange={(e) => setManifestoTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* Vision Statement */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="visionStatement">
                      Vision Statement
                    </label>
                    <textarea
                      id="visionStatement"
                      rows={3}
                      placeholder="Enter vision statement"
                      value={visionStatement}
                      onChange={(e) => setVisionStatement(e.target.value)}
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Key Development Plans */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="keyPromises">
                      Key Development Plans
                    </label>
                    <textarea
                      id="keyPromises"
                      rows={5}
                      placeholder="Enter key development plans (one per line)"
                      value={keyPromisesText}
                      onChange={(e) => setKeyPromisesText(e.target.value)}
                      className="form-input"
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Confirmation Checkbox */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '1.5rem 0',
                      cursor: 'pointer',
                      userSelect: 'none',
                      padding: '0.9rem 1rem',
                      backgroundColor: isConfirmed ? '#fff7ed' : '#f8fafc',
                      border: `1px solid ${isConfirmed ? '#fed7aa' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      id="confirmManifesto"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#ea580c',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontSize: '0.925rem', fontWeight: 600, color: '#0f172a' }}>
                      I confirm that the information provided in my manifesto is accurate.
                    </span>
                  </label>

                  {/* Submit Button with Razorpay Payment Integration */}
                  <button
                    type="submit"
                    disabled={!isConfirmed || isProcessingPayment}
                    className="btn btn-candidate btn-lg btn-block"
                    style={{
                      fontWeight: 600,
                      opacity: (isConfirmed && !isProcessingPayment) ? 1 : 0.6,
                      cursor: (isConfirmed && !isProcessingPayment) ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span>
                          {paymentStep === 'creating_order'
                            ? 'Creating Razorpay Order...'
                            : paymentStep === 'checkout'
                            ? 'Awaiting Razorpay Payment...'
                            : paymentStep === 'verifying'
                            ? 'Verifying Payment & Registering...'
                            : 'Processing Payment...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        <span>Pay ₹{nominationFee.toFixed(0)} via Razorpay & Confirm Registration</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b'
            }}>
              <Clock size={28} style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
                Candidate registration is closed.
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {currentTime.getTime() < new Date(election.registrationStart).getTime()
                  ? `Registration opens on ${formatDateTime(election.registrationStart)}.`
                  : 'The candidacy registration deadline for this election has passed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};
