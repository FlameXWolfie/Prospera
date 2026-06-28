import { TrendingUp, Check, AlertCircle, FileText } from 'lucide-react';
import './css/FirstRun.css';

// A rich first-run / empty state: a split hero (copy + CTAs on the left, a
// product mock on the right) plus a row of "how it works" cards underneath.
// Each page passes its own copy, actions, steps, and visual mock.
export default function FirstRun({ eyebrow, title, subtitle, actions, hint, steps = [], numbered = true, visual }) {
  return (
    <div className="fr">
      <div className="fr-hero">
        <span className="fr-glow" aria-hidden="true" />
        <div className="fr-hero-text">
          {eyebrow && <span className="fr-eyebrow">{eyebrow}</span>}
          <h1 className="fr-title">{title}</h1>
          <p className="fr-subtitle">{subtitle}</p>
          {actions && <div className="fr-actions">{actions}</div>}
          {hint && <p className="fr-hint">{hint}</p>}
        </div>
        {visual && <div className="fr-visual">{visual}</div>}
      </div>

      {steps.length > 0 && (
        <div className="fr-steps">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div className="fr-step" key={i}>
                <div className="fr-step-ic"><Icon size={18} /></div>
                <div className="fr-step-body">
                  {numbered && <span className="fr-step-num">Step {i + 1}</span>}
                  <h3 className="fr-step-title">{s.title}</h3>
                  <p className="fr-step-text">{s.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Page-specific hero visuals — pure CSS/SVG mocks, no image assets ───────── */

const RING_C = 2 * Math.PI * 50;

export function EnhanceVisual() {
  return (
    <div className="fr-card fr-mock-enhance">
      <div className="fr-mock-head">
        <span className="fr-mock-dot" /><span className="fr-mock-dot" /><span className="fr-mock-dot" />
        <span className="fr-mock-tag">ATS match</span>
      </div>
      <div className="fr-enhance-row">
        <div className="fr-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" className="fr-ring-bg" />
            <circle cx="60" cy="60" r="50" className="fr-ring-fg" strokeDasharray={RING_C} strokeDashoffset={RING_C * 0.08} />
          </svg>
          <div className="fr-ring-text"><strong>92</strong><span>match</span></div>
        </div>
        <div className="fr-enhance-side">
          <span className="fr-chip add"><Check size={11} strokeWidth={3} /> React</span>
          <span className="fr-chip add"><Check size={11} strokeWidth={3} /> AWS</span>
          <span className="fr-chip add"><Check size={11} strokeWidth={3} /> Docker</span>
          <span className="fr-chip muted">+4 more</span>
        </div>
      </div>
      <div className="fr-progress"><span style={{ width: '92%' }} /></div>
      <p className="fr-mock-foot"><TrendingUp size={12} /> +20 points after fixes</p>
    </div>
  );
}

export function AtsVisual() {
  return (
    <div className="fr-card fr-mock-ats">
      <div className="fr-ats-doc">
        <span className="fr-skel w60" />
        <span className="fr-skel w40 muted" />
        <span className="fr-skel" />
        <span className="fr-skel w80" />
        <span className="fr-skel w50" />
        <span className="fr-skel" />
        <span className="fr-skel w70" />
        <span className="fr-ats-beam" />
      </div>
      <div className="fr-ats-side">
        <div className="fr-ats-score"><strong>86%</strong><span>match</span></div>
        <span className="fr-pill ok"><Check size={11} strokeWidth={3} /> Keywords</span>
        <span className="fr-pill ok"><Check size={11} strokeWidth={3} /> Skills</span>
        <span className="fr-pill warn"><AlertCircle size={11} /> Impact</span>
      </div>
    </div>
  );
}

export function BoardVisual() {
  const cols = [
    { label: 'Saved', color: 'var(--text-muted)', cards: 2 },
    { label: 'Applied', color: 'var(--info)', cards: 2 },
    { label: 'Interview', color: 'var(--purple-accent)', cards: 1 },
    { label: 'Offer', color: 'var(--success)', cards: 1 },
  ];
  return (
    <div className="fr-card fr-mock-board">
      {cols.map((c) => (
        <div className="fr-bcol" key={c.label}>
          <div className="fr-bcol-head"><span className="fr-bdot" style={{ background: c.color }} /> {c.label}</div>
          {Array.from({ length: c.cards }).map((_, i) => (
            <div className="fr-bcard" key={i}>
              <span className="fr-bcard-bar" style={{ background: c.color }} />
              <span className="fr-skel w70" />
              <span className="fr-skel w40 muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LibraryVisual() {
  return (
    <div className="fr-mock-library">
      {[2, 1, 0].map((depth) => (
        <div className={`fr-rcard d${depth}`} key={depth}>
          <div className="fr-rcard-top"><FileText size={14} /><span className="fr-skel w50" /></div>
          <span className="fr-skel" /><span className="fr-skel w80" /><span className="fr-skel w60" />
          <span className="fr-rcard-badge">9{depth}</span>
        </div>
      ))}
    </div>
  );
}
