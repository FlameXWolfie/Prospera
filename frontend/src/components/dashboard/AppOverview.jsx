import './css/AppOverview.css';
import { ChevronRight } from 'lucide-react';

export default function AppOverview() {
  // SVG Circular Segment calculations (Radius = 40, Circumference = 251.32)
  // Total = 32
  // In Progress: 14 (43.75%) -> Dash = 109.95, Offset = 0
  // Interview: 8 (25%) -> Dash = 62.83, Offset = -109.95
  // Offer: 4 (12.5%) -> Dash = 31.42, Offset = -172.78
  // Rejected: 6 (18.75%) -> Dash = 47.12, Offset = -204.20
  
  const segments = [
    { name: 'In Progress', count: 14, percent: 44, color: 'var(--info)', dash: '109.95 251.32', offset: '0' },
    { name: 'Interview', count: 8, percent: 25, color: '#4f46e5', dash: '62.83 251.32', offset: '-109.95' },
    { name: 'Offer', count: 4, percent: 12, color: 'var(--success)', dash: '31.42 251.32', offset: '-172.78' },
    { name: 'Rejected', count: 6, percent: 19, color: 'var(--danger)', dash: '47.12 251.32', offset: '-204.20' }
  ];

  return (
    <section className="card-widget overview-card">
      <div className="card-header-row">
        <h2 className="card-title">Application Overview</h2>
        <select className="overview-dropdown" defaultValue="this_month">
          <option value="this_month">This Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      <div className="overview-chart-wrapper">
        <div className="doughnut-visual">
          <svg className="doughnut-svg" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-inset)" strokeWidth="10" />
            
            {/* Slices */}
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                className="doughnut-slice"
                stroke={seg.color}
                strokeDasharray={seg.dash}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <div className="doughnut-center-text">
            <span className="doughnut-center-count">32</span>
            <div className="doughnut-center-label">Total</div>
          </div>
        </div>

        <div className="legend-list">
          {segments.map((seg, idx) => (
            <div key={idx} className="legend-item">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: seg.color }}></span>
                <span className="legend-name">{seg.name}</span>
              </div>
              <div className="legend-value-group">
                <span className="legend-count">{seg.count}</span>
                <span className="legend-percentage">({seg.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-strength-box">
        <div className="strength-header">
          <span className="strength-label">Profile Strength</span>
          <span className="strength-percentage">85%</span>
        </div>
        <div className="strength-progress-track">
          <div className="strength-progress-bar" style={{ width: '85%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span className="strength-helper-text">You're almost there! Complete remaining steps.</span>
          <button 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
            onClick={() => alert('Steps to complete: \n1. Add your portfolio site\n2. Add past project details')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
