import { useState } from 'react';
import './css/AnalyticsChart.css';

export default function AnalyticsChart() {
  const [hoveredIdx, setHoveredIdx] = useState(null); // Tooltip is hidden by default

  const data = [
    { month: 'Dec', applications: 13, interviews: 3, x: 40, y: 91 },
    { month: 'Jan', applications: 24, interviews: 5, x: 120, y: 58 },
    { month: 'Feb', applications: 26, interviews: 6, x: 200, y: 52 },
    { month: 'Mar', applications: 18, interviews: 6, x: 280, y: 100 },
    { month: 'Apr', applications: 17, interviews: 4, x: 360, y: 79 },
    { month: 'May', applications: 26, interviews: 7, x: 440, y: 52 }
  ];

  // Straight line segments matching the mockup shape
  const linePath = "M 40,91 L 120,58 L 200,52 L 280,100 L 360,79 L 440,52";
  const areaPath = "M 40,130 L 40,91 L 120,58 L 200,52 L 280,100 L 360,79 L 440,52 L 440,130 Z";

  const handlePointHover = (idx) => {
    setHoveredIdx(idx);
  };

  const activePoint = data[hoveredIdx];

  return (
    <section className="card-widget analytics-card">
      <div className="card-header-row">
        <h2 className="card-title">Application Analytics</h2>
        <select className="overview-dropdown" defaultValue="6_months">
          <option value="6_months">Last 6 Months</option>
          <option value="1_year">Last Year</option>
        </select>
      </div>

      <div className="analytics-stats-row">
        <div className="stat-item" onClick={() => alert('View details for Applications')}>
          <span className="stat-value">64</span>
          <span className="stat-label">Applications</span>
        </div>
        <div className="stat-item" onClick={() => alert('View details for Interviews')}>
          <span className="stat-value">18</span>
          <span className="stat-label">Interviews</span>
        </div>
        <div className="stat-item" onClick={() => alert('View details for Offers')}>
          <span className="stat-value">6</span>
          <span className="stat-label">Offers</span>
        </div>
        <div className="stat-item" onClick={() => alert('View details for Interview Rate')}>
          <span className="stat-value">40%</span>
          <span className="stat-label">Interview Rate</span>
        </div>
      </div>

      <div className="chart-container-inner">
        <svg className="analytics-chart-svg" viewBox="0 0 480 150">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#363ff5" />
              <stop offset="100%" stopColor="#363ff5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="130" x2="440" y2="130" className="chart-grid-line" />
          <line x1="40" y1="100" x2="440" y2="100" className="chart-grid-line" />
          <line x1="40" y1="70" x2="440" y2="70" className="chart-grid-line" />
          <line x1="40" y1="40" x2="440" y2="40" className="chart-grid-line" />

          {/* Y Axis Labels */}
          <text x="25" y="133" textAnchor="end" className="chart-y-axis-text">0</text>
          <text x="25" y="103" textAnchor="end" className="chart-y-axis-text">10</text>
          <text x="25" y="73" textAnchor="end" className="chart-y-axis-text">20</text>
          <text x="25" y="43" textAnchor="end" className="chart-y-axis-text">30</text>

          {/* Filled Area under Applications */}
          <path d={areaPath} className="chart-area" />

          {/* Line for Applications */}
          <path d={linePath} className="chart-line" />

          {/* Month labels */}
          {data.map((d, i) => (
            <text key={i} x={d.x} y="146" className="chart-axis-text">
              {d.month}
            </text>
          ))}

          {/* Value points - Applications */}
          {data.map((d, i) => (
            <circle
              key={`app-${i}`}
              cx={d.x}
              cy={d.y}
              r={hoveredIdx === i ? '5.5' : '4'}
              className="chart-point"
              onMouseEnter={() => handlePointHover(i)}
              onMouseLeave={() => handlePointHover(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip aligned with coordinates */}
        {activePoint && (
          <div 
            className="chart-tooltip"
            style={{ 
              left: `${(activePoint.x / 480) * 100}%`, 
              top: `${(activePoint.y / 150) * 100}%` 
            }}
          >
            <span className="tooltip-title">{activePoint.month} 2024</span>
            <div className="tooltip-row">
              <span className="tooltip-dot" style={{ backgroundColor: 'var(--primary-accent)' }}></span>
              <span className="tooltip-label">Applications: <strong>{activePoint.applications}</strong></span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-dot" style={{ backgroundColor: '#4f46e5' }}></span>
              <span className="tooltip-label">Interviews: <strong>{activePoint.interviews}</strong></span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
