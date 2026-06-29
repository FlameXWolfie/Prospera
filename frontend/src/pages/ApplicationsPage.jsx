import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import {
  Plus, Search, X, List, LayoutGrid, Table2, MoreVertical, MapPin, DollarSign,
  Star, FileText, Globe, Pencil, Trash2, Clock, Send, Inbox,
} from 'lucide-react';
import { scanRoleProfile, profileForResume } from '../lib/resume/atsKeywords';
import { scoreColor, scanScore, isScanStale } from '../lib/resume/scoreColor';
import {
  STAGES, STAGE_BY_ID, formatSalary, dueState, dueLabel, relativeDate,
  computeStats, stageAggregate, followUpsDue, filterSort,
} from '../lib/applications/applications';
import ResumeDocument from '../components/dashboard/ResumeDocument';
import FirstRun, { BoardVisual } from '../components/dashboard/FirstRun';
import './css/ApplicationsPage.css';

/* ── helpers (module scope; Date math stays out of render) ──────────────────── */

const MONO = [
  ['#eef2ff', '#363ff5'], ['#ecfeff', '#0891b2'], ['#f5f3ff', '#8b5cf6'],
  ['#fffbeb', '#d97706'], ['#fdf2f8', '#db2777'], ['#ecfdf5', '#059669'],
  ['#eff6ff', '#3b82f6'], ['#fef2f2', '#dc2626'],
];
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

