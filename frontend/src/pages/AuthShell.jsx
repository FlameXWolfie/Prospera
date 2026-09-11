import { ArrowUpRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import BrandLogo from '../components/BrandLogo';
import './css/AuthPage.css';

const COPY = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to continue to your workspace.',
  },
  signup: {
    title: 'Create your account',
    description: 'Start building your career workspace.',
  },
};

export default function AuthShell({ mode = 'login', onBack, onSwitch, busy, children }) {
  const copy = COPY[mode] ?? COPY.login;

  const switchMode = (nextMode) => {
    if (nextMode !== mode && !busy) onSwitch?.();
  };

  return (
    <div className="auth-experience">
      <header className="auth-header">
        <button
          type="button"
          className="auth-brand-button"
          onClick={onBack}
          disabled={busy}
          aria-label="Go to the homepage"
        >
          <BrandLogo size={31} showWordmark />
        </button>

        <div className="auth-header-actions">
          <ThemeToggle />
          <button type="button" className="auth-home-link" onClick={onBack} disabled={busy}>
            Home
            <ArrowUpRight size={15} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-card" aria-label={mode === 'login' ? 'Sign in' : 'Create account'}>
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

          <div className="auth-heading">
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>

          <div className="auth-content" key={mode}>{children}</div>
        </section>
      </main>
    </div>
  );
}
