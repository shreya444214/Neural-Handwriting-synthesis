export default function LoadingSpinner({ fullPage = false, size = 40 }) {
  const spinner = (
    <div style={{
      width: size,
      height: size,
      border: '3px solid rgba(255,255,255,0.1)',
      borderTop: '3px solid var(--accent-gold)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {spinner}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      {spinner}
    </div>
  );
}
