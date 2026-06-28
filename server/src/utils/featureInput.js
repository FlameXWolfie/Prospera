// Sanitisers for the user-owned feature data (resumes + applications).
//
// These build a clean object from ONLY the whitelisted keys present in the body,
// coercing every value to its expected type. Two reasons this matters:
//  1. Security — never spread req.body into a Mongoose doc. That would let a
//     client set `user`, `_id`, or smuggle operator objects ({ $gt: '' }) into
//     fields. Type coercion here neutralises NoSQL-injection payloads.
//  2. Partial updates — because only keys *present* in the body are copied, the
//     same function works for create (absent keys fall back to schema defaults)
//     and PATCH (absent keys are left untouched).
//
// A sanitiser may return `undefined` to mean "drop this field" (e.g. an invalid
// enum), so a bad value is ignored rather than overwriting good data.

const asString = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const asNumberOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const asBool = (v) => (typeof v === 'boolean' ? v : undefined);

const clampNum = (v, min, max, def) => {
  const n = asNumberOrNull(v);
  if (n === null) return def;
  return Math.min(max, Math.max(min, n));
};

// Accepts an ISO string (or Date) → Date; anything else (incl. null) → null.
const asDateOrNull = (v) => {
  if (typeof v !== 'string' && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const asStringArray = (v, maxItems, maxLen) =>
  (Array.isArray(v) ? v : [])
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim().slice(0, maxLen)) // cap EACH item, not just the count
    .filter(Boolean)
    .slice(0, maxItems);

const arrayOf = (v, maxItems, mapper) =>
  (Array.isArray(v) ? v : []).slice(0, maxItems).map(mapper);

// Skills are polymorphic: a plain string OR a group { category, items:[String] }.
// Mongoose `Mixed` disables type enforcement, so THIS is the only structural guard
// against NoSQL-operator / arbitrary-object injection — every item is coerced to
// one of those two shapes, never passed through. An uncategorised group collapses
// to bare strings; empty groups are dropped. Output is capped.
const asSkills = (v) => {
  const out = [];
  for (const item of (Array.isArray(v) ? v : []).slice(0, 200)) {
    if (out.length >= 200) break;
    if (typeof item === 'string') {
      const t = item.trim().slice(0, 80);
      if (t) out.push(t);
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      const category = asString(item.category, 64);
      const items = asStringArray(item.items, 100, 80);
      if (!items.length) continue;
      if (category) out.push({ category, items });
      else for (const it of items) out.push(it);
    }
  }
  return out;
};

export const APPLICATION_STAGES = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];

// Build an object from the keys that exist in `body`, running each through its
// sanitiser. Drops keys whose sanitiser returns undefined.
function pick(body, sanitisers) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const out = {};
  for (const [key, fn] of Object.entries(sanitisers)) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      const val = fn(b[key]);
      if (val !== undefined) out[key] = val;
    }
  }
  return out;
}

