// Heuristic resume parser: turns raw resume text (pasted, or extracted from an
// uploaded .txt/.pdf) into draft fields, so "upload your resume" actually fills
// the builder. Contact info + skills + summary are reliable; experience/education
// are best-effort. No NLP — regex + section heuristics. All pure (no Date/random).
import { extractSkills } from './atsKeywords';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /((https?:\/\/)?(www\.)?linkedin\.com\/[^\s,|]+)/i;
const GITHUB_RE = /((https?:\/\/)?(www\.)?github\.com\/[^\s,|]+)/i;
const SITE_RE = /((https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|io|dev|me|net|org|app|co)(\/[^\s,|]*)?)/i;
const LOCATION_RE = /\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/;
const MONTHS = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
const DATEPT = `(?:(?:${MONTHS})\\s*)?(?:19|20)\\d{2}|present|current`;
// Matches a single date OR a range ("2021 - Present", "Jan 2020 — Dec 2021") WITHOUT
// greedily swallowing the rest of the line (the old `.*` did, dropping the role).
const RANGE_RE = new RegExp(`(?:${DATEPT})(?:\\s*(?:[–—-]|to)\\s*(?:${DATEPT}))?`, 'i');
const extractPeriod = (line) => { const m = line.match(RANGE_RE); return m ? m[0].trim() : ''; };
const stripEdges = (s) => s.replace(/^\s*[|·–—-]\s*/, '').replace(/\s*[|·–—-]\s*$/, '').trim();

const SECTION_WORDS = {
  summary: /^(summary|profile|objective|about( me)?)\b/i,
  experience: /^(experience|work experience|employment|professional experience|work history)\b/i,
  education: /^(education|academic)\b/i,
  skills: /^(skills|technical skills|core competencies|technologies)\b/i,
  projects: /^(projects|personal projects|selected projects)\b/i,
};

const looksLikeName = (l) =>
  l.split(/\s+/).length <= 4 && /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){0,3}$/.test(l);

const isBullet = (l) => /^[•\-*▪◦·‣]/.test(l) || /^\s{0,3}[-*]\s/.test(l);
const stripBullet = (l) => l.replace(/^[\s•\-*▪◦·‣]+/, '').trim();

function detectSection(line) {
  for (const [key, re] of Object.entries(SECTION_WORDS)) {
    if (re.test(line) && line.length < 40) return key;
  }
  return null;
}

