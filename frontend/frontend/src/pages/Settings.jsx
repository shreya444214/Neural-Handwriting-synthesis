import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Lock, Mail, Phone, Bell, Palette, Trash2,
  Eye, EyeOff, Shield, Save
} from 'lucide-react';

export default function Settings() {
  const { user, api, addToast, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    theme: user?.theme || 'dark',
    notifications_enabled: user?.notifications_enabled ?? true,
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password change
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleSettingsUpdate = async () => {
    try {
      setLoading(true);
      const res = await api.put('/settings', settings);
      addToast('Settings updated! ✅', 'success');
      updateUser({ ...user, ...settings });
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new) {
      addToast('Fill in all password fields', 'warning');
      return;
    }
    if (passwords.new.length < 6) {
      addToast('New password must be at least 6 characters', 'warning');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      addToast('New passwords do not match', 'warning');
      return;
    }
    try {
      setLoading(true);
      await api.post('/profile/change-password', {
        current_password: passwords.current,
        new_password: passwords.new,
      });
      addToast('Password changed successfully! 🔒', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      addToast('Enter your password to confirm', 'warning');
      return;
    }
    if (!window.confirm('This action is irreversible. Are you sure you want to delete your account?')) return;
    try {
      await api.delete('/settings/delete-account', { data: { password: deletePassword } });
      addToast('Account deleted', 'info');
      logout();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete account', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.main}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your account preferences and security</p>

          {/* Account Settings */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><Mail size={18} /> Account Information</h3>
            <div style={styles.grid}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <button onClick={handleSettingsUpdate} className="btn btn-primary" disabled={loading}
              style={{ marginTop: '8px' }}>
              <Save size={16} /> Save Changes
            </button>
          </div>

          {/* Preferences */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><Palette size={18} /> Preferences</h3>
            <div style={styles.toggleRow}>
              <div>
                <p style={styles.toggleLabel}>Theme</p>
                <p style={styles.toggleDesc}>Choose your preferred appearance</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['dark', 'light'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={`btn btn-sm ${settings.theme === t ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.toggleRow}>
              <div>
                <p style={styles.toggleLabel}><Bell size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Notifications</p>
                <p style={styles.toggleDesc}>Receive email notifications about activity</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                style={{
                  ...styles.switch,
                  background: settings.notifications_enabled ? 'var(--accent-green)' : 'var(--bg-input)',
                }}
              >
                <div style={{
                  ...styles.switchDot,
                  transform: settings.notifications_enabled ? 'translateX(20px)' : 'translateX(2px)',
                }} />
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><Lock size={18} /> Change Password</h3>
            <div style={styles.grid}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="input-field"
                  placeholder="Enter current password"
                />
              </div>
              <div />
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="input-field"
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="input-field"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
              <button onClick={() => setShowPasswords(!showPasswords)} className="btn btn-ghost btn-sm">
                {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPasswords ? ' Hide' : ' Show'}
              </button>
              <button onClick={handlePasswordChange} className="btn btn-primary" disabled={loading}>
                <Shield size={16} /> Update Password
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ ...styles.section, borderColor: 'rgba(248,113,113,0.2)' }}>
            <h3 style={{ ...styles.sectionTitle, color: 'var(--accent-red)' }}>
              <Trash2 size={18} /> Danger Zone
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Once you delete your account, there is no going back. All your files and data will be permanently removed.
            </p>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="btn btn-danger">
                Delete My Account
              </button>
            ) : (
              <div>
                <div className="input-group">
                  <label className="input-label">Enter your password to confirm</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input-field"
                    placeholder="Password"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button onClick={() => setShowDelete(false)} className="btn btn-ghost">Cancel</button>
                  <button onClick={handleDeleteAccount} className="btn btn-danger">
                    <Trash2 size={14} /> Permanently Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: 'calc(100vh - var(--nav-height))' },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '800px' },
  title: { fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px' },
  subtitle: { color: 'var(--text-secondary)', margin: '0 0 28px', fontSize: '0.9rem' },
  section: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '1.05rem', fontWeight: 700, margin: '0 0 20px',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0',
  },
  toggleLabel: { margin: '0 0 2px', fontWeight: 600, fontSize: '0.92rem' },
  toggleDesc: { margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' },
  divider: { height: '1px', background: 'var(--border-subtle)', margin: '16px 0' },
  switch: {
    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
    padding: 0,
  },
  switchDot: {
    width: '20px', height: '20px', borderRadius: '50%', background: 'white',
    position: 'absolute', top: '2px', transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
};
