import './css/DashboardHome.css';
import careerJourney from '../assets/career-journey.svg';
import { useAuth } from '../lib/auth/AuthContext';
import { useTheme } from '../lib/theme/ThemeContext';
import {
  computeStats,
  dueLabel,
  dueState,
  monthlyTrend,
} from '../lib/applications/applications';
import { isScanStale, scanScore, scoreColor } from '../lib/resume/scoreColor';

const TOP_NAV = [
  { id: 'dashboard', label: 'Home' },
  { id: 'applications', label: 'Applications' },
  { id: 'ats', label: 'Résumé & ATS' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'interview', label: 'Interview Prep' },
  { id: 'library', label: 'Library' },
  { id: 'resources', label: 'Resources' },
];

const RAIL_NAV = [
  { id: 'dashboard', label: 'Dashboard', mark: 'home' },
  { id: 'studio', label: 'Résumé Studio', mark: 'resume' },
  { id: 'ats', label: 'ATS Scan', mark: 'scan' },
  { id: 'applications', label: 'Applications', mark: 'case' },
  { id: 'portfolio', label: 'Portfolio', mark: 'portfolio' },
  { id: 'interview', label: 'Interview Prep', mark: 'interview' },
  { id: 'library', label: 'Résumé Library', mark: 'library' },
  { id: 'resources', label: 'Resources', mark: 'book' },
];

const BOARD_STAGES = [
  { id: 'applied', label: 'Applied', color: '#369af5' },
  { id: 'interviewing', label: 'Interview', color: '#6957ee' },
  { id: 'offer', label: 'Offer', color: '#27b77d' },
  { id: 'rejected', label: 'Rejected', color: '#e53448' },
];

const COMPANY_PALETTE = [
  ['#e1ecff', '#2259a8'],
  ['#e3f4e9', '#176144'],
  ['#f2e8ff', '#7440a6'],
  ['#fff0d9', '#a15a13'],
  ['#ffe4e8', '#a62f42'],
  ['#dff2f2', '#17636a'],
];

const TOOL_LINKS = [
  { id: 'ats', title: 'Résumé & ATS', copy: 'Strengthen every application', mark: 'scan' },
  { id: 'applications', title: 'Application Tracker', copy: 'Keep every opportunity together', mark: 'case' },
  { id: 'portfolio', title: 'Portfolio Builder', copy: 'Showcase your strongest work', mark: 'portfolio' },
  { id: 'interview', title: 'Interview Prep', copy: 'Practice with confidence', mark: 'interview' },
  { id: 'library', title: 'Résumé Library', copy: 'Organize tailored versions', mark: 'library' },
  { id: 'resources', title: 'Resources', copy: 'Guides for your next move', mark: 'book' },
];

const firstNameOf = (user) => (user?.name || 'there').trim().split(/\s+/)[0] || 'there';

const initialsOf = (name = '') => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join('') || 'A';

const shortDate = (iso) => {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const monthDay = (iso) => {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
  };
};

const companyStyle = (name = '') => {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [background, color] = COMPANY_PALETTE[seed % COMPANY_PALETTE.length];
  return { background, color };
};

