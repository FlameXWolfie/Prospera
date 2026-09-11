import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import {
  Plus, Search, X, List, LayoutGrid, Table2, MoreVertical, MapPin, DollarSign,
  Star, FileText, Globe, Pencil, Trash2, Clock, Send, ArrowRight,
  CalendarClock, Archive, BriefcaseBusiness, Link2,
} from 'lucide-react';
import { scanRoleProfile, profileForResume } from '../lib/resume/atsKeywords';
import { scoreColor, scanScore, isScanStale } from '../lib/resume/scoreColor';
import {
  STAGES, STAGE_BY_ID, formatSalary, dueState, dueLabel, relativeDate,
  computeStats, stageAggregate, filterSort,
} from '../lib/applications/applications';
import ResumeDocument from '../components/dashboard/ResumeDocument';
import './css/ApplicationsPage.css';

/* ── helpers (module scope; Date math stays out of render) ──────────────────── */

const MONO = [
  ['#eef2ff', '#363ff5'], ['#ecfeff', '#0891b2'], ['#f5f3ff', '#8b5cf6'],
  ['#fffbeb', '#d97706'], ['#fdf2f8', '#db2777'], ['#ecfdf5', '#059669'],
  ['#eff6ff', '#3b82f6'], ['#fef2f2', '#dc2626'],
];

const ACTIVE_STAGES = STAGES.filter((stage) => stage.id !== 'rejected');
const NEXT_STAGE = {
  saved: { id: 'applied', label: 'Mark applied', hint: 'Sets today as the applied date and schedules a 7-day follow-up.' },
  applied: { id: 'interviewing', label: 'Move to interview' },
  interviewing: { id: 'offer', label: 'Record offer' },
};

function mono(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MONO[h % MONO.length];
}
function toDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
function fromDateInput(v) {
  return v ? new Date(`${v}T12:00:00`).toISOString() : null;
}

// shared focus trap (Esc to close, Tab cycles) — mirrors the Library drawer
function useFocusTrap(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const node = ref.current;
    const prev = document.activeElement;
    const focusables = () => (node
      ? Array.from(node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null)
      : []);
    (focusables()[0] || node)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) { e.preventDefault(); return; }
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return ref;
}

/* ── primitives ─────────────────────────────────────────────────────────────── */

