import { useState } from 'react';
import './css/DashboardHome.css';
import careerJourney from '../assets/career-journey.svg';
import { useAuth } from '../lib/auth/AuthContext';
import {
  computeStats,
  dueLabel,
  dueState,
  monthlyTrend,
  relativeDate,
} from '../lib/applications/applications';
import { isScanStale, scanScore, scoreColor } from '../lib/resume/scoreColor';

const BOARD_STAGES = [
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interviewing', label: 'Interview', color: '#7c3aed' },
  { id: 'offer', label: 'Offer', color: '#059669' },
  { id: 'rejected', label: 'Closed', color: '#dc5263' },
];

const MONOGRAM_PALETTE = [
  ['#dce7ff', '#234ea5'],
  ['#e2f5ed', '#176847'],
  ['#f4e6ff', '#7041a3'],
  ['#fff0db', '#915b18'],
  ['#ffe5e8', '#9b3342'],
  ['#dff2f4', '#22666f'],
];

const NOW = new Date();
const DATE_LABEL = NOW.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const GREETING = NOW.getHours() < 12 ? 'Good morning' : NOW.getHours() < 17 ? 'Good afternoon' : 'Good evening';

const firstNameOf = (user) => (user?.name || 'there').trim().split(/\s+/)[0] || 'there';

const monogramStyle = (name = '') => {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [background, color] = MONOGRAM_PALETTE[seed % MONOGRAM_PALETTE.length];
  return { background, color };
};

const shortDate = (iso) => {
  if (!iso) return 'Recently updated';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const monthDay = (iso) => {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
  };
};

function SetupRow({ index, title, description, complete, onClick }) {
  return (
    <button type="button" className={`dh-setup-row${complete ? ' is-complete' : ''}`} onClick={onClick}>
      <span className="dh-setup-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="dh-setup-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="dh-setup-state">{complete ? 'Done' : 'Start →'}</span>
    </button>
  );
}

