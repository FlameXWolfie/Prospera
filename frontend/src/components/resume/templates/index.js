// Maps template id → React component, and normalizes any resume/draft object into
// the shape every template renders. Kept separate from src/lib/resumeTemplates.js
// (which holds metadata-only constants) so non-React modules don't import JSX.
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';
import ClassicTemplate from './ClassicTemplate';
import SidebarTemplate from './SidebarTemplate';
import CompactTemplate from './CompactTemplate';
import TimelineTemplate from './TimelineTemplate';
import { normalizeSkillsForRender } from '../../../lib/resume/skills';

export const TEMPLATE_COMPONENTS = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  classic: ClassicTemplate,
  sidebar: SidebarTemplate,
  compact: CompactTemplate,
  timeline: TimelineTemplate,
};

export function getTemplateComponent(id) {
  return TEMPLATE_COMPONENTS[id] || ModernTemplate;
}

const str = (v) => (typeof v === 'string' ? v : '');
const arr = (v) => (Array.isArray(v) ? v : []);

// One normalized shape for every template: safe strings + arrays, blank bullets
// dropped. Identity placeholders are left to the template (e.g. "Your Name").
export function normalizeResume(r = {}) {
  // Skills are polymorphic: `skills` is the flat list (flat fallback render +
  // matched highlight + counts); `skillGroups` is non-null only when a real
  // category exists, in which case templates render the grouped layout.
  const sk = normalizeSkillsForRender(r.skills);
  return {
    name: str(r.name),
    role: str(r.role),
    target: str(r.target),
    email: str(r.email),
    phone: str(r.phone),
    location: str(r.location),
    link: str(r.link),
    summary: str(r.summary),
    experience: arr(r.experience).map((e) => ({
      company: str(e?.company),
      role: str(e?.role),
      period: str(e?.period),
      location: str(e?.location),
      bullets: arr(e?.bullets).map(str).filter(Boolean),
    })).filter((e) => e.company || e.role || e.bullets.length),
    education: arr(r.education).map((e) => ({
      school: str(e?.school),
      degree: str(e?.degree),
      period: str(e?.period),
    })).filter((e) => e.school || e.degree),
    projects: arr(r.projects).map((p) => ({
      name: str(p?.name),
      link: str(p?.link),
      bullets: arr(p?.bullets).map(str).filter(Boolean),
    })).filter((p) => p.name || p.bullets.length),
    skills: sk.flat,
    skillGroups: sk.grouped ? sk.groups : null,
    // Dynamic custom sections (Achievements, Certifications, …) rendered generically.
    sections: arr(r.sections).map((s) => ({
      title: str(s?.title),
      entries: arr(s?.entries).map((e) => ({
        heading: str(e?.heading),
        meta: str(e?.meta),
        bullets: arr(e?.bullets).map(str).filter(Boolean),
      })).filter((e) => e.heading || e.bullets.length),
    })).filter((s) => s.title && s.entries.length),
  };
}