function NavMark({ type }) {
  let drawing;
  switch (type) {
    case 'home':
      drawing = <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="13" y="3" width="6" height="6" rx="1" /><rect x="3" y="13" width="6" height="6" rx="1" /><rect x="13" y="13" width="6" height="6" rx="1" /></>;
      break;
    case 'resume':
      drawing = <><path d="M6 2.8h7l4 4V19H6z" /><path d="M13 2.8V7h4M8.5 11h6M8.5 14h6" /></>;
      break;
    case 'scan':
      drawing = <><path d="M4 8V4h4M14 4h4v4M18 14v4h-4M8 18H4v-4" /><path d="M7 11h8M9 8.5h4M9 13.5h4" /></>;
      break;
    case 'case':
      drawing = <><rect x="3" y="7" width="16" height="11" rx="2" /><path d="M8 7V4.5h6V7M3 11.5c4.5 2.2 11.5 2.2 16 0M10 12h2" /></>;
      break;
    case 'portfolio':
      drawing = <><rect x="3" y="4" width="16" height="14" rx="2" /><path d="M3 9h16M9 9v9M6 6.5h.01M12 12h4M12 15h3" /></>;
      break;
    case 'interview':
      drawing = <><path d="M4 12V9a7 7 0 0 1 14 0v3" /><rect x="3" y="11" width="4" height="7" rx="2" /><rect x="15" y="11" width="4" height="7" rx="2" /><path d="M15 18c-.7 1-1.8 1.5-3.2 1.5" /></>;
      break;
    case 'library':
      drawing = <><path d="M5 3h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" /><path d="M8 3v13M5 16h13" /></>;
      break;
    case 'book':
      drawing = <><path d="M3 4.5c3-.8 5.5 0 8 2.2v12c-2.5-2.2-5-3-8-2.2zM19 4.5c-3-.8-5.5 0-8 2.2v12c2.5-2.2 5-3 8-2.2z" /></>;
      break;
    case 'settings':
      drawing = <><circle cx="11" cy="11" r="3" /><path d="M11 2.5v2M11 17.5v2M2.5 11h2M17.5 11h2M5 5l1.4 1.4M15.6 15.6 17 17M17 5l-1.4 1.4M6.4 15.6 5 17" /></>;
      break;
    default:
      drawing = <path d="M4 11h14M11 4v14" />;
  }

  return (
    <svg className="dh-nav-mark" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {drawing}
    </svg>
  );
}

function ProductMark({ compact = false }) {
  return (
    <span className={`dh-product-mark${compact ? ' is-compact' : ''}`}>
      <span className="dh-product-triangle" />
      {!compact && <strong>DRAFTME</strong>}
    </span>
  );
}

function ThemeControl({ compact = false }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`dh-theme-control${compact ? ' is-compact' : ''}`}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="dh-theme-orbit"><i /></span>
      {!compact && <span>{isDark ? 'Light' : 'Theme'}</span>}
    </button>
  );
}

function UserAvatar({ user }) {
  return user?.avatar ? (
    <img className="dh-user-avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="dh-user-avatar dh-user-avatar-mono">{initialsOf(user?.name)}</span>
  );
}

function PremiumTopbar({ user, onNavigate }) {
  return (
    <header className="dh-topbar">
      <button type="button" className="dh-brand-button" onClick={() => onNavigate('dashboard')} aria-label="Dashboard home">
        <ProductMark />
      </button>
      <nav className="dh-topnav" aria-label="Workspace navigation">
        {TOP_NAV.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === 'dashboard' ? 'is-active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="dh-topbar-actions">
        <ThemeControl />
        <button type="button" className="dh-profile-button" onClick={() => onNavigate('settings')} aria-label="Open account settings">
          <UserAvatar user={user} />
        </button>
      </div>
    </header>
  );
}

function DashboardRail({ user, onNavigate }) {
  return (
    <aside className="dh-rail">
      <button type="button" className="dh-rail-brand" onClick={() => onNavigate('dashboard')} aria-label="Dashboard home">
        <ProductMark compact />
      </button>
      <nav className="dh-rail-nav" aria-label="Workspace navigation">
        {RAIL_NAV.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={index === 0 ? 'is-active' : ''}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            data-label={item.label}
          >
            <NavMark type={item.mark} />
          </button>
        ))}
      </nav>
      <div className="dh-rail-spacer" />
      <ThemeControl compact />
      <button type="button" className="dh-rail-settings" onClick={() => onNavigate('settings')} aria-label="Settings" data-label="Settings">
        <NavMark type="settings" />
      </button>
      <button type="button" className="dh-rail-profile" onClick={() => onNavigate('settings')} aria-label="Open account settings">
        <UserAvatar user={user} />
        <span className="dh-presence-dot" />
      </button>
    </aside>
  );
}

function ProgressRing({ value, label = 'complete', className = '' }) {
  return (
    <div className={`dh-progress-ring${className ? ` ${className}` : ''}`} style={{ '--dh-angle': `${value * 3.6}deg` }}>
      <div><strong>{value}%</strong><span>{label}</span></div>
    </div>
  );
}

function SetupRow({ step, index, onNavigate }) {
  return (
    <button type="button" className={`dh-setup-row${step.complete ? ' is-complete' : ''}`} onClick={() => onNavigate(step.destination)}>
      <span className="dh-setup-check">{step.complete ? '✓' : ''}</span>
      <span className={`dh-step-tile tone-${(index % 4) + 1}`}><NavMark type={step.mark} /></span>
      <span className="dh-setup-copy"><strong>{step.title}</strong><small>{step.description}</small></span>
      <span className="dh-row-arrow">→</span>
    </button>
  );
}

