// Resume builder model + scoring. Shared by BuildResumePage (the draft lives in
// DashboardPage and is edited here) and ResumeDocument (CANDIDATE identity).
//
// All Date/id calls live in module-scope helpers (makeId/nowISO) and are called
// ONLY from draftToResume (invoked in the Save event handler) — never in render,
// so react-compiler stays happy.

import { scanRole, profileForResume } from './atsKeywords';
import { flattenSkills, toSkillGroups, fromSkillGroups } from './skills';
import { DEFAULT_TEMPLATE, DEFAULT_ACCENT } from './resumeTemplates';
import { SAMPLE_RESUME } from './resumeSample';

// Signed-in user identity. Seeds new drafts AND is the fallback the live preview
// uses for resumes that pre-date the builder (the 10 seed resumes have no name).
export const CANDIDATE = {
  name: 'Alex Johnson',
  email: 'alex.johnson@mail.com',
  phone: '',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
};

const makeId = () => String(Date.now());
const nowISO = () => new Date().toISOString();

// A fresh, blank draft. `template: null` means "no template chosen yet" → the
// builder shows the template gallery. Identity is empty so the live preview shows
// placeholders ("Your Name") until the user fills it or picks a sample.
export function emptyDraft() {
  return {
    name: '',
    role: '',
    target: '',
    email: '',
    phone: '',
    location: '',
    link: '',
    summary: '',
    experience: [{ _id: '_e0', company: '', role: '', period: '', bullets: [''] }],
    education: [],
    projects: [],
    sections: [],
    skills: [],
    roleId: 'swe',
    template: null,
    accent: DEFAULT_ACCENT,
  };
}

// Transient client-only id for stable React keys on editable/reorderable entries
// (stripped at save by draftToResume; ignored by the renderer/back end). Called
// only from event handlers and the gallery/import flows — never during render.
let _entrySeq = 0;
export const newEntryId = () => `e${(_entrySeq += 1)}`;
const withIds = (arr) => (arr || []).map((e) => ({ ...e, _id: e._id || newEntryId() }));
// Custom sections + their entries each need stable keys for the builder.
const withSectionIds = (sections) => (sections || []).map((s) => ({
  _id: s._id || newEntryId(),
  title: s.title || '',
  entries: withIds((s.entries || []).map((e) => ({ heading: e.heading || '', meta: e.meta || '', bullets: e.bullets || [] }))),
}));

