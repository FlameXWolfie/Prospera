import { Star, Play } from 'lucide-react';
import './css/LandingHero.css';

// Import image assets
import heroPerson from '../../assets/hero-person.webp';
import atsScan from '../../assets/ats_scan.webp';
import upcomingInterview from '../../assets/upcoming-interview.webp';
import portfolioPreview from '../../assets/portfolio-preview_hero.webp';

export default function LandingHero({ onEnterApp, isAuthed = false }) {
  return (
    <section className="hero-section">
      <div className="hero-left">
        <div className="platform-badge">
          <Star size={14} fill="currentColor" />
          <span>Your All-in-One Career Platform</span>
        </div>

        <h1 className="hero-title">
          Build. Enhance.<br />
          Track. <span className="hero-accent">Succeed.</span>
        </h1>

        <p className="hero-description">
          Create standout resumes, track every application, and land your dream job faster with AI-powered tools.
        </p>

        <div className="hero-ctas">
          <button type="button" className="btn-hero-primary" onClick={onEnterApp}>
            {isAuthed ? 'Open dashboard' : 'Get Started Free'}
          </button>
          <button className="btn-hero-secondary" onClick={() => alert('Launching Demo Video Player Mock!')}>
            <Play size={16} fill="currentColor" />
            <span>Watch Demo</span>
          </button>
        </div>

        <div className="hero-stats-row">
          <div className="stat-card">
            <div className="stat-num-row">
              <span className="stat-number">50K+</span>
            </div>
            <span className="stat-desc">Resumes Built</span>
          </div>

          <div className="stat-card">
            <div className="stat-num-row">
              <span className="stat-number">1M+</span>
            </div>
            <span className="stat-desc">Applications Tracked</span>
          </div>

          <div className="stat-card">
            <div className="stat-num-row">
              <span className="stat-number">90%</span>
            </div>
            <span className="stat-desc">Interview Success</span>
          </div>
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
