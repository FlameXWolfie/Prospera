import React from 'react';
import { Cpu, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';
import './css/LandingFeatures.css';

export default function LandingFeatures() {
  return (
    <section id="features" className="features-section">
      <span className="section-tagline">Why Prospera?</span>
      <h2 className="section-title">
        Everything you need to <span className="hero-accent">stand out and get hired</span>
      </h2>

      {/* Curved dashed line background for design aesthetics */}
      <svg className="connecting-path-svg" viewBox="0 0 1000 100" fill="none">
        <path d="M50 30 Q250 80 500 50 T950 30" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
        <polygon points="950,30 940,24 943,30 940,36" fill="#cbd5e1" />
      </svg>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon-box icon-green">
            <Cpu size={24} />
          </div>
          <h3 className="feature-title">AI-Powered Optimization</h3>
          <p className="feature-desc">
            Get ATS-friendly resumes with AI suggestions tailored to your target role.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box icon-blue">
            <Briefcase size={24} />
          </div>
          <h3 className="feature-title">Smart Application Tracking</h3>
          <p className="feature-desc">
            Track every application, follow-up, and opportunity in one place — without the chaos.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box icon-purple">
            <GraduationCap size={24} />
          </div>
          <h3 className="feature-title">Interview Preparation</h3>
          <p className="feature-desc">
            Practice with AI mock interviews and expert-curated questions to build confidence.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box icon-orange">
            <TrendingUp size={24} />
          </div>
          <h3 className="feature-title">Data-Driven Insights</h3>
          <p className="feature-desc">
            Get actionable insights to improve your resume and boost your interview rate.
          </p>
        </div>
      </div>
    </section>
  );
}
