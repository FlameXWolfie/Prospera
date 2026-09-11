import { Play } from 'lucide-react';
import './css/LandingHero.css';

// Import image assets
import heroPerson from '../../assets/hero-person.webp';
import atsScan from '../../assets/ats_scan.webp';
import upcomingInterview from '../../assets/upcoming-interview.webp';
import portfolioPreview from '../../assets/portfolio-preview_hero.webp';

export default function LandingHero({ onEnterApp, isAuthed = false }) {
  const showProductTour = () => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero-section">
      <div className="hero-left">
        <h1 className="hero-title">
          A sharper search.<br />
          <span className="hero-accent">From draft to offer.</span>
        </h1>

        <p className="hero-description">
          Tailor every resume, keep applications moving, and practice for the conversations that matter.
        </p>

        <div className="hero-ctas">
          <button type="button" className="btn-hero-primary" onClick={onEnterApp}>
            {isAuthed ? 'Open dashboard' : 'Get Started Free'}
          </button>
          <button type="button" className="btn-hero-secondary" onClick={showProductTour}>
            <Play size={16} fill="currentColor" />
            <span>Explore Product</span>
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-circle-backdrop"></div>
        <div className="hero-ring-solid-3"></div>
        <div className="hero-ring-solid-2"></div>
        <div className="hero-ring-solid-1"></div>
        <div className="hero-ring-border"></div>
        <div className="hero-floating-dot dot-lg"></div>
        <div className="hero-floating-dot dot-sm"></div>
        <img
          src={heroPerson}
          alt="Smiling professional holding a notebook"
          className="hero-person-img"
        />

        {/* Floating Panels */}
        <img
          src={atsScan}
          alt="ATS Scan Status"
          className="float-ats"
        />

        <img
          src={upcomingInterview}
          alt="Upcoming Interviews"
          className="float-tracker"
        />

        <img
          src={portfolioPreview}
          alt="Portfolio Preview"
          className="float-portfolio"
        />

        <div className="float-panel float-strength">
          <span className="strength-title">Resume Strength</span>
          <div className="strength-score-row">
            <span className="strength-score-val">95%</span>
            <span className="strength-score-tag">Excellent</span>
          </div>
          <div className="strength-bar-track">
            <div className="strength-bar-fill" style={{ width: '95%' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
