import React from 'react';
import './css/Newsletter.css';

export default function Newsletter() {
  return (
    <section className="newsletter-section">
      <div className="newsletter-banner">
        <div className="newsletter-text">
          <h2 className="newsletter-title">Stay updated with career tips & job opportunities</h2>
          <p className="newsletter-desc">Join our newsletter and get the latest insights every week.</p>
        </div>

        <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed to newsletter!'); e.target.reset(); }}>
          <input
            type="email"
            placeholder="Enter your email"
            className="newsletter-input"
            required
          />
          <button type="submit" className="btn-subscribe">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
