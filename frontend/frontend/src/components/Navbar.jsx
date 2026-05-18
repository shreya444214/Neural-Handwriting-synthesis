import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import {
  Home, LayoutDashboard, PenTool, MessageSquare,
  Settings, User, LogOut, Menu, X, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = isAuthenticated ? [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transform', label: 'Transform', icon: PenTool },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
  ] : [];

  const isActive = (path) => location.pathname === path;

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} style={styles.logo}>
          <span style={styles.logoIcon}>✍️</span>
          <span style={styles.logoText}>Handwriting<span style={styles.logoAccent}>AI</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav style={styles.nav}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              style={{
                ...styles.navLink,
                ...(isActive(path) ? styles.navLinkActive : {}),
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={styles.right}>
          {isAuthenticated ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={styles.profileBtn}
              >
                <div style={styles.avatar}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={styles.greeting}>Hi, {user?.name?.split(' ')[0]} 👋</span>
                <ChevronDown size={14} style={{
                  transition: 'transform 0.2s',
                  transform: profileOpen ? 'rotate(180deg)' : 'none'
                }} />
              </button>

              {profileOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <strong>{user?.name}</strong>
                    <span style={styles.dropdownEmail}>{user?.email}</span>
                  </div>
                  <div style={styles.dropdownDivider} />
                  <Link to="/profile" style={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                    <User size={16} /> Profile
                  </Link>
                  <Link to="/settings" style={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                  <div style={styles.dropdownDivider} />
                  <button onClick={handleLogout} style={{ ...styles.dropdownItem, ...styles.logoutItem }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authBtns}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            style={styles.mobileToggle}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              style={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
          {!isAuthenticated && (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(5, 7, 10, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    height: 'var(--nav-height)',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: { fontSize: '1.5rem' },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  logoAccent: {
    color: 'var(--accent-gold)',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: 'var(--accent-gold)',
    background: 'rgba(255, 215, 0, 0.08)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  authBtns: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 14px 4px 4px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--gradient-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: 'white',
  },
  greeting: {
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '220px',
    background: 'rgba(15, 18, 30, 0.98)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: '8px',
    animation: 'fadeIn 0.2s ease',
  },
  dropdownHeader: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownEmail: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  dropdownDivider: {
    height: '1px',
    background: 'var(--border-subtle)',
    margin: '4px 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  logoutItem: {
    color: 'var(--accent-red)',
  },
  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '4px',
  },
  mobileMenu: {
    display: 'none',
    padding: '12px 20px 20px',
    borderTop: '1px solid var(--border-subtle)',
  },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.95rem',
  },
  '@media (max-width: 768px)': {}, // handled inline below
};
