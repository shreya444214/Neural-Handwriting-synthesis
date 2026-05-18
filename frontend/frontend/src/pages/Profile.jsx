import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Camera, Mail, Phone, Calendar, Briefcase, AtSign,
  Edit2, Save, X, FolderOpen, Clock
} from 'lucide-react';

export default function Profile() {
  const { user, api, addToast, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_files: 0, account_age_days: 0 });
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    profession: user?.profession || '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setStats(res.data.stats);
      const u = res.data.user;
      setForm({
        name: u.name || '',
        phone: u.phone || '',
        dob: u.dob || '',
        gender: u.gender || '',
        profession: u.profession || '',
      });
    } catch {}
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await api.put('/profile', form);
      updateUser(res.data.user);
      setEditing(false);
      addToast('Profile updated successfully! ✅', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, profile_photo: res.data.photo });
      addToast('Profile photo updated! 📸', 'success');
    } catch {
      addToast('Failed to upload photo', 'error');
    }
  };

  const infoItems = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: form.phone || 'Not set', editable: true, field: 'phone', type: 'tel' },
    { icon: Calendar, label: 'Date of Birth', value: form.dob || 'Not set', editable: true, field: 'dob', type: 'date' },
    { icon: AtSign, label: 'Username', value: user?.username },
    { icon: Briefcase, label: 'Profession', value: form.profession || 'Not set', editable: true, field: 'profession' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.main}>
          {/* Profile Header Card */}
          <div style={styles.headerCard}>
            {/* Cover gradient */}
            <div style={styles.cover} />

            <div style={styles.profileInfo}>
              {/* Avatar */}
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>
                  {user?.profile_photo ? (
                    <img
                      src={`http://127.0.0.1:5000/api/profile/photo/${user.profile_photo}`}
                      alt="Profile"
                      style={styles.avatarImg}
                    />
                  ) : (
                    <span style={styles.avatarLetter}>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <label style={styles.cameraBtn}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload}
                    style={{ display: 'none' }} />
                </label>
              </div>

              {/* Name & Info */}
              <div style={styles.nameSection}>
                {editing ? (
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '1.2rem', fontWeight: 700, maxWidth: '300px' }}
                  />
                ) : (
                  <h2 style={styles.name}>{user?.name}</h2>
                )}
                <p style={styles.email}>@{user?.username} · {user?.email}</p>
                {editing ? (
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="input-field"
                    style={{ maxWidth: '150px', marginTop: '6px' }}
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  form.gender && <span className="badge badge-info" style={{ marginTop: '6px' }}>{form.gender}</span>
                )}
              </div>

              {/* Edit / Save Buttons */}
              <div style={styles.editBtns}>
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                      <X size={14} /> Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={loading}>
                      <Save size={14} /> {loading ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                    <Edit2 size={14} /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div style={styles.statCard}>
              <FolderOpen size={22} style={{ color: 'var(--accent-blue)' }} />
              <div>
                <p style={styles.statValue}>{stats.total_files}</p>
                <p style={styles.statLabel}>Total Files</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <Clock size={22} style={{ color: 'var(--accent-green)' }} />
              <div>
                <p style={styles.statValue}>{stats.account_age_days}</p>
                <p style={styles.statLabel}>Days Active</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <Calendar size={22} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <p style={styles.statValue}>
                  {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Today'}
                </p>
                <p style={styles.statLabel}>Last Login</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={styles.infoSection}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <div style={styles.infoGrid}>
              {infoItems.map(({ icon: Icon, label, value, editable, field, type }) => (
                <div key={label} style={styles.infoItem}>
                  <Icon size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={styles.infoLabel}>{label}</p>
                    {editing && editable ? (
                      <input
                        type={type || 'text'}
                        value={form[field] || ''}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="input-field"
                        style={{ marginTop: '4px' }}
                      />
                    ) : (
                      <p style={styles.infoValue}>{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div style={styles.infoSection}>
            <h3 style={styles.sectionTitle}>Account Details</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p style={styles.infoLabel}>Member Since</p>
                  <p style={styles.infoValue}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    }) : '—'}
                  </p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <Mail size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p style={styles.infoLabel}>Email Verification</p>
                  <span className="badge badge-success">Verified ✅</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: 'calc(100vh - var(--nav-height))' },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '860px' },
  headerCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '24px',
  },
  cover: {
    height: '120px',
    background: 'linear-gradient(135deg, rgba(99,140,255,0.3) 0%, rgba(255,215,0,0.15) 100%)',
  },
  profileInfo: {
    padding: '0 28px 24px',
    display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap',
    marginTop: '-50px',
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: '100px', height: '100px', borderRadius: '50%',
    background: 'var(--gradient-blue)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    border: '4px solid var(--bg-card)', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetter: { fontSize: '2.2rem', fontWeight: 800, color: 'white' },
  cameraBtn: {
    position: 'absolute', bottom: '4px', right: '4px',
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--accent-gold)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#0a0a0a', border: '2px solid var(--bg-card)',
  },
  nameSection: { flex: 1 },
  name: { margin: 0, fontSize: '1.4rem', fontWeight: 800 },
  email: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' },
  editBtns: { display: 'flex', gap: '8px' },
  statCard: {
    padding: '18px', background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', gap: '14px',
  },
  statValue: { fontSize: '1.3rem', fontWeight: 800, margin: '0 0 2px' },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 },
  infoSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },
  sectionTitle: { fontSize: '1.05rem', fontWeight: 700, margin: '0 0 20px' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '18px' },
  infoItem: { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  infoLabel: { margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' },
  infoValue: { margin: '2px 0 0', fontWeight: 500, fontSize: '0.95rem' },
};