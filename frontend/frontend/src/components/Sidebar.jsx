import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Upload, PenTool, Clock,
  MessageSquare, Settings, User, FolderOpen
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transform', label: 'Transform', icon: PenTool },
  { path: '/chat', label: 'Chat Room', icon: MessageSquare },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.section}>
        <span style={styles.sectionLabel}>MENU</span>
        {menuItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                ...styles.item,
                ...(active ? styles.itemActive : {}),
              }}
            >
              <Icon size={18} style={{ opacity: active ? 1 : 0.6 }} />
              <span>{label}</span>
              {active && <div style={styles.activeBar} />}
            </Link>
          );
        })}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerCard}>
          <PenTool size={18} style={{ color: 'var(--accent-gold)' }} />
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Need Help?</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Use the chatbot below
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: 'calc(100vh - var(--nav-height))',
    position: 'sticky',
    top: 'var(--nav-height)',
    background: 'rgba(8, 10, 18, 0.9)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px 12px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  sectionLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '1.5px',
    padding: '8px 14px',
    marginBottom: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s',
    position: 'relative',
  },
  itemActive: {
    color: 'var(--accent-gold)',
    background: 'rgba(255, 215, 0, 0.08)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '60%',
    borderRadius: '0 3px 3px 0',
    background: 'var(--accent-gold)',
  },
  footer: {
    padding: '0 4px',
  },
  footerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px',
    background: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    borderRadius: 'var(--radius-md)',
  },
};
