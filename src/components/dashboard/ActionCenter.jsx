import './css/ActionCenter.css';
import { AlertTriangle, CheckCircle2, Calendar, TrendingUp, ScanLine, ChevronRight, Sparkles } from 'lucide-react';
import { dueState, dueLabel } from '../../lib/applications/applications';
import { scanScore, isScanStale } from '../../lib/resume/scoreColor';

// Real, prioritised insights derived from the user's own resumes + applications.
// Priority order: overdue follow-ups → offers → imminent interviews → weak resumes.
function buildInsights(resumes, applications) {
  const out = [];

  applications.forEach((a) => {
    if (dueState(a.nextStepDate) === 'overdue') {
      out.push({
        priority: 0,
        title: `Follow-up overdue: ${a.company || 'application'}`,
        desc: a.nextStep || 'Set the next step for this application.',
        icon: AlertTriangle, color: '#f59e0b', bgColor: '#fffbeb', tab: 'applications',
      });
    }
  });

  applications.forEach((a) => {
    if (a.stage === 'offer') {
      out.push({
        priority: 1,
        title: `You have an offer from ${a.company || 'a company'}`,
        desc: `${a.role || 'Role'} — review the details and respond.`,
        icon: CheckCircle2, color: '#10b981', bgColor: '#ecfdf5', tab: 'applications',
      });
    }
  });

  applications.forEach((a) => {
    if (a.stage === 'interviewing' && dueState(a.nextStepDate) === 'soon') {
      out.push({
        priority: 2,
        title: `Interview coming up at ${a.company || 'a company'}`,
        desc: `${a.role || 'Role'}${a.nextStepDate ? ` — ${dueLabel(a.nextStepDate)}` : ''}.`,
        icon: Calendar, color: '#8b5cf6', bgColor: '#f5f3ff', tab: 'applications',
      });
    }
  });

  resumes.forEach((r) => {
    const sc = scanScore(r);
    if (sc !== null && sc < 80) {
      out.push({
        priority: 3,
        title: `ATS score below 80 on ${r.role}`,
        desc: `Currently ${sc}. Enhance it to lift the score past 80.`,
        icon: TrendingUp, color: '#3b82f6', bgColor: '#eff6ff', tab: 'studio',
      });
    }
  });

  resumes.forEach((r) => {
    if (isScanStale(r)) {
      out.push({
        priority: 3,
        title: `Re-scan ${r.role} — edited since last scan`,
        desc: 'Its ATS score is out of date. Run a quick scan to refresh it.',
        icon: ScanLine, color: '#d97706', bgColor: '#fffbeb', tab: 'ats',
      });
    }
  });

  // Nudge to actually scan the active resume when it has no real score yet.
  const activeUnscanned = resumes.find((r) => r.isActive && scanScore(r) === null);
  if (activeUnscanned) {
    out.push({
      priority: 4,
      title: `Scan ${activeUnscanned.role} to get its ATS score`,
      desc: 'See how your active resume matches a target role.',
      icon: ScanLine, color: '#6366f1', bgColor: '#eef2ff', tab: 'ats',
    });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export default function ActionCenter({ resumes = [], applications = [], onNavigate }) {
  const actions = buildInsights(resumes, applications);

  return (
    <section className="card-widget action-center-card">
      <div className="card-header-row" style={{ marginBottom: '8px' }}>
        <h2 className="card-title">✨ AI Action Center</h2>
      </div>
      <div className="action-center-subtitle">
        Personalized insights to move your career forward.
      </div>

      {actions.length === 0 ? (
        <div className="widget-empty">
          <Sparkles size={26} color="#c7cbf5" />
          <p>No insights yet. Add resumes and applications and we will surface what needs your attention.</p>
        </div>
      ) : (
        <div className="action-items-list">
          {actions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="action-item" onClick={() => onNavigate?.(item.tab)}>
                <div className="action-icon-wrapper" style={{ backgroundColor: item.bgColor }}>
                  <Icon size={18} color={item.color} />
                </div>
                <div className="action-info">
                  <div className="action-title">{item.title}</div>
                  <div className="action-desc">{item.desc}</div>
                </div>
                <ChevronRight size={14} className="action-arrow" />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
