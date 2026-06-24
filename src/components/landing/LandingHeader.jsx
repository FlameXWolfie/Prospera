import React from 'react';
import { ChevronDown } from 'lucide-react';
import './css/LandingHeader.css';

export default function LandingHeader({ onEnterApp }) {
  return (
    <header className="landing-header">
      <div className="navbar">
        <div className="logo-group" onClick={onEnterApp}>
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
          <button className="btn-secondary-nav" onClick={onEnterApp}>Log In</button>
          <button className="btn-primary-nav" onClick={onEnterApp}>Get Started</button>
        </div>
      </div>
    </header>
  );
}
