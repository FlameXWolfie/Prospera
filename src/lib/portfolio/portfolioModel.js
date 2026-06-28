// Portfolio shape + prefill-from-resume + normalize-for-render. Pure (no Date/
// random in the values that matter); transient ids come from a module counter,
// called only from event handlers / load, never during render.
import { flattenSkills } from '../resume/skills';

let _seq = 0;
export const newPortfolioId = () => `pf${(_seq += 1)}`;

const str = (v) => (typeof v === 'string' ? v : '');
const arr = (v) => (Array.isArray(v) ? v : []);

const firstSentence = (s) => {
  const t = (s || '').trim();
  if (!t) return '';
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, 180);
};

// Best-guess a social label from a URL so the prefilled link gets a real name.
function socialFromUrl(url) {
  const u = (url || '').toLowerCase();
  if (!url) return null;
  if (u.includes('linkedin')) return { label: 'LinkedIn', url };
  if (u.includes('github')) return { label: 'GitHub', url };
  if (u.includes('twitter') || u.includes('x.com')) return { label: 'Twitter', url };
  if (u.includes('dribbble')) return { label: 'Dribbble', url };
  if (u.includes('behance')) return { label: 'Behance', url };
  if (u.includes('medium') || u.includes('dev.to') || u.includes('hashnode')) return { label: 'Blog', url };
  return { label: 'Website', url };
}

export function emptyPortfolio() {
  return {
    template: 'aurora',
    accent: '#f97316',
    name: '', headline: '', tagline: '', location: '', email: '', phone: '', website: '',
    about: '',
    experience: [], projects: [], education: [], skills: [], socials: [],
  };
}

// Map a resume → a portfolio draft (the "use what we already know" prefill).
export function portfolioFromResume(resume) {
  const r = resume || {};
  const website = (r.link || '').trim();
  const socials = [];
  const s = socialFromUrl(website);
  if (s) socials.push(s);
  return {
    ...emptyPortfolio(),
    name: r.name || '',
    headline: r.role || '',
    tagline: firstSentence(r.summary) || r.target || '',
    location: r.location || '',
    email: r.email || '',
    phone: r.phone || '',
    website,
    about: r.summary || '',
    experience: arr(r.experience).map((e) => ({
      company: str(e.company), role: str(e.role), period: str(e.period), location: str(e.location),
      bullets: arr(e.bullets).filter(Boolean),
    })),
    projects: arr(r.projects).map((p) => ({
      name: str(p.name), link: str(p.link), bullets: arr(p.bullets).filter(Boolean), tags: [],
    })),
    education: arr(r.education).map((e) => ({ school: str(e.school), degree: str(e.degree), period: str(e.period) })),
    skills: flattenSkills(r.skills),
    socials,
  };
}

const withIds = (a) => arr(a).map((x) => ({ ...x, _id: x._id || newPortfolioId() }));

// Ensure a complete, editable shape (defaults + transient list ids) for the builder.
export function portfolioDraft(p) {
  const base = { ...emptyPortfolio(), ...(p || {}) };
  return {
    ...base,
    experience: withIds(base.experience),
    projects: withIds(base.projects),
    education: withIds(base.education),
    socials: withIds(base.socials),
    skills: arr(base.skills),
  };
}

// The clean content (no transient ids) sent to the server on save. The sanitizer
// drops unknown keys server-side too, but we trim here for a tidy payload.
export function portfolioContent(draft) {
  const d = draft || {};
  return {
    template: d.template || 'aurora',
    accent: d.accent || '#f97316',
    name: str(d.name).trim(),
    headline: str(d.headline).trim(),
    tagline: str(d.tagline).trim(),
    location: str(d.location).trim(),
    email: str(d.email).trim(),
    phone: str(d.phone).trim(),
    website: str(d.website).trim(),
    about: str(d.about).trim(),
    experience: arr(d.experience).map((e) => ({
      company: str(e.company).trim(), role: str(e.role).trim(), period: str(e.period).trim(), location: str(e.location).trim(),
      bullets: arr(e.bullets).map((b) => str(b).trim()).filter(Boolean),
    })).filter((e) => e.company || e.role || e.bullets.length),
    projects: arr(d.projects).map((p) => ({
      name: str(p.name).trim(), link: str(p.link).trim(),
      bullets: arr(p.bullets).map((b) => str(b).trim()).filter(Boolean),
      tags: arr(p.tags).map((t) => str(t).trim()).filter(Boolean),
    })).filter((p) => p.name || p.bullets.length),
    education: arr(d.education).map((e) => ({ school: str(e.school).trim(), degree: str(e.degree).trim(), period: str(e.period).trim() }))
      .filter((e) => e.school || e.degree),
    skills: arr(d.skills).map((x) => str(x).trim()).filter(Boolean),
    socials: arr(d.socials).map((s) => ({ label: str(s.label).trim(), url: str(s.url).trim() })).filter((s) => s.url),
  };
}

// Safe shape for templates (drops empties).
export function normalizePortfolio(p = {}) {
  const c = portfolioContent(p);
  // portfolioContent already trims + filters; strip _id is implicit. Reuse it.
  return c;
}

export const hasPortfolioContent = (p) => Boolean(
  p && (str(p.name).trim() || str(p.about).trim() || arr(p.experience).length || arr(p.projects).length || arr(p.skills).length),
);

// Complete, array-guaranteed shape WITHOUT filtering empties — what the inline
// editor renders so blank items stay visible and editable (normalizePortfolio is
// for the clean view/published render).
export function ensurePortfolioShape(p) {
  const b = { ...emptyPortfolio(), ...(p || {}) };
  return {
    ...b,
    experience: arr(b.experience).map((e) => ({ ...e, bullets: arr(e.bullets) })),
    projects: arr(b.projects).map((p2) => ({ ...p2, bullets: arr(p2.bullets), tags: arr(p2.tags) })),
    education: arr(b.education),
    socials: arr(b.socials),
    skills: arr(b.skills),
  };
}

// Blank items for the inline "+ Add" controls.
export const emptyExperience = () => ({ _id: newPortfolioId(), company: '', role: '', period: '', location: '', bullets: [''] });
export const emptyProject = () => ({ _id: newPortfolioId(), name: '', link: '', bullets: [''], tags: [] });
export const emptyEducation = () => ({ _id: newPortfolioId(), school: '', degree: '', period: '' });
export const emptySocial = () => ({ _id: newPortfolioId(), label: '', url: '' });
