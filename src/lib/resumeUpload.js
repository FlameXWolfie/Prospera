// Build a scannable/enhanceable resume object from an uploaded file's text.
// Skills are pulled with the same vocabulary the scanner uses, so an uploaded
// resume can be matched and improved for real. Date calls live here (module
// scope), never in render.

import { extractSkills } from './atsKeywords';

// Turn "alex_backend_resume.pdf" into a readable role like "Alex Backend".
export function roleFromFilename(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const cleaned = base.replace(/\b(resume|cv|final|v?\d+|copy)\b/gi, '').replace(/\s+/g, ' ').trim();
  const label = cleaned || base || 'Uploaded resume';
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resumeFromUpload(file, text, isFirst) {
  const skills = extractSkills(text);
  const summary = text.replace(/\s+/g, ' ').trim().slice(0, 280);
  return {
    id: String(Date.now()),
    role: roleFromFilename(file.name),
    target: '',
    score: Math.min(95, 55 + skills.length * 4),
    status: 'Draft - Pending Review',
    lastAppended: new Date().toISOString(),
    summary,
    experience: [],
    skills,
    isActive: isFirst,
    uploaded: true,
  };
}