function OverflowMenu({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="at-menu" ref={ref}>
      <button type="button" className="at-menu-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <MoreVertical size={16} />
      </button>
      {open && <div className="at-menu-list" role="menu" onClick={(e) => e.stopPropagation()}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/* ── application card (board + drawer preview) ─────────────────────────────── */

function ApplicationCard({ app, resume, dragging, preview, onDragStart, onDragEnd, onOpen, onMove, onEdit, onDelete }) {
  const [bg, fg] = mono(app.company || '?');
  const sal = formatSalary(app.salaryMin, app.salaryMax);
  const dState = dueState(app.nextStepDate);
  const nextStage = NEXT_STAGE[app.stage];
  const hasDeadline = Boolean(app.nextStepDate);

  return (
    <article
      className={`at-card${preview ? ' preview' : ''}${dragging ? ' dragging' : ''}`}
      draggable={!preview}
      role={preview ? undefined : 'button'}
      tabIndex={preview ? undefined : 0}
      aria-label={preview ? undefined : `${app.company}, ${app.role}, open details`}
      onDragStart={preview ? undefined : onDragStart}
      onDragEnd={preview ? undefined : onDragEnd}
      onClick={preview ? undefined : onOpen}
      onKeyDown={preview ? undefined : (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(); }
      }}
    >
      <div className="at-card-top">
        <span className="at-monogram" style={{ background: bg, color: fg }}>{(app.company || '?').charAt(0).toUpperCase()}</span>
        <div className="at-card-titles">
          <div className="at-card-company" title={app.company}>{app.company}</div>
          <h3 className="at-card-role" title={app.role}>{app.role}</h3>
        </div>
        {!preview && (
          <div className="at-card-actions">
            <OverflowMenu label={`Actions for ${app.company}`}>
              {(close) => (
                <>
                  <button type="button" className="at-menu-item" onClick={() => { close(); onEdit(); }}><Pencil size={14} /> Edit details</button>
                  {app.url && (
                    <a className="at-menu-item" href={app.url} target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); close(); }}><Globe size={14} /> Open posting</a>
                  )}
                  <div className="at-menu-sep" />
                  <div className="at-menu-label">Move to</div>
                  {STAGES.filter((s) => s.id !== app.stage).map((s) => (
                    <button key={s.id} type="button" className="at-menu-item" onClick={() => { close(); onMove(s.id); }}>
                      <span className="at-menu-swatch" style={{ background: s.color }} /> {s.label}
                    </button>
                  ))}
                  <div className="at-menu-sep" />
                  <button type="button" className="at-menu-item danger" onClick={() => { close(); onDelete(); }}><Trash2 size={14} /> Delete</button>
                </>
              )}
            </OverflowMenu>
          </div>
        )}
      </div>

      <div className="at-card-meta">
        {app.location && <span className="at-meta"><MapPin size={11} /> {app.location}</span>}
        {sal && <span className="at-meta"><DollarSign size={11} /> {sal}</span>}
        <span className="at-meta"><Clock size={11} /> {relativeDate(app.appliedAt)}</span>
      </div>

      {hasDeadline ? (
        <div className={`at-next ${dState || 'later'}`}>
          <Clock size={11} />
          <span className="at-next-label">{app.nextStep || 'Next step'}</span>
          {app.nextStep && <span style={{ flexShrink: 0, opacity: 0.85 }}>· {dueLabel(app.nextStepDate)}</span>}
        </div>
      ) : !preview && app.stage !== 'offer' && app.stage !== 'rejected' ? (
        <button type="button" className="at-next at-next-missing" onClick={(event) => { event.stopPropagation(); onEdit(); }}>
          <CalendarClock size={11} /> Set a next step
        </button>
      ) : null}

      <div className="at-card-context">
        {resume ? (
          <span className="at-resume-mini" title={`Resume: ${resume.role} · ATS ${resume.score ?? 0}`}>
            <FileText size={11} /><span className="at-resume-name">{resume.role}</span>
            <span className="at-score-value">{resume.score ?? 0}</span>
          </span>
        ) : (
          <button type="button" className="at-resume-mini empty" onClick={preview ? undefined : (event) => { event.stopPropagation(); onEdit(); }}><FileText size={11} /> Attach resume</button>
        )}
        <span className="at-priority" title={`Priority ${app.excitement || 0} of 5`}><Star size={11} /> {app.excitement || 0}</span>
      </div>

      {!preview && nextStage && (
        <button
          type="button"
          className="at-card-advance"
          title={nextStage.hint || nextStage.label}
          onClick={(event) => { event.stopPropagation(); onMove(nextStage.id); }}
        >
          <span>{nextStage.label}</span><ArrowRight size={13} />
        </button>
      )}
    </article>
  );
}

/* ── list view: a clean row with a horizontal stage stepper ────────────────── */

const FLOW = ['saved', 'applied', 'interviewing', 'offer']; // the forward pipeline; 'rejected' is off-track

