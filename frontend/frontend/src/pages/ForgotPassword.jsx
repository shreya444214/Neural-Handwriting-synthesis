import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle, Send } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword, addToast } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newPassword
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  const handleSendOtp = async () => {
    if (!email) {
      addToast('Please enter your email', 'warning');
      return;
    }
    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setDebugOtp(res.otp_debug || '');
      addToast(`OTP sent to ${email}. Debug OTP: ${res.otp_debug}`, 'success');
      setStep(2);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!otp) {
      addToast('Please enter the OTP', 'warning');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'warning');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email, otp, newPassword);
      addToast('Password reset successfully! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Progress */}
          <div style={styles.progress}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                ...styles.dot,
                background: s <= step ? 'var(--accent-gold)' : 'var(--bg-input)',
              }} />
            ))}
          </div>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <>
              <div style={styles.header}>
                <KeyRound size={40} style={{ color: 'var(--accent-gold)', marginBottom: '16px' }} />
                <h2 style={styles.title}>Forgot Password?</h2>
                <p style={styles.subtitle}>Enter your registered email to receive a reset code</p>
              </div>
              <div style={styles.form}>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.icon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <button onClick={handleSendOtp} className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Code'} {!loading && <Send size={16} />}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <>
              <div style={styles.header}>
                <Mail size={40} style={{ color: 'var(--accent-blue)', marginBottom: '16px' }} />
                <h2 style={styles.title}>Check Your Email</h2>
                <p style={styles.subtitle}>Enter the 6-digit code sent to <strong>{email}</strong></p>
              </div>
              <div style={styles.form}>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="input-field"
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '8px', fontWeight: 700 }}
                />
                {debugOtp && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Debug OTP: <strong style={{ color: 'var(--accent-gold)' }}>{debugOtp}</strong>
                  </p>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handleVerifyAndReset} className="btn btn-primary" style={{ flex: 2 }}>
                    Verify Code <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div style={styles.header}>
                <Lock size={40} style={{ color: 'var(--accent-green)', marginBottom: '16px' }} />
                <h2 style={styles.title}>Set New Password</h2>
                <p style={styles.subtitle}>Create a strong password for your account</p>
              </div>
              <div style={styles.form}>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.icon} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.icon} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <button onClick={handleResetPassword} className="btn btn-primary btn-full btn-lg"
                  disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'} {!loading && <CheckCircle size={18} />}
                </button>
              </div>
            </>
          )}

          <p style={styles.backLink}>
            Remember your password? <Link to="/login" style={styles.link}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: 'calc(100vh - var(--nav-height))', padding: '40px 20px',
  },
  card: {
    width: '100%', maxWidth: '440px', padding: '40px',
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
    animation: 'fadeIn 0.4s ease',
  },
  progress: { display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' },
  dot: { width: '40px', height: '4px', borderRadius: '2px', transition: 'all 0.3s' },
  header: { textAlign: 'center', marginBottom: '28px' },
  title: { fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' },
  backLink: {
    textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.88rem',
  },
  link: { color: 'var(--accent-gold)', fontWeight: 700 },
};
