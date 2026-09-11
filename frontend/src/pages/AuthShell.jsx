import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Gauge, LayoutGrid } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import BrandLogo from '../components/BrandLogo';
import atsScan from '../assets/ats_scan.webp';
import analytics from '../assets/application_analytics.webp';
import portfolioPreview from '../assets/portfolio-preview_hero.webp';
import './css/AuthPage.css';

// Each slide pairs a real product screenshot with the claim it backs up, so the
// visual panel shows the app instead of decorating around it.
const SLIDES = [
  {
    image: atsScan,
    alt: 'Resume ATS scan result with keyword match breakdown',
    label: 'ATS scan',
    title: 'Pass the first\nscreen.',
    sub: 'Scan any resume against a live job post and see exactly which keywords are missing.',
  },
  {
    image: analytics,
    alt: 'Application tracker board showing applications by stage',
    label: 'Tracker',
    title: 'Every application,\none board.',
    sub: 'From saved to offer, keep a clear view of where each conversation actually stands.',
  },
  {
    image: portfolioPreview,
    alt: 'Portfolio site generated from a saved resume',
    label: 'Portfolio',
    title: 'A portfolio from\nyour resume.',
    sub: 'Turn a saved resume into a publishable portfolio site without starting over.',
  },
];

const PROOF = [
  { icon: Gauge, text: 'Instant ATS scoring' },
  { icon: LayoutGrid, text: 'Six resume templates' },
  { icon: ShieldCheck, text: 'Private by default' },
];

const SLIDE_MS = 5600;

// Full-bleed dual-panel auth layout (product visual + form), shared by login & signup.
export default function AuthShell({ onBack, busy, children }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: hold the first slide rather than auto-rotating.
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) return undefined;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  const current = SLIDES[slide];

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left visual panel */}
        <aside className="auth-visual">
          <div className="auth-visual-bg" aria-hidden="true">
            <span className="auth-aurora auth-aurora-1" />
            <span className="auth-aurora auth-aurora-2" />
            <span className="auth-aurora auth-aurora-3" />
            <span className="auth-grid" />
          </div>

          <div className="auth-visual-top">
            <button
              type="button"
              className="auth-logo"
              onClick={onBack}
              disabled={busy}
              aria-label="Go to the homepage"
            >
              <BrandLogo size={34} />
            </button>
            <button type="button" className="auth-back" onClick={onBack} disabled={busy}>
              Back to website <ArrowRight size={14} />
            </button>
          </div>

          {/* Real product screenshots, cross-faded inside a single glass frame. */}
          <div className="auth-stage">
            <div className="auth-frame">
              <div className="auth-frame-glow" aria-hidden="true" />
              {SLIDES.map((s, i) => (
                <img
                  key={s.label}
                  src={s.image}
                  alt={i === slide ? s.alt : ''}
                  className={`auth-shot${i === slide ? ' is-active' : ''}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  aria-hidden={i === slide ? undefined : 'true'}
                />
              ))}
              <span className="auth-frame-badge">{current.label}</span>
            </div>
          </div>

          <div className="auth-visual-foot">
            <h2 className="auth-visual-title" key={slide}>
              {current.title.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p className="auth-visual-sub" key={`s-${slide}`}>{current.sub}</p>

            <div className="auth-dots" role="tablist" aria-label="Product highlights">
              {SLIDES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={s.label}
                  className={`auth-dot${i === slide ? ' active' : ''}`}
                  onClick={() => setSlide(i)}
                >
                  <span className="auth-dot-fill" />
                </button>
              ))}
            </div>

            <ul className="auth-proof">
              {PROOF.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={14} strokeWidth={1.75} />
                  {text}
                </li>
              ))}
            </ul>
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