function QuoteCard() {
  return (
    <aside className="dh-quote-card">
      <img src={careerJourney} alt="" aria-hidden="true" />
      <span className="dh-quote-wash" />
      <blockquote>“Progress happens when you show up consistently.”</blockquote>
      <span className="dh-quote-rule" />
      <small>Tools today.<br />Opportunities tomorrow.</small>
    </aside>
  );
}

function SetupProgress({ setupSteps, readiness }) {
  return (
    <div className="dh-progress-stack">
      <section className="dh-reference-card dh-setup-progress-card">
        <h2>Your Setup Progress</h2>
        <div className="dh-setup-progress-layout">
          <ProgressRing value={readiness} label="" />
          <div className="dh-progress-legend">
            {setupSteps.map((step, index) => (
              <div key={step.title}><span className={step.complete ? 'is-complete' : ''} style={{ '--legend-tone': index }} /><small>{step.shortTitle}</small></div>
            ))}
          </div>
        </div>
      </section>
      <section className="dh-reference-card dh-why-card">
        <h2>Why this matters?</h2>
        <p>A focused workspace helps you track opportunities, tailor stronger résumés, and prepare for every next step.</p>
        <span />
        <small>You’ve got this.</small>
      </section>
    </div>
  );
}

function QuickToolCard({ tool, onNavigate }) {
  return (
    <button type="button" className="dh-quick-tool" onClick={() => onNavigate(tool.id)}>
      <NavMark type={tool.mark} />
      <strong>{tool.title}</strong>
      <span>{tool.copy}</span>
      <small>→</small>
    </button>
  );
}

function NewUserDashboard({ user, setupSteps, readiness, onNavigate }) {
  const completed = setupSteps.filter((step) => step.complete).length;
  return (
    <div className="dh-shell dh-onboarding-shell">
      <PremiumTopbar user={user} onNavigate={onNavigate} />
      <main className="dh-onboarding-main">
        <section className="dh-reference-hero">
          <div className="dh-reference-hero-copy">
            <span>Welcome, {firstNameOf(user)}</span>
            <h1>Let’s set up<br />your career workspace.</h1>
            <p>A few steps to personalize your experience and get the most out of the platform.</p>
          </div>
          <div className="dh-reference-hero-art">
            <img src={careerJourney} alt="Mountain journey from building career tools to preparing with confidence and growing a career" />
          </div>
        </section>

        <section className="dh-onboarding-grid">
          <div className="dh-reference-card dh-get-started-card">
            <div className="dh-card-heading">
              <div><h2>Get Started</h2><p>Complete these steps to build a focused career workspace.</p></div>
              <span>{completed} / {setupSteps.length} completed</span>
            </div>
            <div className="dh-setup-list">
              {setupSteps.map((step, index) => <SetupRow key={step.title} step={step} index={index} onNavigate={onNavigate} />)}
            </div>
          </div>
          <QuoteCard />
          <SetupProgress setupSteps={setupSteps} readiness={readiness} />
        </section>

        <section className="dh-quick-tools" aria-label="Workspace tools">
          {TOOL_LINKS.map((tool) => <QuickToolCard key={tool.id} tool={tool} onNavigate={onNavigate} />)}
        </section>

        <footer className="dh-reference-footer">
          <span>Build&nbsp;&nbsp;\&nbsp;&nbsp;Apply&nbsp;&nbsp;\&nbsp;&nbsp;Improve&nbsp;&nbsp;\&nbsp;&nbsp;Grow</span>
          <span><i />A better you, a brighter tomorrow.</span>
        </footer>
      </main>
    </div>
  );
}

function CompanyMark({ company }) {
  return <span className="dh-company-mark" style={companyStyle(company)}>{initialsOf(company).slice(0, 1)}</span>;
}

function PipelineCard({ application, onNavigate }) {
  return (
    <button type="button" className="dh-pipeline-card" onClick={() => onNavigate('applications')}>
      <CompanyMark company={application.company || 'Company'} />
      <span className="dh-pipeline-copy">
        <strong>{application.company || 'Company'}</strong>
        <small>{application.role || 'Role not set'}</small>
        <em>{shortDate(application.appliedAt || application.createdAt)}</em>
      </span>
      <span className="dh-more-mark">···</span>
    </button>
  );
}

