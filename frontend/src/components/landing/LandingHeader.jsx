import ThemeToggle from '../ThemeToggle';
import BrandLogo from '../BrandLogo';
import './css/LandingHeader.css';

export default function LandingHeader({ onEnterApp, onLogin, isAuthed = false }) {
  const handleLogin = onLogin || onEnterApp;
  const goHome = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <header className="landing-header">
      <div className="navbar">
        <div className="logo-group" onClick={goHome} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') goHome(); }}>
          <BrandLogo />
        </div>

        <nav className="nav-links">
          <a href="#features" className="nav-link">
            <span>Features</span>
          </a>
          <a href="#resume" className="nav-link" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>
            <span>Resume</span>
          </a>
          <a href="#portfolio" className="nav-link" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>
            <span>Portfolio</span>
          </a>
          <a href="#workflow" className="nav-link">
            <span>Workflow</span>
          </a>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {isAuthed ? (
            <button type="button" className="btn-primary-nav" onClick={onEnterApp}>Open dashboard</button>
          ) : (
            <>
              <button type="button" className="btn-secondary-nav" onClick={handleLogin}>Log In</button>
              <button type="button" className="btn-primary-nav" onClick={onEnterApp}>
                <span className="nav-cta-label-full">Get Started Free</span>
                <span className="nav-cta-label-short">Start Free</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