// Deep-cloned helper so editing a draft never mutates a shared constant.
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Picking a template in the gallery → start from the polished example (Overleaf
// style) so the user edits real content instead of a blank page.
export function sampleDraft(templateId, accent) {
  const s = clone(SAMPLE_RESUME);
  return {
    ...emptyDraft(),
    ...s,
    experience: withIds(s.experience),
    education: withIds(s.education),
    projects: withIds(s.projects),
    template: templateId || DEFAULT_TEMPLATE,
    accent: accent || DEFAULT_ACCENT,
  };
}

// "Start blank" → empty draft with a chosen template (skips the gallery).
export function blankDraft(templateId, accent) {
  return { ...emptyDraft(), template: templateId || DEFAULT_TEMPLATE, accent: accent || DEFAULT_ACCENT };
}

// Upload/paste → map parsed resume fields into a draft, keeping a usable shape.
export function draftFromParsed(parsed = {}, templateId, accent) {
  const base = emptyDraft();
  const experience = (parsed.experience || []).length
    ? withIds(parsed.experience.map((e) => ({
        company: e.company || '',
        role: e.role || '',
        period: e.period || '',
        bullets: (e.bullets || []).length ? e.bullets : [''],
      })))
    : base.experience;
  return {
    ...base,
    name: parsed.name || '',
    role: parsed.role || '',
    target: parsed.target || '',
    email: parsed.email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    link: parsed.link || '',
    summary: parsed.summary || '',
    experience,
    education: withIds(parsed.education || []),
    projects: withIds(parsed.projects || []),
    skills: parsed.skills || [],
    sections: withSectionIds(parsed.sections),
    template: templateId || DEFAULT_TEMPLATE,
    accent: accent || DEFAULT_ACCENT,
  };
}

// ── derived metrics (PURE — safe to call from useMemo in render) ─────────────

const trimmed = (s) => (s || '').trim();
const hasText = (s) => trimmed(s).length > 0;

// A role counts as "real" once it has a company, a title, or any non-blank bullet.
function realRoles(experience) {
  return (experience || []).filter(
    (e) => hasText(e.company) || hasText(e.role) || (e.bullets || []).some(hasText)
  );
}

function allBullets(experience) {
  return (experience || []).flatMap((e) => (e.bullets || []).filter(hasText));
}

// 0–100 ATS-readiness, weighted across the resume. This is the number the ring
// shows live AND the score the saved resume keeps (replacing the old random one).
export function computeReadiness(draft, scan) {
  const headingPts = (hasText(draft.name) ? 7.5 : 0) + (hasText(draft.role) ? 7.5 : 0); // 15
  const summaryPts = Math.min(trimmed(draft.summary).length / 80, 1) * 15;               // 15
  const roles = realRoles(draft.experience);
  const bullets = allBullets(draft.experience);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const expPts = (roles.length ? 10 : 0) + (bullets.length ? (quantified / bullets.length) : 0) * 15; // 25
  const eduPts = (draft.education || []).length ? 10 : 0;                                 // 10
  const skillsPts = Math.min(flattenSkills(draft.skills).length / 8, 1) * 15;             // 15
  const keywordPts = ((scan && scan.score) || 0) / 100 * 20;                              // 20
  return Math.round(headingPts + summaryPts + expPts + eduPts + skillsPts + keywordPts);
}

// Per-section status for the rail: a pip (done/partial/empty) + a short count badge.
export function deriveSectionStatus(draft, scan) {
  const filledContacts = [draft.name, draft.role, draft.email, draft.phone, draft.location, draft.link].filter(hasText).length;
  const summaryLen = trimmed(draft.summary).length;
  const roles = realRoles(draft.experience);
  const bullets = allBullets(draft.experience);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const eduCount = (draft.education || []).length;
  const projCount = (draft.projects || []).length;
  const skillCount = flattenSkills(draft.skills).length;
  const covered = scan ? scan.matched.length : 0;
  const target = scan ? scan.detected.length : 0;

  return {
    personal: {
      pip: hasText(draft.name) && hasText(draft.role) ? 'done' : (hasText(draft.name) || hasText(draft.role) ? 'partial' : 'empty'),
      badge: `${filledContacts}/6 fields`,
    },
    summary: {
      pip: summaryLen >= 80 ? 'done' : (summaryLen > 0 ? 'partial' : 'empty'),
      badge: summaryLen ? `${summaryLen} chars` : 'Empty',
    },
    experience: {
      pip: roles.length && quantified ? 'done' : (roles.length ? 'partial' : 'empty'),
      badge: roles.length ? `${roles.length} role${roles.length === 1 ? '' : 's'}` : 'Empty',
    },
    education: {
      pip: eduCount ? 'done' : 'empty',
      badge: eduCount ? `${eduCount} entr${eduCount === 1 ? 'y' : 'ies'}` : 'Optional',
    },
    skills: {
      pip: skillCount >= 5 ? 'done' : (skillCount ? 'partial' : 'empty'),
      badge: skillCount ? `${skillCount} skill${skillCount === 1 ? '' : 's'}` : 'Empty',
    },
    projects: {
      pip: projCount ? 'done' : 'empty',
      badge: projCount ? `${projCount} project${projCount === 1 ? '' : 's'}` : 'Optional',
    },
    sections: {
      pip: (draft.sections || []).length ? 'done' : 'empty',
      badge: (draft.sections || []).length ? `${draft.sections.length} section${draft.sections.length === 1 ? '' : 's'}` : 'Optional',
    },
    keywords: { covered, target },
  };
}

// ── draft ↔ resume converters ────────────────────────────────────────────────

// The cleaned CONTENT fields of a draft (no id/score/status/timestamps) — strips
// placeholder/blank entries, trims, dedupes skills. Used both as the body of an
// in-place autosave PATCH (editing an existing resume) and as the base of
// draftToResume (creating a new one). PURE.
export function resumeContentFromDraft(draft) {
  const experience = realRoles(draft.experience).map((e) => ({
    company: trimmed(e.company),
    role: trimmed(e.role),
    period: trimmed(e.period),
    bullets: (e.bullets || []).map(trimmed).filter(Boolean),
  }));
  const education = (draft.education || [])
    .filter((ed) => hasText(ed.school) || hasText(ed.degree))
    .map((ed) => ({ school: trimmed(ed.school), degree: trimmed(ed.degree), period: trimmed(ed.period) }));
  const projects = (draft.projects || [])
    .filter((p) => hasText(p.name))
    .map((p) => ({ name: trimmed(p.name), link: trimmed(p.link), bullets: (p.bullets || []).map(trimmed).filter(Boolean) }));

  // Skills are polymorphic (loose strings + { category, items } groups). Normalise
  // to canonical groups then back to the wire shape — fromSkillGroups dedupes and
  // collapses to a flat array when no category exists (so flat resumes stay flat).
  const skills = fromSkillGroups(toSkillGroups(draft.skills));

  const sections = (draft.sections || []).map((s) => ({
    title: trimmed(s.title),
    entries: (s.entries || []).map((e) => ({
      heading: trimmed(e.heading),
      meta: trimmed(e.meta),
      bullets: (e.bullets || []).map(trimmed).filter(Boolean),
    })).filter((e) => e.heading || e.meta || e.bullets.length),
  })).filter((s) => s.title && s.entries.length);

  return {
    role: trimmed(draft.role) || 'Untitled resume',
    target: trimmed(draft.target),
    summary: trimmed(draft.summary),
    experience,
    education,
    projects,
    sections,
    skills,
    name: trimmed(draft.name),
    email: trimmed(draft.email),
    phone: trimmed(draft.phone),
    location: trimmed(draft.location),
    link: trimmed(draft.link),
    template: draft.template || DEFAULT_TEMPLATE,
    accent: draft.accent || DEFAULT_ACCENT,
  };
}

// New resume from a draft (impure: id + date — called only from the Save handler).
export function draftToResume(draft, score, label) {
  const content = resumeContentFromDraft(draft);
  return {
    id: makeId(),
    label: trimmed(label) || content.role,
    score,
    status: 'Draft - Pending Review',
    lastAppended: nowISO(),
    isActive: false,
    ...content,
  };
}

// Inverse of draftToResume: load a saved resume INTO the builder draft so the
// Studio can edit it. Adds transient `_id`s for the editable lists, infers the
// target-role profile, and carries `sourceId` so save knows to update-in-place
// (autosave) rather than create a duplicate.
export function draftFromResume(resume) {
  const r = resume || {};
  const experience = (r.experience || []).length
    ? withIds(r.experience.map((e) => ({
        company: e.company || '',
        role: e.role || '',
        period: e.period || '',
        bullets: (e.bullets || []).length ? e.bullets : [''],
      })))
    : emptyDraft().experience;
  return {
    ...emptyDraft(),
    name: r.name || '',
    role: r.role || '',
    target: r.target || '',
    email: r.email || '',
    phone: r.phone || '',
    location: r.location || '',
    link: r.link || '',
    summary: r.summary || '',
    experience,
    education: withIds(r.education || []),
    projects: withIds(r.projects || []),
    skills: r.skills || [],
    sections: withSectionIds(r.sections),
    roleId: profileForResume(r).id,
    template: r.template || DEFAULT_TEMPLATE,
    accent: r.accent || DEFAULT_ACCENT,
    sourceId: r.id, // editing an existing resume → autosave in place
  };
}

// Convenience: the keyword scan for a draft against its target role profile.
export function scanDraft(keywords, draft) {
  return scanRole(keywords, draft);
}
