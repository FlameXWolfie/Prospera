// Placeholder for sidebar sections not built yet (Interview Prep, Portfolio,
// Profile, Settings, Resources). Each is its own route so the URL persists.
export default function ComingSoon({ name, onHome }) {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.04)',
        marginTop: '20px',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🚀</div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
        {name} workspace
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
        This section is coming soon. Your resumes and applications are saved to your account and sync across devices.
      </p>
      <button className="new-resume-btn" style={{ margin: '0 auto' }} onClick={onHome}>
        Return to Dashboard
      </button>
    </div>
  );
}
