import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, addToast } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.error || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>Welcome Back 👋</h2>
            <p style={styles.subtitle}>Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.icon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot Password?</Link>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.icon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  style={styles.input}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
              style={{ marginTop: '8px' }}>
              {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={18} />}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerText}>OR</span>
            </div>

            {/* Google Login (UI only) */}
            <button type="button" className="btn btn-secondary btn-full" style={styles.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
          </form>

          {/* Register link */}
          <p style={styles.registerLink}>
            Don't have an account? <Link to="/register" style={styles.link}>Create Account</Link>
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
  header: { textAlign: 'center', marginBottom: '32px' },
  title: { fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontSize: '0.8rem', color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 600 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' },
  input: { paddingLeft: '40px' },
  eyeBtn: {
    position: 'absolute', right: '12px', background: 'none',
    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
  },
  divider: {
    position: 'relative', textAlign: 'center',
    borderTop: '1px solid var(--border-subtle)', marginTop: '8px',
  },
  dividerText: {
    position: 'relative', top: '-10px', padding: '0 16px',
    background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.78rem',
  },
  googleBtn: { gap: '10px' },
  registerLink: {
    textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.88rem',
  },
  link: { color: 'var(--accent-gold)', fontWeight: 700 },
};