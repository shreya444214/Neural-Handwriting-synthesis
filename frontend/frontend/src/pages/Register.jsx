import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  User, Mail, Phone, Lock, Calendar, Briefcase, AtSign,
  Eye, EyeOff, ArrowRight
} from 'lucide-react';

export default function Register() {
  const { register, addToast } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', dob: '',
    gender: '', profession: '', password: '', confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email) {
      addToast('Name, username, and email are required', 'warning');
      return;
    }
    if (!form.password || form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'warning');
      return;
    }
    try {
      setLoading(true);
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error 
        || err.response?.data?.message 
        || (err.request ? 'Cannot connect to server. Is the backend running?' : 'Registration failed');
      addToast(msg, 'error');
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
            <h2 style={styles.title}>Create Account ✨</h2>
            <p style={styles.subtitle}>Join us and start transforming your handwriting</p>
          </div>

          <form onSubmit={handleRegister} style={styles.form}>
            {/* Name & Username row */}
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWrapper}>
                  <User size={16} style={styles.icon} />
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="John Doe" className="input-field" style={styles.input} />
                </div>
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Username *</label>
                <div style={styles.inputWrapper}>
                  <AtSign size={16} style={styles.icon} />
                  <input name="username" value={form.username} onChange={handleChange}
                    placeholder="johndoe" className="input-field" style={styles.input} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address *</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.icon} />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" className="input-field" style={styles.input} />
              </div>
            </div>

            {/* Phone & DOB row */}
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWrapper}>
                  <Phone size={16} style={styles.icon} />
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+91 9876543210" className="input-field" style={styles.input} />
                </div>
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Date of Birth</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={16} style={styles.icon} />
                  <input name="dob" type="date" value={form.dob} onChange={handleChange}
                    className="input-field" style={styles.input} />
                </div>
              </div>
            </div>

            {/* Gender & Profession row */}
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="input-field" style={{ ...styles.input, cursor: 'pointer' }}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Profession</label>
                <div style={styles.inputWrapper}>
                  <Briefcase size={16} style={styles.icon} />
                  <input name="profession" value={form.profession} onChange={handleChange}
                    placeholder="Student, Developer..." className="input-field" style={styles.input} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerText}>SECURITY</span>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password *</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.icon} />
                <input name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" className="input-field" style={styles.input} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div style={styles.strength}>
                  <div style={{
                    ...styles.strengthBar,
                    width: form.password.length >= 10 ? '100%' : form.password.length >= 6 ? '60%' : '30%',
                    background: form.password.length >= 10 ? 'var(--accent-green)' : form.password.length >= 6 ? 'var(--accent-gold)' : 'var(--accent-red)',
                  }} />
                  <span style={styles.strengthText}>
                    {form.password.length >= 10 ? 'Strong' : form.password.length >= 6 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password *</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.icon} />
                <input name="confirmPassword" type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter password" className="input-field" style={styles.input} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
              style={{ marginTop: '4px' }}>
              {loading ? 'Creating Account...' : 'Create Account'} {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Login link */}
          <p style={styles.loginLink}>
            Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
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
    width: '100%', maxWidth: '540px', padding: '40px',
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
    animation: 'fadeIn 0.4s ease',
  },
  header: { textAlign: 'center', marginBottom: '28px' },
  title: { fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'flex', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' },
  input: { paddingLeft: '40px' },
  eyeBtn: {
    position: 'absolute', right: '12px', background: 'none',
    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
  },
  divider: {
    position: 'relative', textAlign: 'center',
    borderTop: '1px solid var(--border-subtle)', margin: '4px 0',
  },
  dividerText: {
    position: 'relative', top: '-10px', padding: '0 16px',
    background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.72rem',
    letterSpacing: '0.08em', fontWeight: 600,
  },
  strength: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' },
  strengthBar: {
    height: '3px', borderRadius: '2px', transition: 'all 0.3s', flex: 1,
  },
  strengthText: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  loginLink: {
    textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)',
    fontSize: '0.88rem',
  },
  link: { color: 'var(--accent-gold)', fontWeight: 700 },
};