function StageStepper({ stage, onPick }) {
  const rejected = stage === 'rejected';
  const idx = FLOW.indexOf(stage);
  const color = STAGE_BY_ID[stage]?.color || 'var(--primary-accent)';
  return (
    <div className="at-stepper" role="group" aria-label="Pipeline stage">
      {FLOW.map((sid, i) => {
        const s = STAGE_BY_ID[sid];
        const state = !rejected && i < idx ? 'done' : (!rejected && i === idx ? 'current' : 'todo');
        const dotStyle = state === 'current'
          ? { background: color, borderColor: color, boxShadow: `0 0 0 4px ${color}22` }
          : state === 'done' ? { background: color, borderColor: color } : undefined;
        return (
          <Fragment key={sid}>
            {i > 0 && <span className="at-step-line" style={(!rejected && i <= idx) ? { background: color } : undefined} />}
            <button type="button" className={`at-step ${state}`} onClick={() => onPick(sid)} title={`Move to ${s.label}`} aria-label={`Move to ${s.label}`}>
              <span className="at-step-dot" style={dotStyle} />
              <span className="at-step-label" style={state === 'current' ? { color, fontWeight: 700 } : undefined}>{s.label}</span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function ApplicationRow({ app, resume, onOpen, onMove, onEdit, onDelete }) {
  const [bg, fg] = mono(app.company || '?');
  const sal = formatSalary(app.salaryMin, app.salaryMax);
  const dState = dueState(app.nextStepDate);
  const urgent = dState === 'overdue' || dState === 'soon';
  const rejected = app.stage === 'rejected';
  return (
    <div
      className="at-row"
      role="button"
      tabIndex={0}
      aria-label={`${app.company}, ${app.role}, open details`}
      onClick={onOpen}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(); } }}
    >
      <span className="at-monogram lg" style={{ background: bg, color: fg }}>{(app.company || '?').charAt(0).toUpperCase()}</span>

      <div className="at-row-info">
        <div className="at-row-role" title={app.role}>{app.role || 'Untitled role'}</div>
        <div className="at-row-company">{app.company}</div>
        <div className="at-row-meta">
          {app.location && <span><MapPin size={11} /> {app.location}</span>}
          {sal && <span><DollarSign size={11} /> {sal}</span>}
          <span><Clock size={11} /> {relativeDate(app.appliedAt)}</span>
          {resume && (
            <span title={`Resume: ${resume.role} · ATS ${resume.score ?? 0}`}>
              <FileText size={11} /> {resume.role}<span className="at-score-dot" style={{ background: scoreColor(resume.score ?? 0), marginLeft: 4 }} />
            </span>
          )}
        </div>
      </div>

      <div className="at-row-pipeline" onClick={(e) => e.stopPropagation()}>
        <StageStepper stage={app.stage} onPick={onMove} />
        {urgent && (
          <span className={`at-next ${dState}`} style={{ alignSelf: 'center', maxWidth: '100%' }}>
            <Clock size={11} /><span className="at-next-label">{app.nextStep || dueLabel(app.nextStepDate)}</span>
            {app.nextStep && <span style={{ flexShrink: 0, opacity: 0.85 }}>· {dueLabel(app.nextStepDate)}</span>}
          </span>
        )}
      </div>

      <div className="at-row-right" onClick={(e) => e.stopPropagation()}>
        {rejected && <span className="at-row-rejected">Rejected</span>}
        <OverflowMenu label={`Actions for ${app.company}`}>
          {(close) => (
            <>
              <button type="button" className="at-menu-item" onClick={() => { close(); onEdit(); }}><Pencil size={14} /> Edit details</button>
              {app.url && (
                <a className="at-menu-item" href={app.url} target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); close(); }}><Globe size={14} /> Open posting</a>
              )}
              <div className="at-menu-sep" />
              <button type="button" className="at-menu-item danger" onClick={() => { close(); onDelete(); }}><Trash2 size={14} /> Delete</button>
            </>
          )}
        </OverflowMenu>
      </div>
    </div>
  );
}

/* ── add / edit drawer ──────────────────────────────────────────────────────── */

