import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Grid, List, MoreVertical, X, Copy, Target, Download,
  Trash2, FileText, Code2, BarChart3, Briefcase, Megaphone, Palette,
  Library, Sparkles
} from 'lucide-react';
import { scoreColor, scoreBand, scanScore, isScanStale } from '../lib/resume/scoreColor';
import { flattenSkills } from '../lib/resume/skills';
import FirstRun, { LibraryVisual } from '../components/dashboard/FirstRun';
import './css/LibraryPage.css';

/* ── Helpers (module scope so Date calls never run during component render) ── */

function ago(iso) {
  if (!iso) return 'Recently';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function absDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCat(role) {
  const r = (role || '').toLowerCase();
  if (/data analyst|analytics|data scientist/.test(r)) return 'Data & Analytics';
  if (/engineer|developer|full ?stack|backend|frontend/.test(r)) return 'Software Engineering';
  if (/design|ux|ui/.test(r)) return 'Design';
  if (/product/.test(r)) return 'Product';
  if (/marketing/.test(r)) return 'Marketing';
  return 'Other';
}

const CAT_META = {
  'Software Engineering': { color: 'var(--primary-accent)', bg: 'var(--bg-inset)', Icon: Code2 },
  'Data & Analytics': { color: '#0891b2', bg: 'var(--bg-inset)', Icon: BarChart3 },
  'Product': { color: 'var(--purple-accent)', bg: 'var(--purple-bg)', Icon: Briefcase },
  'Marketing': { color: 'var(--warning)', bg: 'var(--warning-bg)', Icon: Megaphone },
  'Design': { color: '#db2777', bg: 'var(--bg-inset)', Icon: Palette },
  'Other': { color: 'var(--text-muted)', bg: 'var(--bg-inset)', Icon: FileText },
};

function normalizeStatus(status) {
  const s = (status || '').toLowerCase();
  if (s.startsWith('verified')) return 'Verified';
  if (s.startsWith('tailored')) return 'Tailored';
  if (s.startsWith('draft')) return 'Draft';
  return 'Other';
}

const STATUS_PILL = {
  Verified: { bg: 'var(--success-bg)', fg: 'var(--success-strong)', label: 'Verified' },
  Tailored: { bg: 'var(--purple-bg)', fg: '#7c3aed', label: 'Tailored' },
  Draft: { bg: 'var(--warning-bg)', fg: 'var(--warning)', label: 'Draft' },
  Other: { bg: 'var(--bg-inset)', fg: 'var(--text-muted)', label: 'Other' },
};

function filterAndSort(resumes, { search, status, band, sort }) {
  const q = search.trim().toLowerCase();
  const out = resumes.filter((r) => {
    if (q) {
      const hay = [r.label, r.role, r.target, ...flattenSkills(r.skills)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (status !== 'All' && normalizeStatus(r.status) !== status) return false;
    if (band !== 'All') {
      const sc = scanScore(r);
      if (sc === null || scoreBand(sc) !== band) return false; // unscanned matches no band
    }
    return true;
  });
  const byRecent = (a, b) => new Date(b.lastAppended || 0) - new Date(a.lastAppended || 0);
  const sorted = [...out];
  if (sort === 'score') sorted.sort((a, b) => (scanScore(b) ?? -1) - (scanScore(a) ?? -1)); // unscanned sink to bottom
  else if (sort === 'role') sorted.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
  else if (sort === 'status') sorted.sort((a, b) => normalizeStatus(a.status).localeCompare(normalizeStatus(b.status)));
  else sorted.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || byRecent(a, b));
  return sorted;
}

/* ── Shared focus-trap for the drawer + confirm dialog ───────────────────────
   onClose is read through a ref so the trap installs once on mount (no re-trap
   on every parent re-render). ──────────────────────────────────────────────── */

function useFocusTrap(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const node = ref.current;
    const prev = document.activeElement;
    const focusables = () =>
      node
        ? Array.from(
            node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
          ).filter((el) => !el.disabled && el.offsetParent !== null)
        : [];
    (focusables()[0] || node)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) {
          e.preventDefault();
          return;
        }
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
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

/* ── Primitives ─────────────────────────────────────────────────────────────── */

// `score` is null when the resume hasn't been scanned — render an empty grey ring
// with a dash rather than a fabricated number.
function ScoreRing({ score, size, stroke }) {
  const scanned = typeof score === 'number';
  const s = scanned ? Math.max(0, Math.min(100, score)) : 0;
  const r = size / 2 - stroke * 2;
  const circ = 2 * Math.PI * r;
  const color = scanned ? scoreColor(s) : 'var(--border-strong)';
  const fs = size >= 72 ? 22 : size >= 48 ? 14 : 11;
  return (
    <span className="library-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="library-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-dark)" strokeWidth={stroke} />
        {scanned && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={circ - (s / 100) * circ}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span className="library-ring-text" style={{ fontSize: scanned ? fs : Math.round(fs * 0.95), color }}>{scanned ? s : '–'}</span>
    </span>
  );
}

function StatusPill({ status }) {
  const p = STATUS_PILL[normalizeStatus(status)];
  return (
    <span className="library-status-pill" style={{ background: p.bg, color: p.fg }}>{p.label}</span>
  );
}

function OverflowMenu({ items, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  useEffect(() => {
    if (open && listRef.current) {
      const first = listRef.current.querySelector('button:not([disabled])');
      if (first) first.focus();
    }
  }, [open]);
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const btns = Array.from(listRef.current?.querySelectorAll('button:not([disabled])') || []);
      const i = btns.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? btns[(i + 1) % btns.length] : btns[(i - 1 + btns.length) % btns.length];
      if (next) next.focus();
    }
  };
  return (
    <div className="library-menu" ref={ref}>
      <button
        type="button"
        className="library-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="library-menu-list" role="menu" ref={listRef} onKeyDown={onKeyDown}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              className={`library-menu-item${it.danger ? ' danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onClick();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card + Row ─────────────────────────────────────────────────────────────── */

function ResumeCard({ resume, selected, onOpen, items }) {
  const cat = getCat(resume.role);
  const meta = CAT_META[cat];
  const Icon = meta.Icon;
  const skills = flattenSkills(resume.skills);
  const ns = normalizeStatus(resume.status);
  const sc = scanScore(resume);
  return (
    <div className={`library-card${selected ? ' selected' : ''}`}>
      <button
        type="button"
        className="library-card-open"
        onClick={onOpen}
        aria-label={`${resume.role} resume, ATS ${sc === null ? 'not scanned' : sc}, ${STATUS_PILL[ns].label}${resume.isActive ? ', active' : ''}. Open details.`}
      >
        <div className="library-thumb">
          {resume.isActive && <span className="library-active-badge">Active</span>}
          <span className="library-cat-chip" style={{ background: meta.bg, color: meta.color }}>
            <Icon size={11} /> {cat}
          </span>
          <span className="library-thumb-line lg" />
          {[82, 92, 68, 86, 74].map((w, i) => (
            <span key={i} className="library-thumb-line" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="library-card-title" title={resume.label || resume.role}>{resume.label || resume.role}</div>
        <div className="library-card-target" title={resume.target || ''}>Targeting {resume.target || resume.role}</div>
        <div className="library-card-meta">
          <StatusPill status={resume.status} />
          <span className="library-card-date" title={absDate(resume.lastAppended)}>Updated {ago(resume.lastAppended)}</span>
        </div>
        <div className="library-card-footer">
          <span className="library-skill-row">
            {skills.slice(0, 2).map((s) => (
              <span key={s} className="library-skill-mini">{s}</span>
            ))}
            {skills.length > 2 && <span className="library-skill-mini muted">+{skills.length - 2}</span>}
          </span>
          <ScoreRing score={sc} size={36} stroke={3} />
        </div>
      </button>
      <div className="library-card-menu">
        <OverflowMenu items={items} label={`Actions for ${resume.role} resume`} />
      </div>
    </div>
  );
}

function ResumeRow({ resume, selected, onOpen, items }) {
  const ns = normalizeStatus(resume.status);
  const sc = scanScore(resume);
  const stale = isScanStale(resume);
  return (
    <div className={`library-row${selected ? ' selected' : ''}`}>
      <button
        type="button"
        className="library-row-open"
        onClick={onOpen}
        aria-label={`${resume.role} resume, ATS ${sc === null ? 'not scanned' : sc}, ${STATUS_PILL[ns].label}${resume.isActive ? ', active' : ''}. Open details.`}
      >
        <span className="library-row-main">
          <FileText size={16} className="library-row-icon" />
          <span className="library-row-titles">
            <span className="library-row-title">
              {resume.label || resume.role}
              {resume.isActive && <span className="library-active-badge static sm">Active</span>}
            </span>
            <span className="library-row-target">Targeting {resume.target || resume.role}</span>
          </span>
        </span>
        <span className="library-row-status"><StatusPill status={resume.status} /></span>
        <span className="library-row-ats">
          <ScoreRing score={sc} size={28} stroke={3} />
          <span className="library-row-ats-num" style={{ color: sc === null ? 'var(--text-light)' : stale ? 'var(--warning)' : scoreColor(sc) }}>
            {sc === null ? 'Not scanned' : stale ? `${sc} · re-scan` : `${sc}/100`}
          </span>
        </span>
        <span className="library-row-date" title={absDate(resume.lastAppended)}>{ago(resume.lastAppended)}</span>
      </button>
      <div className="library-row-menu">
        <OverflowMenu items={items} label={`Actions for ${resume.role} resume`} />
      </div>
    </div>
  );
}

/* ── Drawer ─────────────────────────────────────────────────────────────────── */

function ResumeDrawer({ resume, onClose, onOpenBuilder, onClone, onSetActive, onDelete, onScan }) {
  const ref = useFocusTrap(onClose);
  const skills = flattenSkills(resume.skills);
  const exp = resume.experience || [];
  const sc = scanScore(resume);
  const scanned = sc !== null;
  const stale = isScanStale(resume);
  const band =
    sc >= 85 ? 'Excellent — this resume is ATS-ready' : sc >= 70 ? 'Good — a few tweaks could lift your score' : 'Needs work — optimize keywords and formatting';
  const rescanBtn = (
    <button
      type="button"
      onClick={onScan}
      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--primary-accent)', textDecoration: 'underline', cursor: 'pointer' }}
    >
      Re-scan
    </button>
  );
  return (
    <>
      <div className="library-backdrop" onClick={onClose} />
      <aside
        className="library-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-drawer-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="library-drawer-header">
          <div className="library-drawer-head-main">
            <div className="library-drawer-titlerow">
              <h2 id="library-drawer-title" className="library-drawer-title">{resume.role} Resume</h2>
              {resume.isActive && <span className="library-active-badge static">Active</span>}
            </div>
            <StatusPill status={resume.status} />
            <p className="library-drawer-sub">Targeting {resume.target || resume.role} · Updated {ago(resume.lastAppended)}</p>
          </div>
          <div className="library-drawer-head-side">
            <button type="button" className="library-icon-btn" aria-label="Close details" onClick={onClose}>
              <X size={16} />
            </button>
            <div className="library-drawer-ring">
              <ScoreRing score={sc} size={72} stroke={5} />
              <span className="library-drawer-ring-label">ATS Score</span>
            </div>
          </div>
        </div>

        <div className="library-drawer-body">
          {scanned ? (
            <div className="library-drawer-band" style={{ borderLeftColor: stale ? 'var(--warning)' : scoreColor(sc) }}>
              <span className="library-drawer-band-score" style={{ color: stale ? 'var(--warning)' : scoreColor(sc) }}>{sc}/100</span>
              <span className="library-drawer-band-text">
                {stale
                  ? <>Edited since the last scan — this score is out of date. {rescanBtn} to update.</>
                  : <>{band}{resume.scanTarget ? ` · vs ${resume.scanTarget}` : ''}{resume.scannedAt ? ` · scanned ${ago(resume.scannedAt)}` : ''}</>}
              </span>
            </div>
          ) : (
            <div className="library-drawer-band" style={{ borderLeftColor: 'var(--border-strong)' }}>
              <span className="library-drawer-band-score" style={{ color: 'var(--text-light)', fontSize: 20 }}>–</span>
              <span className="library-drawer-band-text">
                Not scanned yet.{' '}
                <button
                  type="button"
                  onClick={onScan}
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--primary-accent)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Run an ATS scan
                </button>
                {' '}to see this resume&rsquo;s real match.
              </span>
            </div>
          )}

          <section className="library-drawer-section">
            <h3 className="library-drawer-h3"><Sparkles size={14} /> Summary</h3>
            <p className="library-drawer-summary">{resume.summary || 'No summary added yet.'}</p>
          </section>

          <section className="library-drawer-section">
            <h3 className="library-drawer-h3">Experience</h3>
            {exp.length === 0 ? (
              <p className="library-drawer-empty">No experience added yet.</p>
            ) : (
              exp.map((e, i) => (
                <div key={i} className="library-exp">
                  <div className="library-exp-row">
                    <span className="library-exp-role">{e.role || 'Role'}</span>
                    <span className="library-exp-period">{e.period || ''}</span>
                  </div>
                  <div className="library-exp-company">{e.company || ''}</div>
                  <ul className="library-exp-bullets">
                    {(e.bullets || []).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="library-drawer-section">
            <h3 className="library-drawer-h3">Skills</h3>
            <div className="library-skill-wrap">
              {skills.length === 0 ? (
                <p className="library-drawer-empty">No skills added yet.</p>
              ) : (
                skills.map((s) => (
                  <span key={s} className="library-skill-chip">{s}</span>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="library-drawer-actions">
          <button type="button" className="new-resume-btn library-drawer-primary" onClick={onOpenBuilder}>
            <Sparkles size={15} /> Edit in Studio
          </button>
          <div className="library-drawer-action-row">
            <button type="button" className="library-action-btn" onClick={onClone}>
              <Copy size={15} /> Duplicate
            </button>
            <button type="button" className="library-action-btn" onClick={onSetActive} disabled={resume.isActive}>
              <Target size={15} /> Set active
            </button>
            <button type="button" className="library-action-btn" onClick={() => alert('PDF export is coming soon.')}>
              <Download size={15} /> Download
            </button>
            <button type="button" className="library-action-btn danger" onClick={onDelete}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Confirm dialog + empty states + header + toolbar + meta ────────────────── */

function ConfirmDialog({ name, onConfirm, onCancel }) {
  const ref = useFocusTrap(onCancel);
  return (
    <div className="library-confirm-backdrop" onClick={onCancel}>
      <div
        className="library-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-confirm-title"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="library-confirm-title" className="library-confirm-title">Delete resume?</h2>
        <p className="library-confirm-text">
          <strong>{name}</strong> will be permanently removed. This can’t be undone.
        </p>
        <div className="library-confirm-actions">
          <button type="button" className="library-action-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="library-confirm-delete" onClick={onConfirm}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryEmptyState({ variant, query, onClearSearch, onClearFilters, onCreate }) {
  if (variant === 'no-results') {
    return (
      <div className="library-empty">
        <div className="library-empty-illustration"><Search size={28} /></div>
        <h2 className="library-empty-title">No matching resumes</h2>
        <p className="library-empty-text">
          {query ? `Nothing matches “${query}”.` : 'No resumes match the current filters.'} Try clearing your search or filters.
        </p>
        <div className="library-empty-actions">
          {query && <button type="button" className="library-action-btn" onClick={onClearSearch}>Clear search</button>}
          <button type="button" className="library-action-btn" onClick={onClearFilters}>Clear all filters</button>
        </div>
      </div>
    );
  }
  return (
    <div className="library-empty">
      <div className="library-empty-illustration"><Library size={28} /></div>
      <h2 className="library-empty-title">Your library is empty</h2>
      <p className="library-empty-text">
        Build your first ATS-optimized resume and it’ll show up here, ready to tailor and track.
      </p>
      <button type="button" className="new-resume-btn" onClick={onCreate}>
        <Plus size={15} /> Create your first resume
      </button>
    </div>
  );
}

function LibraryHeader({ total, activeCount, onNewResumeClick }) {
  return (
    <div className="library-header">
      <div>
        <h1 className="library-title">Resume Library</h1>
        <p className="library-subtitle">
          {total === 0
            ? 'Organize, tailor, and track every version of your resume.'
            : `${total} resume${total === 1 ? '' : 's'}${activeCount ? ` · ${activeCount} active` : ''}`}
        </p>
      </div>
      <button type="button" className="new-resume-btn" onClick={onNewResumeClick}>
        <Plus size={16} /> New Resume
      </button>
    </div>
  );
}

function LibraryToolbar({ search, onSearch, status, onStatus, band, onBand, sort, onSort, viewMode, onViewMode }) {
  const statusOpts = ['All', 'Verified', 'Tailored', 'Draft'];
  const bandOpts = ['All', '85+', '70-84', '<70'];
  return (
    <div className="library-toolbar">
      <div className="library-search">
        <Search size={16} className="library-search-icon" />
        <input
          className="library-search-input"
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search role, target, or skill..."
          aria-label="Search resumes"
        />
        {search && (
          <button type="button" className="library-search-clear" aria-label="Clear search" onClick={() => onSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="library-chip-group" role="group" aria-label="Filter by status">
        {statusOpts.map((opt) => {
          const active = status === opt;
          const color = opt === 'All' ? 'var(--primary-accent)' : STATUS_PILL[opt].fg;
          return (
            <button
              key={opt}
              type="button"
              className={`library-chip${active ? ' active' : ''}`}
              aria-pressed={active}
              onClick={() => onStatus(opt)}
              style={active ? { background: color, borderColor: color, color: 'var(--text-inverse)' } : undefined}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="library-chip-group" role="group" aria-label="Filter by ATS score">
        {bandOpts.map((opt) => {
          const active = band === opt;
          const color = opt === '85+' ? 'var(--success)' : opt === '70-84' ? 'var(--warning)' : opt === '<70' ? 'var(--danger)' : 'var(--primary-accent)';
          return (
            <button
              key={opt}
              type="button"
              className={`library-chip${active ? ' active' : ''}`}
              aria-pressed={active}
              onClick={() => onBand(opt)}
              style={active ? { background: color, borderColor: color, color: 'var(--text-inverse)' } : undefined}
            >
              {opt === 'All' ? 'All scores' : opt}
            </button>
          );
        })}
      </div>

      <select className="library-sort" value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort resumes">
        <option value="updated">Last updated</option>
        <option value="score">ATS score (high to low)</option>
        <option value="role">Role A–Z</option>
        <option value="status">Status</option>
      </select>

      <div className="library-view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={`library-view-btn${viewMode === 'grid' ? ' active' : ''}`}
          aria-pressed={viewMode === 'grid'}
          aria-label="Grid view"
          onClick={() => onViewMode('grid')}
        >
          <Grid size={16} />
        </button>
        <button
          type="button"
          className={`library-view-btn${viewMode === 'list' ? ' active' : ''}`}
          aria-pressed={viewMode === 'list'}
          aria-label="List view"
          onClick={() => onViewMode('list')}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}

function ResultMeta({ shown, total, filters, onClearAll }) {
  return (
    <div className="library-meta">
      <span className="library-meta-count" aria-live="polite">Showing {shown} of {total}</span>
      {filters.length > 0 && (
        <div className="library-active-filters">
          {filters.map((f) => (
            <span key={f.key} className="library-filter-chip">
              {f.label}
              <button type="button" aria-label={`Remove ${f.label} filter`} onClick={f.onRemove}>
                <X size={12} />
              </button>
            </span>
          ))}
          <button type="button" className="library-clear-all" onClick={onClearAll}>Clear all</button>
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function LibraryPage({ resumes, onNewResumeClick, onClone, onDelete, onSetActive, onScan, onEditInStudio }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [band, setBand] = useState('All');
  const [sort, setSort] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedId, setSelectedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const visible = useMemo(
    () => filterAndSort(resumes, { search, status, band, sort }),
    [resumes, search, status, band, sort]
  );

  // The drawer + confirm dialog are derived from `resumes`: if a resume is
  // deleted, `selected`/`confirmTarget` become null and they unmount on their
  // own — no syncing effect needed.
  const selected = resumes.find((r) => r.id === selectedId) || null;
  const confirmTarget = resumes.find((r) => r.id === confirmId) || null;
  const activeCount = resumes.filter((r) => r.isActive).length;

  const clearAll = () => {
    setSearch('');
    setStatus('All');
    setBand('All');
  };

  const filters = [];
  if (search.trim()) filters.push({ key: 'search', label: `“${search.trim()}”`, onRemove: () => setSearch('') });
  if (status !== 'All') filters.push({ key: 'status', label: status, onRemove: () => setStatus('All') });
  if (band !== 'All') filters.push({ key: 'band', label: `ATS ${band}`, onRemove: () => setBand('All') });

  const menuItems = (r) => [
    { label: 'Open', onClick: () => setSelectedId(r.id) },
    { label: 'Duplicate', onClick: () => onClone(r.id) },
    { label: 'Set as active', onClick: () => onSetActive(r.id), disabled: r.isActive },
    { label: 'Delete', onClick: () => setConfirmId(r.id), danger: true },
  ];

  if (resumes.length === 0) {
    return (
      <div className="library-page">
        <FirstRun
          eyebrow={<><Library size={13} /> Resume Library</>}
          title="One home for every version of your resume"
          subtitle="Build a master resume, then clone and tailor it per role. Scan any version against a role to see its real ATS match — so you always send your strongest one."
          actions={(
            <button className="fr-btn fr-btn-primary" onClick={onNewResumeClick}><Plus size={16} /> Create your first resume</button>
          )}
          steps={[
            { icon: Plus, title: 'Build it once', text: 'Create an ATS-ready master resume in the guided builder.' },
            { icon: Target, title: 'Tailor per role', text: 'Clone it and tweak keywords to fit each job you target.' },
            { icon: BarChart3, title: 'Scan to score', text: 'Run an ATS scan on any version to see its real match, then pick the best.' },
          ]}
          visual={<LibraryVisual />}
        />
      </div>
    );
  }

  return (
    <div className="library-page">
      <LibraryHeader total={resumes.length} activeCount={activeCount} onNewResumeClick={onNewResumeClick} />

      <LibraryToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        band={band}
        onBand={setBand}
        sort={sort}
        onSort={setSort}
        viewMode={viewMode}
        onViewMode={setViewMode}
      />

      <ResultMeta shown={visible.length} total={resumes.length} filters={filters} onClearAll={clearAll} />

      {visible.length === 0 ? (
        <LibraryEmptyState
          variant="no-results"
          query={search.trim()}
          onClearSearch={() => setSearch('')}
          onClearFilters={clearAll}
        />
      ) : viewMode === 'grid' ? (
        <div className="library-grid">
          {visible.map((r) => (
            <ResumeCard key={r.id} resume={r} selected={r.id === selectedId} onOpen={() => setSelectedId(r.id)} items={menuItems(r)} />
          ))}
        </div>
      ) : (
        <div className="library-list">
          {visible.map((r) => (
            <ResumeRow key={r.id} resume={r} selected={r.id === selectedId} onOpen={() => setSelectedId(r.id)} items={menuItems(r)} />
          ))}
        </div>
      )}

      {selected && (
        <ResumeDrawer
          resume={selected}
          onClose={() => setSelectedId(null)}
          onOpenBuilder={() => onEditInStudio(selected.id)}
          onClone={() => onClone(selected.id)}
          onSetActive={() => onSetActive(selected.id)}
          onDelete={() => setConfirmId(selected.id)}
          onScan={onScan}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          name={`${confirmTarget.role} Resume`}
          onConfirm={() => {
            onDelete(confirmTarget.id);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