function Stars({ value }) {
  return (
    <div className="at-stars" aria-label={`Excitement ${value || 0} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={12} className={`at-star${i <= (value || 0) ? ' on' : ''}`} />)}
    </div>
  );
}

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
  const stage = STAGE_BY_ID[app.stage];
  const sal = formatSalary(app.salaryMin, app.salaryMax);
  const dState = dueState(app.nextStepDate);
  const urgent = dState === 'overdue' || dState === 'soon';

  return (
    <div
      className={`at-card${preview ? ' preview' : ''}${dragging ? ' dragging' : ''}`}
      draggable={!preview}
      role={preview ? undefined : 'button'}
      tabIndex={preview ? undefined : 0}
      aria-label={preview ? undefined : `${app.company} — ${app.role}, open details`}
      onDragStart={preview ? undefined : onDragStart}
      onDragEnd={preview ? undefined : onDragEnd}
      onClick={preview ? undefined : onOpen}
      onKeyDown={preview ? undefined : (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(); }
      }}
    >
      <span className="at-card-accent" style={{ background: stage ? stage.color : 'var(--border-dark)' }} />
      <div className="at-card-top">
        <span className="at-monogram" style={{ background: bg, color: fg }}>{(app.company || '?').charAt(0).toUpperCase()}</span>
        <div className="at-card-titles">
          <div className="at-card-company" title={app.company}>{app.company}</div>
          <div className="at-card-role" title={app.role}>{app.role}</div>
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
        {!app.location && !sal && <span className="at-meta"><Clock size={11} /> {relativeDate(app.appliedAt)}</span>}
      </div>

      {urgent && (
        <div className={`at-next ${dState}`}>
          <Clock size={11} />
          <span className="at-next-label">{app.nextStep || dueLabel(app.nextStepDate)}</span>
          {app.nextStep && <span style={{ flexShrink: 0, opacity: 0.85 }}>· {dueLabel(app.nextStepDate)}</span>}
        </div>
      )}

      <div className="at-card-foot">
        <Stars value={app.excitement} />
        {resume ? (
          <span className="at-resume-mini" title={`Resume: ${resume.role} · ATS ${resume.score ?? 0}`}>
            <FileText size={11} /><span className="at-resume-name">{resume.role}</span>
            <span className="at-score-dot" style={{ background: scoreColor(resume.score ?? 0) }} />
          </span>
        ) : (
          <span className="at-resume-mini empty"><FileText size={11} /> Link resume</span>
        )}
      </div>
    </div>
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
      aria-label={`${app.company} — ${app.role}, open details`}
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

function ApplicationDrawer({ application, stage, resumes, onClose, onSave, onDelete }) {
  const ref = useFocusTrap(onClose);
  const [draft, setDraft] = useState(() => (application ? { ...application } : {
    company: '', role: '', location: '', salaryMin: null, salaryMax: null, stage: stage || 'saved',
    source: '', url: '', resumeId: null, excitement: 3, appliedAt: null, nextStep: '', nextStepDate: null, notes: '',
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
            <p className="at-drawer-sub">{application ? `${application.company} — ${application.role}` : 'Track a new role in your pipeline'}</p>
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
                {['', 'LinkedIn', 'Referral', 'Company site', 'Recruiter', 'Other'].map((o) => <option key={o} value={o}>{o || '—'}</option>)}
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
              <span className="at-match" title="Generic keyword match for this resume's target role — not scored against this specific posting.">
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
            <div className="at-no-resume">No resume linked — pick one above to preview the version you’ll send.</div>
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
                <td className="at-td-muted">{a.location || '—'}</td>
                <td className="at-td-muted">{formatSalary(a.salaryMin, a.salaryMax) || '—'}</td>
                <td className="at-td-muted">{relativeDate(a.appliedAt)}</td>
                <td className="at-td-muted">{a.nextStep ? `${a.nextStep}${dueLabel(a.nextStepDate) ? ` · ${dueLabel(a.nextStepDate)}` : ''}` : '—'}</td>
                <td className="at-td-muted">{r ? r.role : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────────────────────── */

export default function ApplicationsPage({ applications, resumes, onSave, onMove, onDelete }) {
  const [search, setSearch] = useState('');
  const [needsAction, setNeedsAction] = useState(false);
  const [sort, setSort] = useState('recent');
  const [viewMode, setViewMode] = useState('list');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [editor, setEditor] = useState(null);     // null | { id: string|null, stage }
  const [confirmId, setConfirmId] = useState(null);

  const resumeById = (id) => resumes.find((r) => r.id === id) || null;
  const stats = useMemo(() => computeStats(applications), [applications]);
  const followUps = useMemo(() => followUpsDue(applications), [applications]);
  const visible = useMemo(
    () => filterSort(applications, { search, stageFilter: null, needsAction, sort }),
    [applications, search, needsAction, sort],
  );

  // derived modal targets — self-unmount when the record is gone (no sync effect)
  const editing = editor && editor.id ? applications.find((a) => a.id === editor.id) || null : null;
  const confirmTarget = applications.find((a) => a.id === confirmId) || null;

  const respColor = scoreColor(stats.responseRate || 0);

  const handleDragEnd = () => { setDraggedId(null); setDragOverStage(null); };
  const onColDragOver = (e, stageId) => { if (draggedId) { e.preventDefault(); setDragOverStage(stageId); } };
  const onColDrop = (e, stageId) => { e.preventDefault(); if (draggedId) onMove(draggedId, stageId); handleDragEnd(); };

  const clearFilters = () => { setSearch(''); setNeedsAction(false); };

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
      <FirstRun
        eyebrow={<><Inbox size={13} /> Application Tracker</>}
        title="Run your whole job search from one board"
        subtitle="Track every role from saved to offer, attach the resume you sent, and never let a follow-up slip through the cracks again."
        actions={(
          <button className="fr-btn fr-btn-primary" onClick={() => setEditor({ id: null, stage: 'saved' })}><Plus size={16} /> Add your first application</button>
        )}
        steps={[
          { icon: Plus, title: 'Save roles', text: 'Capture every opportunity the moment you find it.' },
          { icon: LayoutGrid, title: 'Move stages', text: 'Drag from saved to applied, interviewing, and offer.' },
          { icon: Clock, title: 'Never miss a step', text: 'Set next-step dates and see what needs action today.' },
        ]}
        visual={<BoardVisual />}
      />
    );
  } else if (visible.length === 0) {
    content = (
      <div className="at-noresults">
        <Search size={26} />
        <span>{search.trim() ? `No applications match “${search.trim()}”.` : 'No applications match the current filters.'}</span>
        <button type="button" onClick={clearFilters}>Clear filters</button>
      </div>
    );
  } else if (viewMode === 'list') {
    content = <div className="at-list">{visible.map(renderRow)}</div>;
  } else if (viewMode === 'table') {
    content = <ApplicationsTable visible={visible} resumeById={resumeById} onOpen={(id) => setEditor({ id, stage: applications.find((a) => a.id === id).stage })} onMove={onMove} />;
  } else {
    content = (
      <div className="at-board">
        {STAGES.map((s) => {
          const cards = visible.filter((a) => a.stage === s.id);
          return (
            <div
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
                  <button type="button" className="at-col-quickadd" onClick={() => setEditor({ id: null, stage: s.id })} aria-label={`Add to ${s.label}`}><Plus size={15} /></button>
                </div>
                <p className="at-col-agg">{stageAggregate(applications, s.id)}</p>
              </div>
              <div className="at-col-body">
                {cards.length === 0
                  ? <div className="at-col-empty">{draggedId ? 'Drop here' : 'Nothing here yet'}</div>
                  : cards.map(renderCard)}
              </div>
              <button type="button" className="at-col-add" onClick={() => setEditor({ id: null, stage: s.id })}><Plus size={14} /> Add</button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="at-page">
      <div className="at-bar">
        <div className="at-bar-left">
          <h1 className="at-title">Applications</h1>
          <p className="at-subtitle">
            {stats.total} tracked
            {followUps > 0 && <> · <span className="due">{followUps} follow-up{followUps === 1 ? '' : 's'} due</span></>}
          </p>
        </div>
        <div className="at-bar-actions">
          {applications.length > 0 && (
            <>
              <div className="at-search">
                <Search size={15} className="at-search-icon" />
                <input className="at-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, role, or location…" aria-label="Search applications" />
                {search && <button type="button" className="at-search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
              </div>
              <div className="at-view-toggle" role="group" aria-label="View mode">
                <button type="button" className={`at-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label="List view"><List size={16} /></button>
                <button type="button" className={`at-view-btn${viewMode === 'board' ? ' active' : ''}`} onClick={() => setViewMode('board')} aria-pressed={viewMode === 'board'} aria-label="Board view"><LayoutGrid size={16} /></button>
                <button type="button" className={`at-view-btn${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} aria-label="Table view"><Table2 size={16} /></button>
              </div>
            </>
          )}
          <button type="button" className="at-add-btn" onClick={() => setEditor({ id: null, stage: 'saved' })}><Plus size={16} /> Add application</button>
        </div>
      </div>

      {applications.length > 0 && (
        <div className="at-toolbar">
          <div className="at-metrics">
            <span className="at-metric"><b>{stats.active}</b> active</span>
            <span className="at-metric"><span className="at-metric-dot" style={{ background: 'var(--purple-accent)' }} /><b>{stats.interviews}</b> interviewing</span>
            <span className="at-metric"><span className="at-metric-dot" style={{ background: 'var(--success)' }} /><b>{stats.offers}</b> offer{stats.offers === 1 ? '' : 's'}</span>
            <span className="at-metric resp" style={{ color: stats.responseRate == null ? undefined : respColor }}>
              <b style={{ color: 'inherit' }}>{stats.responseRate == null ? '—' : `${stats.responseRate}%`}</b> response rate
            </span>
          </div>
          <div className="at-controls">
            <button type="button" className={`at-toggle${needsAction ? ' on' : ''}`} onClick={() => setNeedsAction((v) => !v)} aria-pressed={needsAction}>
              <span className="at-toggle-dot" /> Needs action
            </button>
            <select className="at-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort applications">
              <option value="recent">Recently updated</option>
              <option value="salary">Salary (high to low)</option>
              <option value="company">Company A–Z</option>
              <option value="excitement">Excitement</option>
            </select>
          </div>
        </div>
      )}

      {content}

      {editor && (
        <ApplicationDrawer
          application={editing}
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
          text={`${confirmTarget.company} — ${confirmTarget.role} will be permanently removed. This can’t be undone.`}
          onConfirm={() => { onDelete(confirmTarget.id); setConfirmId(null); setEditor(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
