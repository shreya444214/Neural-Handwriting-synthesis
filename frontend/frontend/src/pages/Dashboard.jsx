import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Upload, CheckCircle, Clock, FileText, Trash2,
  Download, Eye, TrendingUp, FolderOpen, Activity, PenTool, Image
} from 'lucide-react';

export default function Dashboard() {
  const { user, api, addToast } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
      setRecentFiles(res.data.recent_files);
      setRecentActivity(res.data.recent_activity);
    } catch (err) {
      addToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      addToast('File deleted', 'success');
      fetchDashboard();
    } catch (err) {
      addToast('Failed to delete file', 'error');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      link.click();
      window.URL.revokeObjectURL(url);
      addToast('File downloaded! 📥', 'success');
    } catch {
      addToast('Download failed', 'error');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const statusBadge = (status) => {
    const map = {
      uploaded: 'badge-info',
      processing: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-danger',
    };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const statCards = [
    { label: 'Total Files', value: stats?.total_files || 0, icon: FolderOpen, color: '#638cff' },
    { label: 'Uploaded', value: stats?.uploaded || 0, icon: Upload, color: '#fbbf24' },
    { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle, color: '#34d399' },
    { label: 'Processing', value: stats?.processing || 0, icon: Clock, color: '#a78bfa' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <main style={styles.main}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Dashboard</h1>
              <p style={styles.subtitle}>Welcome back, {user?.name}! Here's your workspace overview.</p>
            </div>
            <Link to="/transform" className="btn btn-primary">
              <PenTool size={16} /> New Transformation
            </Link>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            {statCards.map((s, i) => (
              <div key={i} style={styles.statCard}>
                <div style={{ ...styles.statIcon, background: `${s.color}15` }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div>
                  <p style={styles.statValue}>{s.value}</p>
                  <p style={styles.statLabel}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Files */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FileText size={18} /> Recent Files
              </h3>
              <Link to="/transform" style={styles.viewAll}>Upload New →</Link>
            </div>

            {recentFiles.length === 0 ? (
              <div style={styles.empty}>
                <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ fontWeight: 600 }}>No files yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Upload your first file to get started
                </p>
                <Link to="/transform" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  <Upload size={16} /> Upload File
                </Link>
              </div>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span style={{ flex: 2 }}>File Name</span>
                  <span style={{ flex: 1 }}>Type</span>
                  <span style={{ flex: 1 }}>Size</span>
                  <span style={{ flex: 1 }}>Status</span>
                  <span style={{ flex: 1.5 }}>Date</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Actions</span>
                </div>
                {recentFiles.map((file) => (
                  <div key={file.id} style={styles.tableRow}>
                    <span style={{ flex: 2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.original_name}
                      </span>
                    </span>
                    <span style={{ flex: 1 }}>{file.file_type.toUpperCase()}</span>
                    <span style={{ flex: 1 }}>{formatSize(file.file_size)}</span>
                    <span style={{ flex: 1 }}>{statusBadge(file.status)}</span>
                    <span style={{ flex: 1.5, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {formatDate(file.created_at)}
                    </span>
                    <span style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate('/transform', { state: { fileId: file.id } })}
                        style={styles.actionBtn} title="Open in Transformation Studio">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDownload(file.id, file.original_name)}
                        style={styles.actionBtn} title="Download">
                        <Download size={14} />
                      </button>
                      <button onClick={() => handleDelete(file.id)} style={styles.actionBtnDanger} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Activity size={18} /> Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentActivity.map((log, i) => (
                  <div key={i} style={styles.activityItem}>
                    <div style={{
                      ...styles.activityDot,
                      background: log.action === 'login' ? 'var(--accent-green)' :
                        log.action === 'logout' ? 'var(--accent-red)' : 'var(--accent-blue)',
                    }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{log.action}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                ))}
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
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
  },
  title: { fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px' },
  subtitle: { color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' },
  statCard: {
    padding: '20px', background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', gap: '16px',
    transition: 'border-color 0.2s',
  },
  statIcon: {
    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px' },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 },
  section: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '1.05rem', fontWeight: 700, margin: 0,
  },
  viewAll: { fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 },
  empty: {
    textAlign: 'center', padding: '48px 20px',
  },
  table: { display: 'flex', flexDirection: 'column' },
  tableHeader: {
    display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  tableRow: {
    display: 'flex', alignItems: 'center', padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    fontSize: '0.88rem', color: 'var(--text-secondary)',
  },
  actionBtn: {
    background: 'rgba(99,140,255,0.1)', border: 'none', color: 'var(--accent-blue)',
    borderRadius: '6px', width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  actionBtnDanger: {
    background: 'rgba(248,113,113,0.1)', border: 'none', color: 'var(--accent-red)',
    borderRadius: '6px', width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  activityItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 0', fontSize: '0.88rem',
  },
  activityDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
};