const RESUME_SANITISERS = {
  label: (v) => asString(v, 120),
  role: (v) => asString(v, 200) || 'Untitled resume',
  target: (v) => asString(v, 200),
  score: (v) => clampNum(v, 0, 100, 0),
  status: (v) => asString(v, 60) || 'Draft - Pending Review',
  summary: (v) => asString(v, 4000),
  experience: (v) => arrayOf(v, 50, (e) => ({
    company: asString(e?.company, 200),
    role: asString(e?.role, 200),
    period: asString(e?.period, 100),
    bullets: asStringArray(e?.bullets, 50, 500),
  })),
  education: (v) => arrayOf(v, 30, (e) => ({
    school: asString(e?.school, 200),
    degree: asString(e?.degree, 200),
    period: asString(e?.period, 100),
  })),
  projects: (v) => arrayOf(v, 30, (p) => ({
    name: asString(p?.name, 200),
    link: asString(p?.link, 300),
    bullets: asStringArray(p?.bullets, 50, 500),
  })),
  // Dynamic custom sections — arbitrary title + entries (heading/meta/bullets).
  sections: (v) => arrayOf(v, 20, (s) => ({
    title: asString(s?.title, 120),
    entries: arrayOf(s?.entries, 50, (e) => ({
      heading: asString(e?.heading, 300),
      meta: asString(e?.meta, 300),
      bullets: asStringArray(e?.bullets, 50, 500),
    })),
  })),
  skills: asSkills,
  isActive: asBool,
  template: (v) => asString(v, 40) || 'modern',
  accent: (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : '#4f46e5'),
  fontScale: (v) => clampNum(v, 0.6, 1.6, 1),
  pageMargin: (v) => clampNum(v, 0.3, 2, 1),
  name: (v) => asString(v, 120),
  email: (v) => asString(v, 200),
  phone: (v) => asString(v, 60),
  location: (v) => asString(v, 200),
  link: (v) => asString(v, 300),
  // Original uploaded file (base64, no data: prefix). Not trimmed — base64 is
  // whitespace-free; cap well under the 15mb JSON body limit. `undefined` for a
  // non-string drops it (never overwrite a stored file with garbage).
  fileData: (v) => (typeof v === 'string' ? v.slice(0, 16_000_000) : undefined),
  fileType: (v) => asString(v, 100),
  fileName: (v) => asString(v, 260),
};

const APPLICATION_SANITISERS = {
  company: (v) => asString(v, 200),
  role: (v) => asString(v, 200),
  location: (v) => asString(v, 200),
  salaryMin: asNumberOrNull,
  salaryMax: asNumberOrNull,
  stage: (v) => (APPLICATION_STAGES.includes(v) ? v : undefined),
  source: (v) => asString(v, 100),
  url: (v) => asString(v, 500),
  resumeId: (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 64) : null),
  excitement: (v) => clampNum(v, 0, 5, 3),
  appliedAt: asDateOrNull,
  nextStep: (v) => asString(v, 300),
  nextStepDate: asDateOrNull,
  notes: (v) => asString(v, 4000),
};

// Portfolio (one per user). Whitelist + coerce every field, same contract as the
// resume sanitizer (never spread req.body into the model).
const PORTFOLIO_SANITISERS = {
  template: (v) => asString(v, 40) || 'aurora',
  accent: (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : '#f97316'),
  name: (v) => asString(v, 120),
  headline: (v) => asString(v, 160),
  tagline: (v) => asString(v, 280),
  location: (v) => asString(v, 160),
  email: (v) => asString(v, 200),
  phone: (v) => asString(v, 60),
  website: (v) => asString(v, 300),
  about: (v) => asString(v, 4000),
  experience: (v) => arrayOf(v, 30, (e) => ({
    company: asString(e?.company, 200),
    role: asString(e?.role, 200),
    period: asString(e?.period, 100),
    location: asString(e?.location, 160),
    bullets: asStringArray(e?.bullets, 30, 500),
  })),
  projects: (v) => arrayOf(v, 40, (p) => ({
    name: asString(p?.name, 200),
    link: asString(p?.link, 300),
    bullets: asStringArray(p?.bullets, 30, 500),
    tags: asStringArray(p?.tags, 20, 40),
  })),
  education: (v) => arrayOf(v, 20, (e) => ({
    school: asString(e?.school, 200),
    degree: asString(e?.degree, 200),
    period: asString(e?.period, 100),
  })),
  skills: (v) => asStringArray(v, 80, 80),
  socials: (v) => arrayOf(v, 12, (s) => ({
    label: asString(s?.label, 40),
    url: asString(s?.url, 300),
  })),
};

// Recording a real ATS scan result: a numeric score + what it was scanned
// against. `scannedAt` is set server-side (never trusted from the client).
const SCAN_SANITISERS = {
  score: (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : undefined),
  scanTarget: (v) => asString(v, 120),
};

export const sanitizeResume = (body) => pick(body, RESUME_SANITISERS);
export const sanitizeApplication = (body) => pick(body, APPLICATION_SANITISERS);
export const sanitizePortfolio = (body) => pick(body, PORTFOLIO_SANITISERS);
export const sanitizeScan = (body) => pick(body, SCAN_SANITISERS);
