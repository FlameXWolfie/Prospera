// Application-tracker domain logic. All Date math lives in these module-scope
// helpers (never inline in render), so the kanban can call relativeDate/dueState
// during render the same way LibraryPage calls ago() — react-compiler safe.

// The pipeline. Colors map to existing design tokens; icons are mapped in the
// page (kept out of here so this stays serializable and lint-clean).
export const STAGES = [
  { id: 'saved', label: 'Saved', color: '#64748b', bg: '#f1f5f9' },
  { id: 'applied', label: 'Applied', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'interviewing', label: 'Interviewing', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'offer', label: 'Offer', color: '#10b981', bg: '#ecfdf5' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
];

export const STAGE_BY_ID = STAGES.reduce((m, s) => { m[s.id] = s; return m; }, {});

// Total comp used for the Offer column's "$Xk total" and salary sort.
export function comp(app) {
  return app.salaryMax ?? app.salaryMin ?? 0;
}

const kFmt = (n) => `${Math.round(n / 1000)}`;

export function formatSalary(min, max) {
  if (min != null && max != null) return `$${kFmt(min)}–${kFmt(max)}k`;
  if (min != null) return `$${kFmt(min)}k+`;
  if (max != null) return `$${kFmt(max)}k`;
  return '';
}

// midnight-aligned day difference (target − today): negative = past.
function dayDiff(iso) {
  const a = new Date(iso); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
}

const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000));

export function dueState(iso) {
  if (!iso) return null;
  const d = dayDiff(iso);
  if (d < 0) return 'overdue';
  if (d <= 3) return 'soon';
  return 'later';
}

export function dueLabel(iso) {
  if (!iso) return '';
  const d = dayDiff(iso);
  if (d < 0) return `Overdue ${-d}d`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d}d`;
}

// "Applied 6d ago" / "Applied today" / "Saved" (null appliedAt).
export function relativeDate(iso) {
  if (!iso) return 'Saved';
  const days = daysSince(iso);
  if (days === 0) return 'Applied today';
  if (days === 1) return 'Applied yesterday';
  if (days < 7) return `Applied ${days}d ago`;
  if (days < 14) return 'Applied 1w ago';
  if (days < 30) return `Applied ${Math.floor(days / 7)}w ago`;
  return `Applied ${Math.floor(days / 30)}mo ago`;
}

export function computeStats(apps) {
  const byStage = { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 };
  apps.forEach((a) => { if (byStage[a.stage] !== undefined) byStage[a.stage] += 1; });
  const submitted = byStage.applied + byStage.interviewing + byStage.offer + byStage.rejected;
  return {
    total: apps.length,
    active: byStage.applied + byStage.interviewing,
    interviews: byStage.interviewing,
    offers: byStage.offer,
    responseRate: submitted ? Math.round(((byStage.interviewing + byStage.offer) / submitted) * 100) : null,
    byStage,
  };
}

// Short context line under each column header.
export function stageAggregate(apps, stageId) {
  const items = apps.filter((a) => a.stage === stageId);
  if (stageId === 'saved') return `${items.length} to apply`;
  if (stageId === 'applied') {
    if (!items.length) return 'none yet';
    const oldest = Math.max(...items.map((a) => (a.appliedAt ? daysSince(a.appliedAt) : 0)));
    return `oldest ${oldest}d`;
  }
  if (stageId === 'interviewing') {
    const up = items.filter((a) => a.nextStepDate && new Date(a.nextStepDate) >= Date.now()).length;
    return up ? `${up} upcoming` : `${items.length} active`;
  }
  if (stageId === 'offer') {
    const sum = items.reduce((s, a) => s + comp(a), 0);
    return sum ? `$${kFmt(sum)}k total` : `${items.length} offer${items.length === 1 ? '' : 's'}`;
  }
  if (stageId === 'rejected') return `${items.length} this cycle`;
  return '';
}

// Last `months` calendar buckets (oldest→newest) of submitted applications, for
// the dashboard trend chart. Uses `new Date()` here at module scope (never inline
// in render) — same react-compiler-safe idiom as relativeDate/dueState above.
export function monthlyTrend(apps, months = 6) {
  const now = new Date();
  const buckets = [];
  const idx = {};
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    idx[key] = buckets.length;
    buckets.push({ label: d.toLocaleString('en-US', { month: 'short' }), applications: 0, interviews: 0 });
  }
  apps.forEach((a) => {
    if (a.stage === 'saved') return; // only submitted apps count toward the trend
    const iso = a.appliedAt || a.createdAt;
    if (!iso) return;
    const d = new Date(iso);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in idx) {
      buckets[idx[key]].applications += 1;
      if (a.stage === 'interviewing' || a.stage === 'offer') buckets[idx[key]].interviews += 1;
    }
  });
  return buckets;
}

export function followUpsDue(apps) {
  return apps.filter((a) => {
    const d = dueState(a.nextStepDate);
    return d === 'overdue' || d === 'soon';
  }).length;
}

export function filterSort(apps, { search, stageFilter, needsAction, sort }) {
  const q = (search || '').trim().toLowerCase();
  const out = apps.filter((a) => {
    if (q) {
      const hay = [a.company, a.role, a.location, a.notes, a.source].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (stageFilter && a.stage !== stageFilter) return false;
    if (needsAction) {
      const d = dueState(a.nextStepDate);
      if (d !== 'overdue' && d !== 'soon') return false;
    }
    return true;
  });
  const by = {
    recent: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    salary: (a, b) => comp(b) - comp(a),
    company: (a, b) => (a.company || '').localeCompare(b.company || ''),
    excitement: (a, b) => (b.excitement || 0) - (a.excitement || 0),
  };
  return [...out].sort(by[sort] || by.recent);
}
