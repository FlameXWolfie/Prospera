import React from 'react';
import './css/Partners.css';

export default function Partners() {
  return (
    <section className="trusted-section">
      <h3 className="trusted-title">Trusted by professionals at top companies</h3>
      <div className="trusted-marquee-container">
        <div className="trusted-marquee-track">
          <span className="company-logo-text">Google</span>
          <span className="company-logo-text">Microsoft</span>
          <span className="company-logo-text">amazon</span>
          <span className="company-logo-text">airbnb</span>
          <span className="company-logo-text">stripe</span>
          <span className="company-logo-text">Meta</span>
          <span className="company-logo-text">Adobe</span>
        </div>
        <div className="trusted-marquee-track" aria-hidden="true">
          <span className="company-logo-text">Google</span>
          <span className="company-logo-text">Microsoft</span>
          <span className="company-logo-text">amazon</span>
          <span className="company-logo-text">airbnb</span>
          <span className="company-logo-text">stripe</span>
          <span className="company-logo-text">Meta</span>
          <span className="company-logo-text">Adobe</span>
        </div>
      </div>
    </section>
  );
}
