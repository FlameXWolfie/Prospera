import './css/BoostBanner.css';
import { Wand2, ArrowRight, FilePlus2, ScanLine, Sparkles } from 'lucide-react';
import { scanScore } from '../../lib/resume/scoreColor';

const scoreLabel = (s) => (s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Fair' : 'Needs work');

// Reflects the user's active (or most recent) resume score — but only once it's
// actually been scanned. Unscanned → a "scan to get your score" prompt, never a
// fake number. With no resumes at all it becomes a "create your first resume" prompt.
export default function BoostBanner({ resume, onImprove, onCreate, onScan }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  // Empty workspace — quiet CTA, no fake score art.
  if (!resume) {
    return (
      <section className="card-widget boost-banner-card is-empty">
        <div className="boost-empty">
          <div className="boost-empty-copy">
            <span className="boost-eyebrow">
              <Sparkles size={13} />
              Get started
            </span>
            <h2 className="boost-title">Start with your first resume</h2>
            <p className="boost-desc">
              Build an ATS-ready resume in the Studio, then scan it for a real match score.
            </p>
            <button type="button" className="boost-btn" onClick={onCreate}>
              <FilePlus2 size={15} />
              <span>Create resume</span>
            </button>
          </div>
          <div className="boost-empty-visual" aria-hidden="true">
            <div className="boost-empty-doc">
              <span className="boost-empty-line w-sm" />
              <span className="boost-empty-line w-lg" />
              <span className="boost-empty-line w-md" />
              <span className="boost-empty-line w-lg" />
              <span className="boost-empty-line w-sm" />
              <span className="boost-empty-chip" />
            </div>
            <div className="boost-empty-orb" />
          </div>
        </div>
      </section>
    );
  }

  const score = scanScore(resume); // null until a real ATS scan
  const scanned = score !== null;
  const strokeDashoffset = circumference - ((scanned ? score : 0) / 100) * circumference;
  const optimized = scanned && score >= 85;

  return (
    <section className="card-widget boost-banner-card">
      <div className="boost-content-wrapper">
        <div className="boost-left">
          <div className="boost-copy">
            <h2 className="boost-title">
              {!scanned ? <>See how your resume scores</> : optimized ? <>Your resume is recruiter-ready</> : <>Your resume needs a boost</>}
            </h2>
            <p className="boost-desc">
              {!scanned
                ? 'Scan your resume against a role to get your real ATS match score.'
                : optimized
                  ? 'Strong score. Keep it sharp and tailor it for each role.'
                  : 'Improve your resume score and stand out to recruiters.'}
            </p>
          </div>

          <div className="boost-actions">
            <button type="button" className="boost-btn" onClick={!scanned ? onScan : onImprove}>
              {!scanned ? <ScanLine size={14} /> : <Wand2 size={14} />}
              <span>{!scanned ? 'Scan resume' : optimized ? 'Fine-tune' : 'Improve now'}</span>
            </button>
            <button
              type="button"
              className="boost-report-link"
              onClick={() => (!scanned ? onScan : onImprove)?.()}
            >
              <span>{!scanned ? 'Open ATS Scanner' : 'Open in Studio'}</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="boost-right">
          <div className="boost-gauge-visual">
            <svg className="boost-gauge-svg" viewBox="0 0 90 90" aria-hidden="true">
              <circle cx="45" cy="45" r={radius} className="boost-gauge-bg" />
              {scanned && (
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="boost-gauge-fill"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              )}
            </svg>
            <div className="boost-gauge-text">
              <span className="boost-gauge-score">{scanned ? score : '–'}</span>
              <div className="boost-gauge-label">{scanned ? scoreLabel(score) : 'Not scanned'}</div>
            </div>
          </div>
          <div className="boost-art-container">
            <img src="/assets/resume_boost_art.webp" alt="" className="boost-art-img" />
          </div>
        </div>
      </div>
    </section>
  );
}
