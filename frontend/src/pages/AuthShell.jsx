import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  FileSearch,
  Layers3,
  LockKeyhole,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import BrandLogo from '../components/BrandLogo';
import atsScan from '../assets/ats_scan.webp';
import analytics from '../assets/application_analytics.webp';
import portfolioPreview from '../assets/portfolio-preview_hero.webp';
import './css/AuthPage.css';

const SHOWCASE = [
  {
    image: atsScan,
    label: 'ATS intelligence',
    alt: 'ATS resume scan with keyword match insights',
  },
  {
    image: analytics,
    label: 'Application analytics',
    alt: 'Application analytics dashboard with pipeline data',
  },
  {
    image: portfolioPreview,
    label: 'Portfolio studio',
    alt: 'Professional portfolio generated from a resume',
  },
];

const MODE_COPY = {
  login: {
    eyebrow: 'Secure workspace access',
    title: 'Welcome back.',
    description: 'Pick up your search exactly where you left it.',
    stageTitle: 'Your career search,\nfinally in motion.',
    stageDescription:
      'Build sharper resumes, understand every application, and move from opportunity to offer in one focused workspace.',
  },
  signup: {
    eyebrow: 'Your workspace starts here',
    title: 'Create your account.',
    description: 'Set up your private career workspace in under a minute.',
    stageTitle: 'Turn your experience\ninto momentum.',
    stageDescription:
      'Create a resume system that adapts to every role, tracks every conversation, and keeps your next move visible.',
  },
};

const SLIDE_DURATION = 5200;

export default function AuthShell({ mode = 'login', onBack, onSwitch, busy, children }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const copy = MODE_COPY[mode] ?? MODE_COPY.login;

  useEffect(() => {
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (motionQuery?.matches) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SHOWCASE.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, []);

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
  };

  const switchMode = (nextMode) => {
    if (nextMode !== mode && !busy) onSwitch?.();
  };

  return (
    <div className="auth-experience" onPointerMove={handlePointerMove}>
      <div className="auth-ambient" aria-hidden="true">
        <span className="auth-ambient-orb auth-ambient-orb-one" />
        <span className="auth-ambient-orb auth-ambient-orb-two" />
        <span className="auth-ambient-orb auth-ambient-orb-three" />
        <span className="auth-grid-plane" />
        <span className="auth-pointer-light" />
        <span className="auth-grain" />
      </div>

      <header className="auth-topbar">
        <button
          type="button"
          className="auth-brand-button"
          onClick={onBack}
          disabled={busy}
          aria-label="Go to the homepage"
        >
          <BrandLogo size={32} showWordmark />
        </button>

        <div className="auth-topbar-note" aria-label="Product status">
          <span className="auth-live-dot" />
          AI career workspace
        </div>

        <div className="auth-topbar-actions">
          <button type="button" className="auth-home-link" onClick={onBack} disabled={busy}>
            Home
            <ArrowUpRight size={15} strokeWidth={1.8} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="auth-canvas">
        <section className="auth-showcase" aria-label="Product preview">
          <svg
            className="auth-signal-map"
            viewBox="0 0 760 540"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="authTrace" x1="60" y1="80" x2="690" y2="470">
                <stop stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="0.45" stopColor="#8b5cf6" stopOpacity="0.78" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="authNode">
                <stop stopColor="#ffffff" />
                <stop offset="0.35" stopColor="#a5b4fc" />
                <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path className="auth-signal-base" d="M28 438C143 355 113 142 281 123C434 106 442 324 572 300C666 283 661 146 742 92" />
            <path className="auth-signal-flow" d="M28 438C143 355 113 142 281 123C434 106 442 324 572 300C666 283 661 146 742 92" />
            <path className="auth-signal-base auth-signal-base-two" d="M53 82C194 96 210 250 340 252C488 254 512 427 704 458" />
            <path className="auth-signal-flow auth-signal-flow-two" d="M53 82C194 96 210 250 340 252C488 254 512 427 704 458" />
            <circle cx="280" cy="123" r="9" fill="url(#authNode)" />
            <circle cx="572" cy="300" r="8" fill="url(#authNode)" />
            <circle cx="340" cy="252" r="7" fill="url(#authNode)" />
          </svg>

          <div className="auth-showcase-copy">
            <span className="auth-showcase-kicker">
              <Sparkles size={14} strokeWidth={1.8} />
              Career intelligence, connected
            </span>
            <h2>
              {copy.stageTitle.split('\n').map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p>{copy.stageDescription}</p>
          </div>

          <div className="auth-product-scene">
            <div className="auth-product-window">
              <div className="auth-window-bar">
                <div className="auth-window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="auth-window-title">{SHOWCASE[activeSlide].label}</span>
                <span className="auth-window-status">
                  <span /> Live
                </span>
              </div>

              <div className="auth-window-content">
                {SHOWCASE.map((item, index) => (
                  <img
                    key={item.label}
                    src={item.image}
                    alt={index === activeSlide ? item.alt : ''}
                    className={`auth-product-image${index === activeSlide ? ' is-active' : ''}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    aria-hidden={index === activeSlide ? undefined : 'true'}
                  />
                ))}
                <span className="auth-window-reflection" aria-hidden="true" />
              </div>

              <div className="auth-window-nav" role="tablist" aria-label="Product previews">
                {SHOWCASE.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={index === activeSlide}
                    aria-label={`Show ${item.label}`}
                    className={index === activeSlide ? 'is-active' : ''}
                    onClick={() => setActiveSlide(index)}
                  >
                    <span className="auth-window-nav-fill" />
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-float-card auth-float-score">
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle className="auth-ring-track" cx="22" cy="22" r="18" />
                <circle className="auth-ring-value" cx="22" cy="22" r="18" />
              </svg>
              <div>
                <strong>92%</strong>
                <span>role match</span>
              </div>
              <TrendingUp size={15} strokeWidth={1.8} />
            </div>

            <div className="auth-float-card auth-float-signal">
              <span className="auth-float-icon"><FileSearch size={17} strokeWidth={1.8} /></span>
              <div>
                <strong>12 signals found</strong>
                <span>Resume is ready to tailor</span>
              </div>
              <CheckCircle2 size={16} className="auth-float-check" />
            </div>

            <div className="auth-float-card auth-float-stack">
              <span className="auth-float-icon"><Layers3 size={17} strokeWidth={1.8} /></span>
              <div>
                <strong>One workspace</strong>
                <span>Resume, roles, portfolio</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-console-wrap" aria-label={mode === 'login' ? 'Sign in' : 'Create account'}>
          <div className="auth-console">
            <div className="auth-mode-switch" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'is-active' : ''}
                onClick={() => switchMode('login')}
                disabled={busy}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'is-active' : ''}
                onClick={() => switchMode('signup')}
                disabled={busy}
              >
                Create account
              </button>
            </div>

            <div className="auth-console-heading">
              <span className="auth-console-eyebrow">
                <span />
                {copy.eyebrow}
              </span>
              <h1>{copy.title}</h1>
              <p>{copy.description}</p>
            </div>

            <div className="auth-console-content" key={mode}>{children}</div>

            <div className="auth-trust-row">
              <span><LockKeyhole size={13} strokeWidth={1.8} /> Encrypted session</span>
              <span className="auth-trust-divider" />
              <span><CheckCircle2 size={13} strokeWidth={1.8} /> Private by default</span>
            </div>
          </div>

          <p className="auth-console-footnote">
            Built for focused job searches, not noisy feeds.
          </p>
        </section>
      </main>
    </div>
  );
}