function ApplicationDrawer({ application, initialDraft, stage, resumes, onClose, onSave, onDelete }) {
  const ref = useFocusTrap(onClose);
  const [draft, setDraft] = useState(() => (application ? { ...application } : {
    company: '', role: '', location: '', salaryMin: null, salaryMax: null, stage: stage || 'saved',
    source: '', url: '', resumeId: null, excitement: 3, appliedAt: null, nextStep: '', nextStepDate: null, notes: '',
    ...initialDraft,
  }));
  const upd = (f, v) => setDraft((d) => ({ ...d, [f]: v }));
  const num = (v) => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) ? n : null; };

  const linkedResume = draft.resumeId ? resumes.find((r) => r.id === draft.resumeId) : null;
  const profile = linkedResume ? profileForResume(linkedResume) : null;
  const match = useMemo(() => (linkedResume ? scanRoleProfile(profile, linkedResume) : null), [linkedResume, profile]);
  const realScan = scanScore(linkedResume); // a real ATS scan beats the generic profile match
  const realStale = isScanStale(linkedResume);
  const canSave = draft.company.trim() && draft.role.trim();

  return (
    <>
      <div className="at-backdrop" onClick={onClose} />
      <aside className="at-drawer" role="dialog" aria-modal="true" aria-labelledby="at-drawer-title" tabIndex={-1} ref={ref}>
        <div className="at-drawer-head">
          <div>
            <h2 id="at-drawer-title" className="at-drawer-title">{application ? 'Edit application' : 'Add application'}</h2>
            <p className="at-drawer-sub">{application ? `${application.company}: ${application.role}` : 'Track a new role in your pipeline'}</p>
          </div>
          <button type="button" className="at-drawer-close" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="at-drawer-body">
          <div className="at-drawer-preview">
            <span className="at-drawer-preview-label">Preview</span>
            <ApplicationCard app={{ ...draft, company: draft.company || 'Company', role: draft.role || 'Role title' }} resume={linkedResume} preview />
          </div>

          <div className="at-field">
            <label className="at-field-label">Company <span className="req">*</span></label>
            <input className="at-input" value={draft.company} onChange={(e) => upd('company', e.target.value)} placeholder="Stripe" />
          </div>
          <div className="at-field">
            <label className="at-field-label">Role <span className="req">*</span></label>
            <input className="at-input" value={draft.role} onChange={(e) => upd('role', e.target.value)} placeholder="Senior Software Engineer" />
          </div>

          <div className="at-field-row">
            <div className="at-field">
              <label className="at-field-label">Stage</label>
              <select className="at-select" value={draft.stage} onChange={(e) => upd('stage', e.target.value)}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="at-field">
              <label className="at-field-label">Location</label>
              <input className="at-input" value={draft.location} onChange={(e) => upd('location', e.target.value)} placeholder="Remote" />
            </div>
          </div>

          <div className="at-field-row">
            <div className="at-field">
              <label className="at-field-label">Salary min</label>
              <input className="at-input" inputMode="numeric" value={draft.salaryMin ?? ''} onChange={(e) => upd('salaryMin', num(e.target.value))} placeholder="180000" />
            </div>
            <div className="at-field">
              <label className="at-field-label">Salary max</label>
              <input className="at-input" inputMode="numeric" value={draft.salaryMax ?? ''} onChange={(e) => upd('salaryMax', num(e.target.value))} placeholder="210000" />
            </div>
          </div>

          <div className="at-field-row">
            <div className="at-field">
              <label className="at-field-label">Source</label>
              <select className="at-select" value={draft.source} onChange={(e) => upd('source', e.target.value)}>
                {['', 'LinkedIn', 'Referral', 'Company site', 'Recruiter', 'Other'].map((o) => <option key={o} value={o}>{o || 'Not set'}</option>)}
              </select>
            </div>
            <div className="at-field">
              <label className="at-field-label">Excitement</label>
              <div className="at-star-picker" role="group" aria-label="Excitement rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" className={`at-star-pick${i <= draft.excitement ? ' on' : ''}`} onClick={() => upd('excitement', i)} aria-label={`${i} star${i > 1 ? 's' : ''}`}>
                    <Star size={16} className={i <= draft.excitement ? 'on' : ''} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="at-field">
            <label className="at-field-label">Job posting URL</label>
            <input className="at-input" value={draft.url} onChange={(e) => upd('url', e.target.value)} placeholder="https://…" />
          </div>

          <div className="at-field">
            <label className="at-field-label">Resume used</label>
            <select className="at-select" value={draft.resumeId ?? ''} onChange={(e) => upd('resumeId', e.target.value || null)}>
              <option value="">No resume linked</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.role}{r.isActive ? ' (Active)' : ''}</option>)}
            </select>
            {linkedResume && (realScan !== null ? (
              <span className="at-match" title="This resume's actual ATS scan result.">
                <span className="at-score-dot" style={{ background: realStale ? 'var(--warning)' : scoreColor(realScan) }} />
                ATS {realScan}%{linkedResume.scanTarget ? ` vs ${linkedResume.scanTarget}` : ''}{realStale ? ' · edited since scan' : ''}
              </span>
            ) : match ? (
              <span className="at-match" title="Generic keyword match for this resume's target role, not scored against this specific posting.">
                <span className="at-score-dot" style={{ background: scoreColor(match.score ?? 0) }} />
                {match.score}% match vs the generic {profile.label} profile
              </span>
            ) : null)}
          </div>

          <div className="at-field-row">
            <div className="at-field">
              <label className="at-field-label">Next step</label>
              <input className="at-input" value={draft.nextStep} onChange={(e) => upd('nextStep', e.target.value)} placeholder="Onsite loop" />
            </div>
            <div className="at-field">
              <label className="at-field-label">Due date</label>
              <input className="at-input" type="date" value={toDateInput(draft.nextStepDate)} onChange={(e) => upd('nextStepDate', fromDateInput(e.target.value))} />
            </div>
          </div>

          <div className="at-field">
            <label className="at-field-label">Notes</label>
            <textarea className="at-textarea" value={draft.notes} onChange={(e) => upd('notes', e.target.value)} placeholder="Recruiter name, team, prep notes…" />
          </div>

          {linkedResume ? (
            <div className="at-drawer-preview">
              <span className="at-drawer-preview-label">Linked resume</span>
              <ResumeDocument resume={linkedResume} matchedSet={new Set((match ? match.matched : []).map((m) => m.toLowerCase()))} />
            </div>
          ) : (
            <div className="at-no-resume">No resume linked. Pick one above to preview the version you’ll send.</div>
          )}
        </div>

        <div className="at-drawer-foot">
          {application && <button type="button" className="at-drawer-delete" onClick={onDelete}><Trash2 size={15} /> Delete</button>}
          <button type="button" className="at-drawer-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="at-drawer-save" disabled={!canSave} onClick={() => onSave(draft)}><Send size={15} /> Save application</button>
        </div>
      </aside>
    </>
  );
}

