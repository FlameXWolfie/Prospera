// Shown while the auth session is being restored on first load. Uses inline
// styles only so it never depends on a CSS file that hasn't loaded yet.
import BrandLogo from './BrandLogo';

export default function AuthSplash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ animation: 'authPulse 1.4s ease-in-out infinite' }}>
          <BrandLogo size={52} showWordmark={false} />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Loading DraftMe…</span>
      </div>
      <style>{'@keyframes authPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.92);opacity:0.7}}'}</style>
    </div>
  );
}