function PipelinePanel({ applications, onNavigate }) {
  return (
    <section className="dh-active-card dh-pipeline-panel">
      <div className="dh-active-heading">
        <div><h2>Application Pipeline</h2><p>Track your applications and move forward.</p></div>
        <div><button type="button" className="dh-inline-link" onClick={() => onNavigate('applications')}>View all&nbsp;&nbsp;→</button><button type="button" className="dh-solid-action" onClick={() => onNavigate('applications')}><span>＋</span>Add Application</button></div>
      </div>
      <div className="dh-pipeline-board">
        {BOARD_STAGES.map((stage) => {
          const rows = applications.filter((application) => application.stage === stage.id);
          return (
            <div className="dh-pipeline-column" key={stage.id}>
              <div className="dh-column-heading"><span style={{ background: stage.color }} /><strong>{stage.label}</strong><small>{rows.length}</small></div>
              <div className="dh-column-body">
                {rows.slice(0, 3).map((application) => <PipelineCard key={application.id} application={application} onNavigate={onNavigate} />)}
                {rows.length === 0 && <button type="button" className="dh-column-empty" onClick={() => onNavigate('applications')}>No {stage.label.toLowerCase()} applications yet.<br /><strong>Add one →</strong></button>}
              </div>
              <button type="button" className="dh-column-add" onClick={() => onNavigate('applications')}>＋&nbsp;&nbsp;Add</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatsPanel({ applications, readiness, onNavigate }) {
  const stats = computeStats(applications);
  const trend = monthlyTrend(applications, 4);
  const maxTrend = Math.max(1, ...trend.map((point) => point.applications));
  const submitted = BOARD_STAGES.reduce((sum, stage) => sum + (stats.byStage[stage.id] || 0), 0);
  let cursor = 0;
  const gradients = [];
  BOARD_STAGES.forEach((stage) => {
    const count = stats.byStage[stage.id] || 0;
    const start = cursor;
    const end = submitted ? cursor + (count / submitted) * 100 : cursor;
    if (count) gradients.push(`${stage.color} ${start}% ${end}%`);
    cursor = end;
  });

  return (
    <section className="dh-active-card dh-stats-panel">
      <div className="dh-active-heading dh-stats-heading"><h2>Application Stats</h2><span>All time⌄</span></div>
      <div className="dh-stats-top">
        <div className="dh-stats-ring" style={{ background: submitted ? `conic-gradient(${gradients.join(',')})` : 'conic-gradient(#dbe2e5 0 100%)' }}><div><strong>{submitted}</strong><small>Total</small></div></div>
        <div className="dh-stats-legend">
          {BOARD_STAGES.map((stage) => <div key={stage.id}><span style={{ background: stage.color }} /><small>{stage.label}</small><strong>{stats.byStage[stage.id] || 0}</strong></div>)}
        </div>
      </div>
      <div className="dh-stats-bottom">
        <div className="dh-mini-chart">
          <div className="dh-mini-bars">
            {trend.map((point) => <div key={point.label}><span style={{ height: `${Math.max(8, (point.applications / maxTrend) * 100)}%` }} /><i style={{ height: `${Math.max(5, ((point.applications * 0.58) / maxTrend) * 100)}%` }} /><small>{point.label}</small></div>)}
          </div>
        </div>
        <div className="dh-completion-stat"><strong>{readiness}%</strong><span>Workspace<br />Completion</span><div><i style={{ width: `${readiness}%` }} /></div><button type="button" onClick={() => onNavigate('studio')}>Complete&nbsp;&nbsp;→</button></div>
      </div>
    </section>
  );
}

function ResumePanel({ resume, linkedApplications, onNavigate }) {
  const score = resume ? scanScore(resume) : null;
  const stale = resume ? isScanStale(resume) : false;
  const scoreValue = score || 0;
  const checks = [
    { label: resume ? 'Résumé saved to your workspace' : 'Create your first résumé', state: resume ? 'good' : '' },
    { label: score == null ? 'Run an ATS scan for role fit' : 'ATS scan completed', state: score == null ? '' : 'good' },
    { label: stale ? 'Refresh after your latest edits' : score == null ? 'Match keywords to a target role' : 'Scan matches the latest version', state: stale ? 'warn' : score == null ? '' : 'good' },
    { label: linkedApplications ? `Used in ${linkedApplications} application${linkedApplications === 1 ? '' : 's'}` : 'Link it to an application', state: linkedApplications ? 'good' : '' },
  ];

  return (
    <section className="dh-active-card dh-resume-panel">
      <div className="dh-active-heading"><div><h2>Résumé & ATS</h2><p>Make your résumé stronger. Land more interviews.</p></div></div>
      <div className="dh-resume-body">
        <div className="dh-resume-preview">
          <span>RÉSUMÉ</span>
          <strong>{resume?.role || 'Your next role'}</strong>
          <small>{resume ? 'Professional résumé' : 'Start with a focused profile'}</small>
          <i className="is-long" /><i /><i className="is-medium" />
          <em>EXPERIENCE</em>
          <i className="is-long" /><i className="is-medium" /><i />
        </div>
        <div className="dh-score-block">
          <div className="dh-score-ring" style={{ '--score-angle': `${scoreValue * 3.6}deg`, '--score-color': score == null ? '#cad3d0' : scoreColor(score) }}><div><strong>{score == null ? '—' : score}</strong><small>/ 100</small></div></div>
          <strong>{score == null ? 'Not scanned yet' : stale ? 'Refresh recommended' : score >= 80 ? 'Strong Match' : score >= 60 ? 'Good foundation' : 'Needs attention'}</strong>
          <span>{score == null ? 'Scan against a target role.' : stale ? 'Your résumé changed after this scan.' : 'Your score comes from your latest ATS scan.'}</span>
        </div>
        <div className="dh-resume-checks">
          {checks.map((check) => <div key={check.label} className={check.state ? `is-${check.state}` : ''}><span>{check.state === 'good' ? '✓' : check.state === 'warn' ? '!' : '·'}</span><small>{check.label}</small></div>)}
          <div className="dh-resume-buttons"><button type="button" className="dh-solid-action" onClick={() => onNavigate('ats')}>{score == null || stale ? 'Scan Résumé' : 'View Scan'}</button><button type="button" className="dh-outline-action" onClick={() => onNavigate('studio')}>Edit Résumé</button></div>
        </div>
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
    <section className="dh-active-card dh-upcoming-panel">
      <div className="dh-active-heading"><h2>Upcoming</h2><button type="button" className="dh-inline-link" onClick={() => onNavigate('applications')}>View all&nbsp;&nbsp;→</button></div>
      {upcoming.length ? <div className="dh-upcoming-list">
        {upcoming.map((application) => {
          const date = monthDay(application.nextStepDate);
          const state = dueState(application.nextStepDate);
          return <button type="button" key={application.id} className="dh-upcoming-row" onClick={() => onNavigate('applications')}><span className="dh-upcoming-date"><strong>{date.month} {date.day}</strong><small>{dueLabel(application.nextStepDate)}</small></span><span className={`dh-timeline-node${state ? ` is-${state}` : ''}`} /><span className="dh-upcoming-copy"><strong>{application.nextStep || (application.stage === 'interviewing' ? 'Interview' : 'Follow up')}</strong><small>{application.company || 'Company'} · {application.role || 'Role'}</small></span><CompanyMark company={application.company || 'Company'} /></button>;
        })}
      </div> : <div className="dh-upcoming-empty"><strong>Your schedule is clear.</strong><p>Add a next step to an application and it will appear here.</p><button type="button" className="dh-inline-link" onClick={() => onNavigate('applications')}>Open tracker&nbsp;&nbsp;→</button></div>}
    </section>
  );
}

function PortfolioPanel({ portfolioReady, onNavigate }) {
  const templates = ['Minimal', 'Modern', 'Editorial', 'Classic'];
  return (
    <section className="dh-active-card dh-portfolio-panel">
      <div className="dh-active-heading"><div><h2>Portfolio Builder</h2><p>Choose a direction and present your work with confidence.</p></div><button type="button" className="dh-inline-link" onClick={() => onNavigate('portfolio')}>Browse all&nbsp;&nbsp;→</button></div>
      <div className="dh-template-grid">
        {templates.map((template, index) => <button type="button" key={template} className={`dh-template-card template-${index + 1}${portfolioReady && index === 0 ? ' is-selected' : ''}`} onClick={() => onNavigate('portfolio')}><span><i /><i /><i /></span><strong>{template}</strong>{portfolioReady && index === 0 && <em>✓</em>}</button>)}
        <button type="button" className="dh-template-card dh-template-new" onClick={() => onNavigate('portfolio')}><span>＋</span><strong>Start from Scratch</strong></button>
      </div>
    </section>
  );
}

function WorkspacePanel({ readiness, onNavigate }) {
  const actions = [
    { label: 'Scan my résumé', id: 'ats', mark: 'scan' },
    { label: 'Add an application', id: 'applications', mark: 'case' },
    { label: 'Build my portfolio', id: 'portfolio', mark: 'portfolio' },
    { label: 'Open my library', id: 'library', mark: 'library' },
  ];
  return (
    <section className="dh-active-card dh-workspace-panel">
      <div className="dh-workspace-title"><span>{readiness}%</span><div><h2>Career Workspace</h2><p>Keep the essentials moving.</p></div></div>
      <div className="dh-workspace-actions">{actions.map((action) => <button type="button" key={action.id} onClick={() => onNavigate(action.id)}><NavMark type={action.mark} /><span>{action.label}</span><small>→</small></button>)}</div>
      <blockquote>“One focused action today makes the next opportunity easier.”</blockquote>
    </section>
  );
}

function ActiveUserDashboard({ user, applications, activeResume, readiness, portfolioReady, onNavigate }) {
  const linkedApplications = activeResume ? applications.filter((application) => application.resumeId === activeResume.id).length : 0;
  return (
    <div className="dh-shell dh-active-shell">
      <DashboardRail user={user} onNavigate={onNavigate} />
      <main className="dh-active-main">
        <div className="dh-active-grid">
          <PipelinePanel applications={applications} onNavigate={onNavigate} />
          <StatsPanel applications={applications} readiness={readiness} onNavigate={onNavigate} />
          <ResumePanel resume={activeResume} linkedApplications={linkedApplications} onNavigate={onNavigate} />
          <UpcomingPanel applications={applications} onNavigate={onNavigate} />
          <PortfolioPanel portfolioReady={portfolioReady} onNavigate={onNavigate} />
          <WorkspacePanel readiness={readiness} onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
}

export default function DashboardHome({ resumes = [], applications = [], portfolioReady = false, onNavigate }) {
  const { user } = useAuth();
  const activeResume = resumes.find((resume) => resume.isActive) || resumes[0] || null;
  const hasScannedResume = resumes.some((resume) => scanScore(resume) !== null);
  const hasNextStep = applications.some((application) => application.nextStepDate);
  const setupSteps = [
    { shortTitle: 'Résumé', title: 'Create or Upload Your Résumé', description: 'Build a strong base résumé for the roles you want.', complete: resumes.length > 0, destination: 'studio', mark: 'resume' },
    { shortTitle: 'Applications', title: 'Add Your First Application', description: 'Start tracking every opportunity in one place.', complete: applications.length > 0, destination: 'applications', mark: 'case' },
    { shortTitle: 'Portfolio', title: 'Build Your Portfolio', description: 'Showcase your work with a focused presentation.', complete: portfolioReady, destination: 'portfolio', mark: 'portfolio' },
    { shortTitle: 'ATS scan', title: 'Run an ATS Scan', description: 'Check your résumé against a real target role.', complete: hasScannedResume, destination: 'ats', mark: 'scan' },
    { shortTitle: 'Next step', title: 'Schedule Your Next Step', description: 'Stay ahead of interviews and follow-ups.', complete: hasNextStep, destination: 'applications', mark: 'interview' },
  ];
  const readiness = Math.round((setupSteps.filter((step) => step.complete).length / setupSteps.length) * 100);
  const isNewUser = resumes.length === 0 && applications.length === 0 && !portfolioReady;

  if (isNewUser) return <NewUserDashboard user={user} setupSteps={setupSteps} readiness={readiness} onNavigate={onNavigate} />;
  return <ActiveUserDashboard user={user} applications={applications} activeResume={activeResume} readiness={readiness} portfolioReady={portfolioReady} onNavigate={onNavigate} />;
}
