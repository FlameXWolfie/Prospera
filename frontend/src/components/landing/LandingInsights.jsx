import { Check, ArrowRight } from 'lucide-react';
import './css/LandingInsights.css';

// Import image asset
import applicationAnalytics from '../../assets/application_analytics.webp';

export default function LandingInsights({ onEnterApp }) {
  return (
    <section className="insights-section">
      <div className="insights-content">
        <div className="insights-left">
          <span className="section-tagline">Data-Driven Insights</span>
          <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '16px' }}>
            Track. Analyze. Improve.
          </h2>
          <p className="hero-description" style={{ marginBottom: '16px' }}>
            Get insights that help you understand your job search performance and improve every step of the way.
          </p>

          <div className="insights-bullet-list">
            <div className="bullet-item">
              <div className="bullet-check-circle">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Application success rate</span>
            </div>
            <div className="bullet-item">
              <div className="bullet-check-circle">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Interview conversion rate</span>
            </div>
            <div className="bullet-item">
              <div className="bullet-check-circle">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Resume performance score</span>
            </div>
            <div className="bullet-item">
              <div className="bullet-check-circle">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Skills match and gap analysis</span>
            </div>
          </div>

          <a href="#analytics" className="btn-insights-link" onClick={(e) => { e.preventDefault(); onEnterApp(); }}>
            <span>View full Analytics</span>
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="insights-right">
          <img
            src={applicationAnalytics}
            alt="Application Analytics chart and metrics card"
            className="insights-chart-img"
          />
        </div>
      </div>
    </section>
  );
}
