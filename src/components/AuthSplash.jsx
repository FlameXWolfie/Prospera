// Shown while the auth session is being restored on first load. Uses inline
// styles only so it never depends on a CSS file that hasn't loaded yet.
export default function AuthSplash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center',
            background: 'var(--primary-accent)', color: '#fff', fontFamily: 'var(--font-heading)',
            fontWeight: 800, fontSize: 24, boxShadow: '0 10px 30px -8px rgba(54,63,245,0.5)',
            animation: 'authPulse 1.4s ease-in-out infinite',
          }}
        >
          P
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Loading Prospera…</span>
      </div>
      <style>{'@keyframes authPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.92);opacity:0.7}}'}</style>
    </div>
  );
}
