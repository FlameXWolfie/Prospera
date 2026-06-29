import './css/InterviewsList.css';
import { Calendar, ClipboardList, CalendarClock } from 'lucide-react';
import { dueState, dueLabel } from '../../lib/applications/applications';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const initials = (name) => (name || '?').trim().slice(0, 2).toUpperCase();
const badgeClassFor = (s) => (s === 'later' ? 'badge-info-soft' : 'badge-purple-soft');

// Derives upcoming interviews straight from the application tracker: anything in
// the 'interviewing' stage that has a scheduled next step, soonest first.
export default function InterviewsList({ applications = [], onViewAll }) {
  const upcoming = applications
    .filter((a) => a.stage === 'interviewing' && a.nextStepDate)
    .sort((x, y) => new Date(x.nextStepDate) - new Date(y.nextStepDate))
    .slice(0, 4);

  return (
    <section className="card-widget interviews-card">
      <div className="card-header-row">
        <h2 className="card-title">Upcoming Interviews</h2>
        <a href="#interviews" className="card-link" onClick={(e) => { e.preventDefault(); onViewAll?.(); }}>
          View All
        </a>
      </div>

      {upcoming.length === 0 ? (
        <div className="widget-empty">
          <CalendarClock size={26} color="#c7cbf5" />
          <p>No interviews scheduled. Move an application to the Interviewing stage and add a next-step date.</p>
        </div>
      ) : (
        <div className="interviews-list">
          {upcoming.map((item) => {
            const ds = dueState(item.nextStepDate);
            return (
              <div key={item.id} className="interview-item">
                <div className="interview-company-info">
                  <div className="company-logo-box">
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)' }}>{initials(item.company)}</span>
                  </div>
                  <div className="interview-details">
                    <span className="company-name">{item.company || 'Company'}</span>
                    <span className="role-title">{item.role || 'Role'}</span>
                    <div className="interview-schedule-info">
                      <Calendar size={11} />
                      <span>{fmtDate(item.nextStepDate)}</span>
                      {item.nextStep && (
                        <>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <ClipboardList size={11} />
                          <span>{item.nextStep}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`interview-time-badge ${badgeClassFor(ds)}`}
                  style={ds === 'overdue' ? { color: 'var(--danger-text)', background: 'var(--danger-bg)' } : undefined}
                >
                  {dueLabel(item.nextStepDate)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
