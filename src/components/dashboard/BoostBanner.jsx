import React, { useState } from 'react';
import './css/BoostBanner.css';
import { Wand2, ArrowRight } from 'lucide-react';

export default function BoostBanner({ initialScore = 72, onScoreUpgrade }) {
  const [score, setScore] = useState(initialScore);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Circumference calculation for circle with r=36
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleImprove = () => {
    if (isUpgrading || score >= 85) return;
    setIsUpgrading(true);
    
    // Simulate interactive scanner boost
    let current = score;
    const interval = setInterval(() => {
      current += 1;
      setScore(current);
      if (current >= 85) {
        clearInterval(interval);
        setIsUpgrading(false);
        if (onScoreUpgrade) {
          onScoreUpgrade(85);
        }
      }
    }, 80);
  };

  return (
    <section className="card-widget boost-banner-card">
      <div className="boost-content-wrapper">
        <div className="boost-left">
          <div>
            <h2 className="boost-title">Your resume<br />needs a boost!</h2>
            <p className="boost-desc">Improve your resume score and stand out to recruiters.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="boost-btn" 
              onClick={handleImprove}
              disabled={isUpgrading || score >= 85}
              style={{ opacity: (isUpgrading || score >= 85) ? 0.8 : 1 }}
            >
              <Wand2 size={14} className={isUpgrading ? 'animate-spin' : ''} />
              <span>{isUpgrading ? 'Improving...' : score >= 85 ? 'Optimized!' : 'Improve Now'}</span>
            </button>
            
            <a href="#report" className="boost-report-link" onClick={(e) => { e.preventDefault(); alert('Opening Full Analysis Report...'); }}>
              <span>View Full Report</span>
              <ArrowRight size={12} />
            </a>
          </div>
        </div>

        <div className="boost-right">
          {/* Gauge Widget */}
          <div className="boost-gauge-visual" style={{ zIndex: 10 }}>
            <svg className="boost-gauge-svg">
              <circle 
                cx="45" 
                cy="45" 
                r={radius} 
                className="boost-gauge-bg" 
              />
              <circle 
                cx="45" 
                cy="45" 
                r={radius} 
                className="boost-gauge-fill" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="boost-gauge-text">
              <span className="boost-gauge-score">{score}</span>
              <div className="boost-gauge-label">Good</div>
            </div>
          </div>

          {/* Floating graphic */}
          <div className="boost-art-container">
            <img 
              src="/assets/resume_boost_art.png" 
              alt="Boost illustration" 
              className="boost-art-img" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
