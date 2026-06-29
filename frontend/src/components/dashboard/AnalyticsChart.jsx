import { useState } from 'react';
import './css/AnalyticsChart.css';
import { computeStats, monthlyTrend } from '../../lib/applications/applications';

export default function AnalyticsChart({ applications = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null); // Tooltip is hidden by default

  const stats = computeStats(applications);
  const bs = stats.byStage;
  const submitted = bs.applied + bs.interviewing + bs.offer + bs.rejected;
  const interviewed = bs.interviewing + bs.offer; // reached an interview or beyond
  const offers = bs.offer;
  const rate = stats.responseRate; // (interviewing + offer) / submitted, or null

  // Real trend, scaled to fit the chart box (top y=40, bottom y=130).
  const trend = monthlyTrend(applications, 6);
  const counts = trend.map((t) => t.applications);
  const maxV = Math.max(4, ...counts);
  const xs = trend.map((_, i) => 40 + i * (400 / (trend.length - 1)));
  const yFor = (v) => 130 - (v / maxV) * 90;
  const points = trend.map((t, i) => ({ ...t, x: xs[i], y: yFor(t.applications) }));
  const linePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},130 ${points.map((p) => `L ${p.x},${p.y}`).join(' ')} L ${points[points.length - 1].x},130 Z`;
  const yLabels = [0, Math.round(maxV / 3), Math.round((maxV * 2) / 3), maxV];

  const hasData = submitted > 0;
  const activePoint = points[hoveredIdx];

  return (
    <section className="card-widget analytics-card">
      <div className="card-header-row">
        <h2 className="card-title">Application Analytics</h2>
        <select className="overview-dropdown" defaultValue="6_months">
          <option value="6_months">Last 6 Months</option>
        </select>
      </div>

      <div className="analytics-stats-row">
        <div className="stat-item">
          <span className="stat-value">{submitted}</span>
          <span className="stat-label">Applications</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{interviewed}</span>
          <span className="stat-label">Interviews</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{offers}</span>
          <span className="stat-label">Offers</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{rate == null ? '—' : `${rate}%`}</span>
          <span className="stat-label">Interview Rate</span>
        </div>
      </div>

      <div className="chart-container-inner">
        {hasData ? (
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

            {/* Y axis labels (scaled to data) */}
            <text x="25" y="133" textAnchor="end" className="chart-y-axis-text">{yLabels[0]}</text>
            <text x="25" y="103" textAnchor="end" className="chart-y-axis-text">{yLabels[1]}</text>
            <text x="25" y="73" textAnchor="end" className="chart-y-axis-text">{yLabels[2]}</text>
            <text x="25" y="43" textAnchor="end" className="chart-y-axis-text">{yLabels[3]}</text>

            <path d={areaPath} className="chart-area" />
            <path d={linePath} className="chart-line" />

            {points.map((d, i) => (
              <text key={i} x={d.x} y="146" className="chart-axis-text">{d.label}</text>
            ))}

            {points.map((d, i) => (
              <circle
                key={`app-${i}`}
                cx={d.x}
                cy={d.y}
                r={hoveredIdx === i ? '5.5' : '4'}
                className="chart-point"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>
        ) : (
          <div className="analytics-empty">
            <p>No application data yet. Add applications in the tracker to see your trends here.</p>
          </div>
        )}

        {hasData && activePoint && (
          <div
            className="chart-tooltip"
            style={{ left: `${(activePoint.x / 480) * 100}%`, top: `${(activePoint.y / 150) * 100}%` }}
          >
            <span className="tooltip-title">{activePoint.label}</span>
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