function ConfirmDialog({ title, text, confirmLabel, onConfirm, onCancel }) {
  const ref = useFocusTrap(onCancel);
  return (
    <div className="at-confirm-backdrop" onClick={onCancel}>
      <div className="at-confirm" role="dialog" aria-modal="true" aria-labelledby="at-confirm-title" tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <h2 id="at-confirm-title" className="at-confirm-title">{title}</h2>
        <p className="at-confirm-text">{text}</p>
        <div className="at-confirm-actions">
          <button type="button" className="at-drawer-cancel" style={{ marginLeft: 0 }} onClick={onCancel}>Cancel</button>
          <button type="button" className="at-confirm-delete" onClick={onConfirm}><Trash2 size={15} /> {confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

function ApplicationsTable({ visible, resumeById, onOpen, onMove }) {
  return (
    <div className="at-table-wrap">
      <table className="at-table">
        <thead>
          <tr>
            <th>Company</th><th>Stage</th><th>Location</th><th>Salary</th><th>Applied</th><th>Next step</th><th>Resume</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((a) => {
            const [bg, fg] = mono(a.company || '?');
            const r = resumeById(a.resumeId);
            return (
              <tr key={a.id} onClick={() => onOpen(a.id)}>
                <td>
                  <div className="at-td-company">
                    <span className="at-monogram" style={{ background: bg, color: fg, width: 28, height: 28, fontSize: 13 }}>{(a.company || '?').charAt(0).toUpperCase()}</span>
                    <span>{a.company}<span className="at-td-sub" style={{ display: 'block' }}>{a.role}</span></span>
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select className="at-stage-select" style={{ color: STAGE_BY_ID[a.stage].color }} value={a.stage} onChange={(e) => onMove(a.id, e.target.value)}>
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td className="at-td-muted">{a.location || 'Not set'}</td>
                <td className="at-td-muted">{formatSalary(a.salaryMin, a.salaryMax) || 'Not set'}</td>
                <td className="at-td-muted">{relativeDate(a.appliedAt)}</td>
                <td className="at-td-muted">{a.nextStep ? `${a.nextStep}${dueLabel(a.nextStepDate) ? ` · ${dueLabel(a.nextStepDate)}` : ''}` : 'Not set'}</td>
                <td className="at-td-muted">{r ? r.role : 'Not set'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────────────────────── */

function QuickCapture({ onSave, onOpenFull, closedCount = 0, onReviewClosed }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState('saved');
  const canSave = company.trim() && role.trim();

  const captureDraft = () => ({
    company: company.trim(), role: role.trim(), location: '', salaryMin: null, salaryMax: null,
    stage, source: '', url: url.trim(), resumeId: null, excitement: 3, appliedAt: null,
    nextStep: '', nextStepDate: null, notes: '',
  });

  const submit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSave(captureDraft());
    setCompany('');
    setRole('');
    setUrl('');
    setStage('saved');
  };

  return (
    <section className={`at-capture${closedCount ? ' has-history' : ''}`}>
      <header className="at-capture-head">
        <span className="at-capture-mark"><BriefcaseBusiness size={19} /></span>
        <div>
          <h2>{closedCount ? 'Start a new application' : 'Add your first application'}</h2>
          <p>{closedCount ? 'Your active pipeline is clear. Capture the next role when you are ready.' : 'Add the essentials now. You can attach a resume and follow-up later.'}</p>
        </div>
        {closedCount > 0 && (
          <button type="button" className="at-review-closed" onClick={onReviewClosed}>
            <Archive size={14} /> Review closed <span>{closedCount}</span>
          </button>
        )}
      </header>

      <form className="at-capture-form" onSubmit={submit}>
        <div className="at-capture-fields">
          <label>
            <span>Company</span>
            <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Stripe" autoComplete="organization" />
          </label>
          <label>
            <span>Role</span>
            <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Product analyst" />
          </label>
          <label className="at-capture-link">
            <span>Job link <small>Optional</small></span>
            <span className="at-capture-input-icon">
              <Link2 size={14} />
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://company.com/jobs/role" />
            </span>
          </label>
        </div>

        <div className="at-capture-actions">
          <fieldset className="at-stage-choice">
            <legend>Start as</legend>
            <div>
              <button type="button" className={stage === 'saved' ? 'active' : ''} onClick={() => setStage('saved')} aria-pressed={stage === 'saved'}>Saved</button>
              <button type="button" className={stage === 'applied' ? 'active' : ''} onClick={() => setStage('applied')} aria-pressed={stage === 'applied'}>Applied</button>
            </div>
          </fieldset>
          <button type="button" className="at-capture-more" onClick={() => onOpenFull(captureDraft())}>More details</button>
          <button type="submit" className="at-capture-submit" disabled={!canSave}>Save application <ArrowRight size={15} /></button>
        </div>

        <p className="at-capture-note">{stage === 'applied' ? 'DraftMe will schedule a follow-up for seven days from today.' : 'Saved roles stay ready for resume tailoring before you apply.'}</p>
      </form>
    </section>
  );
}

export default function ApplicationsPage({ applications, resumes, onSave, onMove, onDelete }) {
  const [search, setSearch] = useState('');
  const [needsAction, setNeedsAction] = useState(false);
  const [sort, setSort] = useState('recent');
  const [viewMode, setViewMode] = useState('board');
  const [scope, setScope] = useState('pipeline');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [editor, setEditor] = useState(null);     // null | { id: string|null, stage }
  const [confirmId, setConfirmId] = useState(null);

  const resumeById = (id) => resumes.find((r) => r.id === id) || null;
  const stats = useMemo(() => computeStats(applications), [applications]);
  const scopedApplications = useMemo(
    () => applications.filter((app) => (scope === 'closed' ? app.stage === 'rejected' : app.stage !== 'rejected')),
    [applications, scope],
  );
  const visible = useMemo(
    () => filterSort(scopedApplications, { search, stageFilter: null, needsAction: scope === 'pipeline' && needsAction, sort }),
    [scopedApplications, search, needsAction, sort, scope],
  );
  const archiveCount = stats.byStage.rejected;
  const boardStages = scope === 'closed' ? STAGES.filter((stage) => stage.id === 'rejected') : ACTIVE_STAGES;

  // derived modal targets — self-unmount when the record is gone (no sync effect)
  const editing = editor && editor.id ? applications.find((a) => a.id === editor.id) || null : null;
  const confirmTarget = applications.find((a) => a.id === confirmId) || null;

  const handleDragEnd = () => { setDraggedId(null); setDragOverStage(null); };
  const onColDragOver = (e, stageId) => { if (draggedId) { e.preventDefault(); setDragOverStage(stageId); } };
  const onColDrop = (e, stageId) => { e.preventDefault(); if (draggedId) onMove(draggedId, stageId); handleDragEnd(); };

  const clearFilters = () => { setSearch(''); setNeedsAction(false); };
  const changeScope = (nextScope) => {
    setScope(nextScope);
    setNeedsAction(false);
    setSearch('');
    setViewMode(nextScope === 'closed' ? 'list' : 'board');
  };

  const renderCard = (app) => (
    <ApplicationCard
      key={app.id}
      app={app}
      resume={resumeById(app.resumeId)}
      dragging={draggedId === app.id}
      onDragStart={() => setDraggedId(app.id)}
      onDragEnd={handleDragEnd}
      onOpen={() => setEditor({ id: app.id, stage: app.stage })}
      onMove={(stageId) => onMove(app.id, stageId)}
      onEdit={() => setEditor({ id: app.id, stage: app.stage })}
      onDelete={() => setConfirmId(app.id)}
    />
  );

  const renderRow = (app) => (
    <ApplicationRow
      key={app.id}
      app={app}
      resume={resumeById(app.resumeId)}
      onOpen={() => setEditor({ id: app.id, stage: app.stage })}
      onMove={(stageId) => onMove(app.id, stageId)}
      onEdit={() => setEditor({ id: app.id, stage: app.stage })}
      onDelete={() => setConfirmId(app.id)}
    />
  );

  let content;
  if (applications.length === 0) {
    content = (
      <QuickCapture
        onSave={onSave}
        onOpenFull={(draft) => setEditor({ id: null, stage: draft.stage, draft })}
      />
    );
  } else if (scope === 'pipeline' && scopedApplications.length === 0) {
    content = (
      <QuickCapture
        closedCount={archiveCount}
        onSave={onSave}
        onOpenFull={(draft) => setEditor({ id: null, stage: draft.stage, draft })}
        onReviewClosed={() => changeScope('closed')}
      />
    );
  } else if (visible.length === 0) {
    content = (
      <div className="at-noresults">
        {scope === 'closed' && !search ? <Archive size={24} /> : <Search size={24} />}
        <strong>{scope === 'closed' && !search ? 'No archived applications' : 'Nothing matches this view'}</strong>
        <span>{search.trim() ? `No applications match “${search.trim()}”.` : scope === 'closed' ? 'Rejected roles stay here, away from your active pipeline.' : 'Try clearing the attention filter.'}</span>
        {(search || needsAction) && <button type="button" onClick={clearFilters}>Clear filters</button>}
      </div>
    );
  } else if (viewMode === 'list') {
    content = <div className="at-list">{visible.map(renderRow)}</div>;
  } else if (viewMode === 'table') {
    content = <ApplicationsTable visible={visible} resumeById={resumeById} onOpen={(id) => setEditor({ id, stage: applications.find((a) => a.id === id).stage })} onMove={onMove} />;
  } else {
    content = (
      <div className={`at-board${scope === 'closed' ? ' at-board--closed' : ''}`}>
        {boardStages.map((s) => {
          const cards = visible.filter((a) => a.stage === s.id);
          return (
            <section
              key={s.id}
              className={`at-col${dragOverStage === s.id ? ' at-col--over' : ''}`}
              onDragOver={(e) => onColDragOver(e, s.id)}
              onDrop={(e) => onColDrop(e, s.id)}
            >
              <div className="at-col-head">
                <span className="at-col-accent" style={{ background: s.color }} />
                <div className="at-col-head-top">
                  <span className="at-col-dot" style={{ background: s.color }} />
                  <span className="at-col-title">{s.label}</span>
                  <span className="at-col-count">{cards.length}</span>
                  {s.id !== 'rejected' && <button type="button" className="at-col-quickadd" onClick={() => setEditor({ id: null, stage: s.id })} aria-label={`Add to ${s.label}`}><Plus size={15} /></button>}
                </div>
                <p className="at-col-agg">{stageAggregate(applications, s.id)}</p>
              </div>
              <div className="at-col-body">
                {cards.length === 0
                  ? <div className="at-col-empty">{draggedId ? 'Drop here' : s.id === 'saved' ? 'Keep promising roles here before you tailor.' : s.id === 'applied' ? 'Submitted roles will appear here.' : s.id === 'interviewing' ? 'Move a role here when conversations begin.' : s.id === 'offer' ? 'Offers stay visible while you decide.' : 'Closed roles stay out of your working view.'}</div>
                  : cards.map(renderCard)}
              </div>
              {s.id !== 'rejected' && <button type="button" className="at-col-add" onClick={() => setEditor({ id: null, stage: s.id })}><Plus size={14} /> Add</button>}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="at-page">
      {applications.length > 0 && (
        <div className="at-toolbar">
          <div className="at-scope-tabs" role="group" aria-label="Application scope">
            <button type="button" className={scope === 'pipeline' ? 'active' : ''} onClick={() => changeScope('pipeline')} aria-pressed={scope === 'pipeline'}>Pipeline <span>{applications.length - archiveCount}</span></button>
            <button type="button" className={scope === 'closed' ? 'active' : ''} onClick={() => changeScope('closed')} aria-pressed={scope === 'closed'}><Archive size={13} /> Closed <span>{archiveCount}</span></button>
          </div>

          {scopedApplications.length > 0 && (
            <div className="at-work-search">
              <Search size={15} className="at-search-icon" />
              <input className="at-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles, companies, locations" aria-label="Search applications" />
              {search && <button type="button" className="at-search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
            </div>
          )}

          {scopedApplications.length > 0 && (
            <div className="at-controls">
              {scope === 'pipeline' && (
                <button type="button" className={`at-toggle${needsAction ? ' on' : ''}`} onClick={() => setNeedsAction((v) => !v)} aria-pressed={needsAction}>
                  <span className="at-toggle-dot" /> Attention
                </button>
              )}
              <select className="at-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort applications">
                <option value="recent">Recently updated</option>
                <option value="salary">Salary, high to low</option>
                <option value="company">Company A-Z</option>
                <option value="excitement">Priority</option>
              </select>
              <div className="at-view-toggle" role="group" aria-label="View mode">
                <button type="button" className={`at-view-btn${viewMode === 'board' ? ' active' : ''}`} onClick={() => setViewMode('board')} aria-pressed={viewMode === 'board'} aria-label="Board view"><LayoutGrid size={16} /></button>
                <button type="button" className={`at-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label="List view"><List size={16} /></button>
                <button type="button" className={`at-view-btn${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} aria-label="Table view"><Table2 size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {content}

      {editor && (
        <ApplicationDrawer
          application={editing}
          initialDraft={editor.draft}
          stage={editor.stage}
          resumes={resumes}
          onClose={() => setEditor(null)}
          onSave={(app) => { onSave(app); setEditor(null); }}
          onDelete={() => setConfirmId(editing.id)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete application?"
          text={`${confirmTarget.company}: ${confirmTarget.role} will be permanently removed. This can’t be undone.`}
          onConfirm={() => { onDelete(confirmTarget.id); setConfirmId(null); setEditor(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
