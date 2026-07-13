import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './css/AuthPage.css';

const SLIDES = [
  {
    title: 'Land your next role,\nfaster.',
    sub: 'ATS scans, tailored resumes, and an application tracker — one workspace.',
  },
  {
    title: 'Resumes that pass\nthe first screen.',
    sub: 'Match the language of each job post without rewriting everything from scratch.',
  },
  {
    title: 'Every application,\nin one place.',
    sub: 'From saved to offer — a clear view of where you stand, always.',
  },
];

// Full-bleed dual-panel auth layout (visual + form), shared by login & signup.
export default function AuthShell({ onBack, busy, children }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5200);
    return () => clearInterval(t);
  }, []);

  const current = SLIDES[slide];

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left visual panel */}
        <aside className="auth-visual" aria-hidden={false}>
          <div className="auth-visual-top">
            <button type="button" className="auth-logo" onClick={onBack} disabled={busy} aria-label="Prospera home">
              <span className="auth-logo-mark">P</span>
              <span className="auth-logo-word">Prospera</span>
            </button>
            <button type="button" className="auth-back" onClick={onBack} disabled={busy}>
              Back to website <ArrowRight size={14} />
            </button>
          </div>

          <div className="auth-visual-art" aria-hidden="true">
            <span className="auth-dune auth-dune-1" />
            <span className="auth-dune auth-dune-2" />
            <span className="auth-dune auth-dune-3" />
            <span className="auth-glow" />
          </div>

          <div className="auth-visual-foot">
            <h2 className="auth-visual-title" key={slide}>
              {current.title.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </h2>
            <p className="auth-visual-sub" key={`s-${slide}`}>{current.sub}</p>
            <div className="auth-dots" role="tablist" aria-label="Highlights">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  className={`auth-dot${i === slide ? ' active' : ''}`}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Right form panel (follows app light/dark theme) */}
        <main className="auth-panel">
          <div className="auth-theme-toggle">
            <ThemeToggle />
          </div>
          <div className="auth-panel-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
