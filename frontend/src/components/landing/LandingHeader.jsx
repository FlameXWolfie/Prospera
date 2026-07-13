import { ChevronDown } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import './css/LandingHeader.css';

export default function LandingHeader({ onEnterApp, onLogin, isAuthed = false }) {
  const handleLogin = onLogin || onEnterApp;
  // Logo stays on the marketing page when signed in; primary CTA goes to the app.
  const goHome = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <header className="landing-header">
      <div className="navbar">
        <div className="logo-group" onClick={isAuthed ? goHome : onEnterApp} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') (isAuthed ? goHome : onEnterApp)(); }}>
          <div className="logo-circle">P</div>
          <span className="logo-text-bold">Prospera</span>
        </div>

        <nav className="nav-links">
          <a href="#features" className="nav-link">
            <span>Features</span>
            <ChevronDown size={14} />
          </a>
          <a href="#resume" className="nav-link" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>
            <span>Resume</span>
          </a>
          <a href="#portfolio" className="nav-link" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>
            <span>Portfolio</span>
          </a>
          <a href="#resources" className="nav-link">
            <span>Resources</span>
            <ChevronDown size={14} />
          </a>
          <a href="#pricing" className="nav-link">
            <span>Pricing</span>
          </a>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {isAuthed ? (
            <button type="button" className="btn-primary-nav" onClick={onEnterApp}>Open dashboard</button>
          ) : (
            <>
              <button type="button" className="btn-secondary-nav" onClick={handleLogin}>Log In</button>
              <button type="button" className="btn-primary-nav" onClick={onEnterApp}>Get Started</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
