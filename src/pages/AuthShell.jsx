import { ArrowLeft, ScanLine, KanbanSquare, Sparkles } from 'lucide-react';
import './css/AuthPage.css';

// Split-screen auth layout: brand/value panel on the left, form card on the right.
export default function AuthShell({ onBack, busy, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <button type="button" className="auth-back" onClick={onBack} disabled={busy}><ArrowLeft size={15} /> Back to site</button>
        <div className="auth-brand-inner">
          <div className="auth-logo"><span className="auth-logo-mark">P</span> Prospera</div>
          <h1 className="auth-brand-title">Land your next role, faster.</h1>
          <p className="auth-brand-text">ATS scans, resume tailoring, and an application tracker — all in one place.</p>
          <ul className="auth-points">
            <li><span className="auth-point-ic"><ScanLine size={15} /></span> Beat the ATS with keyword-matched resumes</li>
            <li><span className="auth-point-ic"><KanbanSquare size={15} /></span> Track every application from saved to offer</li>
            <li><span className="auth-point-ic"><Sparkles size={15} /></span> Build and enhance resumes in minutes</li>
          </ul>
        </div>
        <p className="auth-brand-foot">© Prospera — your career, organized.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
