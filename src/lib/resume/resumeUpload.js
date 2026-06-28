// Build a scannable/enhanceable resume object from an uploaded file's text, using
// the heuristic parser so name/contact/skills/summary/experience are pulled out.
// Date calls live here (module scope), never in render.
import { parseResumeText } from './resumeParse';
import { DEFAULT_TEMPLATE, DEFAULT_ACCENT } from './resumeTemplates';

// Turn "alex_backend_resume.pdf" into a readable role like "Alex Backend".
export function roleFromFilename(name) {
  const base = (name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const cleaned = base.replace(/\b(resume|cv|final|v?\d+|copy)\b/gi, '').replace(/\s+/g, ' ').trim();
  const label = cleaned || base || 'Uploaded resume';
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Build a resume object from already-structured fields (Mistral- or heuristic-parsed).
// `source` (from readSourceFile) carries the original PDF so the preview can show
// the user's real resume; it's empty for non-PDF uploads.
export function resumeFromParsed(file, parsed, isFirst, source = {}) {
  const p = parsed || {};
  const skills = Array.isArray(p.skills) ? p.skills : [];
  // No fabricated score — a resume has no ATS score until it's actually scanned.
  return {
    id: String(Date.now()),
    label: '',
    role: p.role || roleFromFilename(file.name),
    target: p.target || '',
    status: 'Draft - Pending Review',
    lastAppended: new Date().toISOString(),
    summary: p.summary || '',
    experience: Array.isArray(p.experience) ? p.experience : [],
    education: Array.isArray(p.education) ? p.education : [],
    projects: [],
    skills,
    name: p.name || '',
    email: p.email || '',
    phone: p.phone || '',
    location: p.location || '',
    link: p.link || '',
    template: DEFAULT_TEMPLATE,
    accent: DEFAULT_ACCENT,
    fileData: source.fileData || '',
    fileType: source.fileType || '',
    fileName: source.fileName || '',
    isActive: isFirst,
    uploaded: true,
  };
}

export function resumeFromUpload(file, text, isFirst) {
  const parsed = parseResumeText(text);
  return {
    id: String(Date.now()),
    role: parsed.role || roleFromFilename(file.name),
    target: parsed.target || '',
    status: 'Draft - Pending Review',
    lastAppended: new Date().toISOString(),
    summary: parsed.summary,
    experience: parsed.experience,
    education: parsed.education,
    projects: parsed.projects,
    skills: parsed.skills,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    location: parsed.location,
    link: parsed.link,
    template: DEFAULT_TEMPLATE,
    accent: DEFAULT_ACCENT,
    isActive: isFirst,
    uploaded: true,
  };
}