// A short, capitalised, non-bullet line that reads like a section heading but
// isn't one of the known ones (Achievements, Certifications, Awards, …). Only
// consulted AFTER the first known section so the name/role header isn't split.
function looksLikeHeading(line) {
  if (!line || isBullet(line) || line.length > 40) return false;
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || /[.!?]$/.test(line)) return false;
  const words = line.split(/\s+/);
  if (words.length > 6) return false;
  const allCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
  const titleCase = words.every((w) => /^[A-Z0-9&/()+'-]/.test(w));
  return allCaps || titleCase;
}

// Split into the known sections (keyed) PLUS an ordered list of arbitrary custom
// sections, so nothing in the resume is silently dropped.
function splitSections(lines) {
  const known = { header: [] };
  const custom = []; // [{ title, lines: [] }]
  let bucket = known.header;
  let started = false; // becomes true once we hit the first real section heading
  for (const line of lines) {
    const sec = detectSection(line);
    if (sec) { started = true; known[sec] = known[sec] || []; bucket = known[sec]; continue; }
    if (started && looksLikeHeading(line)) { const c = { title: line.trim(), lines: [] }; custom.push(c); bucket = c.lines; continue; }
    bucket.push(line);
  }
  return { known, custom };
}

// Generic "heading + meta + bullets" entries — a non-bullet line starts an entry,
// following bullets attach to it.
function parseGenericEntries(lines) {
  const entries = [];
  let cur = null;
  for (const line of lines) {
    if (!line) continue;
    if (isBullet(line)) { if (!cur) cur = { heading: '', meta: '', bullets: [] }; cur.bullets.push(stripBullet(line)); continue; }
    if (cur && (cur.heading || cur.bullets.length)) entries.push(cur);
    const meta = extractPeriod(line);
    cur = { heading: stripEdges(meta ? line.replace(meta, '') : line), meta: meta.trim(), bullets: [] };
  }
  if (cur && (cur.heading || cur.bullets.length)) entries.push(cur);
  return entries.slice(0, 20).map((e) => ({ ...e, bullets: e.bullets.slice(0, 10) }));
}

function parseProjects(lines) {
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (!line) continue;
    if (isBullet(line)) { if (!cur) cur = { name: '', link: '', bullets: [] }; cur.bullets.push(stripBullet(line)); continue; }
    if (cur && (cur.name || cur.bullets.length)) out.push(cur);
    const link = (line.match(SITE_RE) || [''])[0];
    cur = { name: stripEdges(line), link: link.replace(/^https?:\/\//, ''), bullets: [] };
  }
  if (cur && (cur.name || cur.bullets.length)) out.push(cur);
  return out.slice(0, 8).map((p) => ({ ...p, bullets: p.bullets.slice(0, 8) }));
}

function parseExperience(lines) {
  const entries = [];
  let cur = null;
  for (const line of lines) {
    if (!line) continue;
    if (isBullet(line)) {
      if (!cur) cur = { company: '', role: '', period: '', location: '', bullets: [] };
      cur.bullets.push(stripBullet(line));
      continue;
    }
    // A non-bullet line starts a new entry. Pull the date range out (dates may be
    // at the start or end of the line) without consuming the role/company text.
    if (cur && (cur.role || cur.company || cur.bullets.length)) { entries.push(cur); }
    const period = extractPeriod(line);
    const head = stripEdges(period ? line.replace(period, '') : line);
    // "Role at Company" / "Role — Company" / "Company - Role"
    const m = head.split(/\s+(?:at|@|[|·–—-])\s+/);
    cur = {
      role: (m[0] || '').trim(),
      company: (m[1] || '').trim(),
      period: period.trim(),
      location: '',
      bullets: [],
    };
  }
  if (cur && (cur.role || cur.company || cur.bullets.length)) entries.push(cur);
  return entries.slice(0, 6).map((e) => ({ ...e, bullets: e.bullets.slice(0, 6) }));
}

function parseEducation(lines) {
  const entries = [];
  for (const line of lines) {
    if (!line || isBullet(line)) continue;
    const period = extractPeriod(line);
    const head = stripEdges(period ? line.replace(period, '') : line);
    // "School — Degree" (dash separates) OR "School, Degree" (comma) — pick the
    // right delimiter so a school's own ", Location" never lands in the degree.
    let school = head;
    let degree = '';
    if (/\s[–—-]\s/.test(head)) {
      const [s, ...d] = head.split(/\s+[–—-]\s+/);
      school = s.trim();
      degree = d.join(' - ').trim();
    } else if (head.includes(',')) {
      const ci = head.indexOf(',');
      school = head.slice(0, ci).trim();
      degree = head.slice(ci + 1).trim();
    }
    if (school) entries.push({ school, degree, period });
  }
  return entries.slice(0, 4);
}

export function parseResumeText(text) {
  const raw = String(text || '');
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, '').trim());
  const nonEmpty = lines.filter(Boolean);

  const email = (raw.match(EMAIL_RE) || [''])[0];
  const phone = (raw.match(PHONE_RE) || [''])[0].trim();
  const linkedin = (raw.match(LINKEDIN_RE) || [''])[0];
  const github = (raw.match(GITHUB_RE) || [''])[0];
  const site = (raw.match(SITE_RE) || [''])[0];
  const link = (linkedin || github || (/@/.test(site) ? '' : site) || '').replace(/^https?:\/\//, '');
  const location = (raw.match(LOCATION_RE) || [''])[0];

  // Name + role from the top of the document.
  let name = '';
  let role = '';
  const top = nonEmpty.slice(0, 8);
  for (let i = 0; i < top.length; i += 1) {
    const l = top[i];
    if (EMAIL_RE.test(l) || PHONE_RE.test(l) || /resume|curriculum|vitae/i.test(l)) continue;
    if (!name && looksLikeName(l)) {
      name = l;
      // role is often the next non-contact line
      const next = top.slice(i + 1).find((x) => !EMAIL_RE.test(x) && !PHONE_RE.test(x) && x !== location);
      if (next && next.length < 60) role = next;
      break;
    }
  }

  const { known: sections, custom } = splitSections(lines);
  const skills = extractSkills(raw);

  // Summary: the summary section, else a sensible lead paragraph.
  let summary = '';
  if (sections.summary && sections.summary.length) {
    summary = sections.summary.filter(Boolean).join(' ').slice(0, 400);
  } else {
    const para = nonEmpty.find((l) => l.length > 80 && !EMAIL_RE.test(l));
    if (para) summary = para.slice(0, 400);
  }

  const experience = sections.experience ? parseExperience(sections.experience) : [];
  const education = sections.education ? parseEducation(sections.education) : [];
  const projects = sections.projects ? parseProjects(sections.projects) : [];
  const customSections = custom
    .map((c) => ({ title: c.title, entries: parseGenericEntries(c.lines) }))
    .filter((s) => s.title && s.entries.length);

  return { name, role, target: '', email, phone, location, link, summary, experience, education, projects, skills, sections: customSections };
}