function ReadinessRing({ value, label = 'ready' }) {
  return (
    <div className="dh-readiness-ring" style={{ '--dh-progress': `${value * 3.6}deg` }}>
      <div className="dh-readiness-ring-inner">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function NewUserDashboard({ firstName, setupSteps, readiness, onNavigate }) {
  return (
    <div className="dh-root dh-new-user">
      <header className="dh-new-header">
        <div>
          <span className="dh-kicker">Welcome, {firstName}</span>
          <h1>Let’s set up your career workspace.</h1>
          <p>Three focused steps. Everything else can wait.</p>
        </div>
        <button type="button" className="dh-primary-button" onClick={() => onNavigate('studio')}>
          Create your résumé
        </button>
      </header>

      <figure className="dh-journey-art">
        <img
          src={careerJourney}
          alt="An illustrated mountain path from building career tools to preparing with confidence and growing a career"
        />
      </figure>

      <div className="dh-onboarding-grid">
        <section className="dh-panel dh-setup-panel">
          <div className="dh-section-heading">
            <div>
              <span className="dh-section-label">Get started</span>
              <h2>Build your foundation</h2>
            </div>
            <span className="dh-section-count">{setupSteps.filter((step) => step.complete).length} / {setupSteps.length}</span>
          </div>

          <div className="dh-setup-list">
            {setupSteps.map((step, index) => (
              <SetupRow
                key={step.title}
                index={index}
                title={step.title}
                description={step.description}
                complete={step.complete}
                onClick={() => onNavigate(step.destination)}
              />
            ))}
          </div>
        </section>

        <aside className="dh-panel dh-progress-panel">
          <span className="dh-section-label">Workspace readiness</span>
          <ReadinessRing value={readiness} label="complete" />
          <div className="dh-progress-legend">
            {setupSteps.map((step) => (
              <div key={step.title}>
                <span className={step.complete ? 'is-complete' : ''} />
                {step.shortTitle}
              </div>
            ))}
          </div>
          <p>Complete only what helps you make the next move. You can return here anytime.</p>
        </aside>
      </div>
    </div>
  );
}

function ApplicationCard({ application, onOpen }) {
  const company = application.company || 'Company';
  const initial = company.charAt(0).toUpperCase();

  return (
    <button type="button" className="dh-application-card" onClick={onOpen}>
      <span className="dh-company-mark" style={monogramStyle(company)}>{initial}</span>
      <span className="dh-application-copy">
        <strong>{company}</strong>
        <span>{application.role || 'Role not set'}</span>
        <small>{relativeDate(application.appliedAt || application.createdAt)}</small>
      </span>
      <span className="dh-card-arrow">→</span>
    </button>
  );
}

function PipelinePanel({ applications, savedCount, onNavigate }) {
  return (
    <section className="dh-panel dh-pipeline-panel">
      <div className="dh-section-heading">
        <div>
          <span className="dh-section-label">Application pipeline</span>
          <h2>Move opportunities forward</h2>
        </div>
        <div className="dh-heading-actions">
          {savedCount > 0 && <span>{savedCount} saved</span>}
          <button type="button" className="dh-text-button" onClick={() => onNavigate('applications')}>View tracker →</button>
        </div>
      </div>

      <div className="dh-pipeline-board">
        {BOARD_STAGES.map((stage) => {
          const stageApplications = applications.filter((application) => application.stage === stage.id);
          return (
            <div className="dh-stage-column" key={stage.id}>
              <div className="dh-stage-heading">
                <span className="dh-stage-dot" style={{ background: stage.color }} />
                <strong>{stage.label}</strong>
                <span>{stageApplications.length}</span>
              </div>
              <div className="dh-stage-list">
                {stageApplications.slice(0, 3).map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onOpen={() => onNavigate('applications')}
                  />
                ))}
                {stageApplications.length === 0 && (
                  <button type="button" className="dh-stage-empty" onClick={() => onNavigate('applications')}>
                    No {stage.label.toLowerCase()} applications
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApplicationRing({ stats }) {
  const segments = [
    { count: stats.byStage.applied, color: '#3b82f6' },
    { count: stats.byStage.interviewing, color: '#7c3aed' },
    { count: stats.byStage.offer, color: '#059669' },
    { count: stats.byStage.rejected, color: '#dc5263' },
  ];
  const submitted = segments.reduce((sum, segment) => sum + segment.count, 0);
  let cursor = 0;
  const gradientParts = [];

  segments.forEach((segment) => {
    const start = cursor;
    const end = submitted ? cursor + (segment.count / submitted) * 100 : cursor;
    if (segment.count) gradientParts.push(`${segment.color} ${start}% ${end}%`);
    cursor = end;
  });

  const background = submitted
    ? `conic-gradient(${gradientParts.join(', ')})`
    : 'conic-gradient(var(--border-dark) 0 100%)';

  return (
    <div className="dh-application-ring" style={{ background }}>
      <div>
        <strong>{submitted}</strong>
        <span>submitted</span>
      </div>
    </div>
  );
}

function StatsPanel({ applications, readiness }) {
  const stats = computeStats(applications);
  const trend = monthlyTrend(applications, 4);
  const maxTrend = Math.max(1, ...trend.map((point) => point.applications));

  return (
    <section className="dh-panel dh-stats-panel">
      <div className="dh-section-heading">
        <div>
          <span className="dh-section-label">Application stats</span>
          <h2>Current cycle</h2>
        </div>
      </div>

      <div className="dh-stats-overview">
        <ApplicationRing stats={stats} />
        <div className="dh-stats-legend">
          {BOARD_STAGES.map((stage) => (
            <div key={stage.id}>
              <span style={{ background: stage.color }} />
              <small>{stage.label}</small>
              <strong>{stats.byStage[stage.id]}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="dh-trend">
        <div className="dh-trend-heading">
          <span>Applications</span>
          <strong>{stats.responseRate == null ? 'No response rate yet' : `${stats.responseRate}% response rate`}</strong>
        </div>
        <div className="dh-trend-bars">
          {trend.map((point) => (
            <div key={point.label}>
              <span style={{ height: `${Math.max(4, (point.applications / maxTrend) * 100)}%` }} />
              <small>{point.label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="dh-readiness-line">
        <div>
          <span>Workspace readiness</span>
          <strong>{readiness}%</strong>
        </div>
        <div><span style={{ width: `${readiness}%` }} /></div>
      </div>
    </section>
  );
}

function ResumePanel({ resume, linkedApplications, firstName, onNavigate }) {
  if (!resume) {
    return (
      <section className="dh-panel dh-resume-panel dh-resume-empty">
        <div>
          <span className="dh-section-label">Résumé & ATS</span>
          <h2>Your strongest application starts here.</h2>
          <p>Create one focused résumé, then scan it against the role you want.</p>
        </div>
        <button type="button" className="dh-primary-button" onClick={() => onNavigate('studio')}>Create résumé</button>
      </section>
    );
  }

  const score = scanScore(resume);
  const stale = isScanStale(resume);
  const scoreValue = score ?? 0;
  const scoreStyle = {
    '--dh-score-progress': `${scoreValue * 3.6}deg`,
    '--dh-score-color': score == null ? 'var(--border-strong)' : scoreColor(score),
  };

  return (
    <section className="dh-panel dh-resume-panel">
      <div className="dh-section-heading">
        <div>
          <span className="dh-section-label">Résumé & ATS</span>
          <h2>{resume.role || 'Your active résumé'}</h2>
        </div>
        <button type="button" className="dh-text-button" onClick={() => onNavigate('library')}>View library →</button>
      </div>

      <div className="dh-resume-layout">
        <div className="dh-resume-sheet" aria-hidden="true">
          <span className="dh-resume-sheet-kicker">Résumé</span>
          <strong>{firstName}</strong>
          <small>{resume.role || 'Professional profile'}</small>
          <span className="dh-sheet-rule is-wide" />
          <span className="dh-sheet-rule" />
          <span className="dh-sheet-rule is-medium" />
          <span className="dh-sheet-label">Experience</span>
          <span className="dh-sheet-rule is-wide" />
          <span className="dh-sheet-rule is-medium" />
        </div>

        <div className="dh-resume-score" style={scoreStyle}>
          <div>
            <strong>{score == null ? '—' : score}</strong>
            <span>{score == null ? 'Not scanned' : stale ? 'Needs refresh' : 'ATS score'}</span>
          </div>
        </div>

        <div className="dh-resume-facts">
          <div className={resume.isActive ? 'is-positive' : ''}>
            <span />
            <p><strong>{resume.isActive ? 'Primary résumé' : 'Most recent résumé'}</strong><small>Updated {shortDate(resume.lastAppended || resume.updatedAt)}</small></p>
          </div>
          <div className={score != null && !stale ? 'is-positive' : stale ? 'is-warning' : ''}>
            <span />
            <p><strong>{score == null ? 'ATS scan not run' : stale ? 'Edited since last scan' : 'ATS scan is current'}</strong><small>{score == null ? 'Scan against a target role' : stale ? 'Refresh the result before applying' : 'Score is based on a real scan'}</small></p>
          </div>
          <div className={linkedApplications > 0 ? 'is-positive' : ''}>
            <span />
            <p><strong>{linkedApplications} linked application{linkedApplications === 1 ? '' : 's'}</strong><small>Using this résumé in your tracker</small></p>
          </div>
        </div>
      </div>

      <div className="dh-resume-actions">
        <button type="button" className="dh-primary-button" onClick={() => onNavigate(score == null || stale ? 'ats' : 'studio')}>
          {score == null ? 'Scan résumé' : stale ? 'Re-scan résumé' : 'Open in Studio'}
        </button>
        <button type="button" className="dh-secondary-button" onClick={() => onNavigate('studio')}>Edit résumé</button>
      </div>
    </section>
  );
}

function UpcomingPanel({ applications, onNavigate }) {
  const upcoming = applications
    .filter((application) => application.nextStepDate && !['offer', 'rejected'].includes(application.stage))
    .sort((left, right) => new Date(left.nextStepDate) - new Date(right.nextStepDate))
    .slice(0, 4);

  return (
    <section className="dh-panel dh-upcoming-panel">
      <div className="dh-section-heading">
        <div>
          <span className="dh-section-label">Upcoming</span>
          <h2>Next steps</h2>
        </div>
        <button type="button" className="dh-text-button" onClick={() => onNavigate('applications')}>View all →</button>
      </div>

      {upcoming.length ? (
        <div className="dh-timeline">
          {upcoming.map((application) => {
            const date = monthDay(application.nextStepDate);
            const state = dueState(application.nextStepDate);
            return (
              <button type="button" className="dh-timeline-row" key={application.id} onClick={() => onNavigate('applications')}>
                <span className="dh-timeline-date"><small>{date.month}</small><strong>{date.day}</strong></span>
                <span className="dh-timeline-line"><i className={state ? `is-${state}` : ''} /></span>
                <span className="dh-timeline-copy">
                  <strong>{application.nextStep || (application.stage === 'interviewing' ? 'Interview' : 'Follow up')}</strong>
                  <span>{application.company || 'Company'} · {application.role || 'Role'}</span>
                  <small>{dueLabel(application.nextStepDate)}</small>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="dh-compact-empty">
          <strong>Your schedule is clear.</strong>
          <p>Add a next step to an application and it will appear here.</p>
          <button type="button" className="dh-text-button" onClick={() => onNavigate('applications')}>Open applications →</button>
        </div>
      )}
    </section>
  );
}

export default function DashboardHome({ resumes = [], applications = [], onNavigate }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const firstName = firstNameOf(user);
  const activeResume = resumes.find((resume) => resume.isActive) || resumes[0] || null;
  const hasScannedResume = resumes.some((resume) => scanScore(resume) !== null);
  const setupSteps = [
    {
      shortTitle: 'Résumé',
      title: 'Create or upload your résumé',
      description: 'Build a focused base résumé in the Studio.',
      complete: resumes.length > 0,
      destination: 'studio',
    },
    {
      shortTitle: 'ATS scan',
      title: 'Run your first ATS scan',
      description: 'Check the résumé against a real target role.',
      complete: hasScannedResume,
      destination: 'ats',
    },
    {
      shortTitle: 'Applications',
      title: 'Track your first application',
      description: 'Keep the opportunity and next step in one place.',
      complete: applications.length > 0,
      destination: 'applications',
    },
  ];
  const readiness = Math.round((setupSteps.filter((step) => step.complete).length / setupSteps.length) * 100);
  const isNewUser = resumes.length === 0 && applications.length === 0;

  if (isNewUser) {
    return (
      <NewUserDashboard
        firstName={firstName}
        setupSteps={setupSteps}
        readiness={readiness}
        onNavigate={onNavigate}
      />
    );
  }

  const query = searchTerm.trim().toLowerCase();
  const visibleApplications = query
    ? applications.filter((application) => [application.company, application.role, application.stage]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query))
    : applications;
  const savedCount = applications.filter((application) => application.stage === 'saved').length;
  const linkedApplications = activeResume
    ? applications.filter((application) => application.resumeId === activeResume.id).length
    : 0;

  return (
    <div className="dh-root dh-active-user">
      <header className="dh-active-header">
        <div>
          <span className="dh-kicker">{DATE_LABEL}</span>
          <h1>{GREETING}, {firstName}.</h1>
          <p>Here’s what is moving and what needs your attention.</p>
        </div>
        <div className="dh-active-actions">
          <label className="dh-search-field">
            <span>Search applications</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search applications"
            />
          </label>
          <button type="button" className="dh-secondary-button" onClick={() => onNavigate('applications')}>Add application</button>
          <button type="button" className="dh-primary-button" onClick={() => onNavigate('studio')}>New résumé</button>
        </div>
      </header>

      <div className="dh-active-grid">
        <PipelinePanel applications={visibleApplications} savedCount={savedCount} onNavigate={onNavigate} />
        <StatsPanel applications={applications} readiness={readiness} />
        <ResumePanel
          resume={activeResume}
          linkedApplications={linkedApplications}
          firstName={firstName}
          onNavigate={onNavigate}
        />
        <UpcomingPanel applications={applications} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
