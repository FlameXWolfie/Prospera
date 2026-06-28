// Turns an uploaded resume (or pasted text) into structured fields.
//
// Preferred path: Mistral — OCR the PDF/image on the server (handles scanned
// resumes) then parse it into structured fields. Fallback (no API key / failure):
// pdf.js text extraction on-device + the regex heuristic. Either way the caller
// gets the same `{ name, role, email, phone, ..., experience[], education[], skills[] }`.
import { parseResumeText } from './resumeParse';
import { foldSkillSectionsIntoSkills } from './skills';
import { aiParseResume } from '../ai';

// Read a File as raw base64 (no `data:` prefix) for the server OCR call.
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const r = String(reader.result || '');
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.readAsDataURL(file);
  });
}

const isPdfFile = (file) => /pdf$/i.test(file?.type || '') || /\.pdf$/i.test(file?.name || '');

// Read the original file we want to keep around so previews can show the user's
// REAL resume (not the extracted text re-rendered in a template). Only PDFs are
// kept — they're the one format we can faithfully render back. Returns the fields
// `resumeFromParsed` persists; non-PDFs get empty `fileData` (preview falls back
// to the template render).
export async function readSourceFile(file) {
  if (!isPdfFile(file)) return { fileData: '', fileType: '', fileName: file?.name || '' };
  const fileData = await fileToBase64(file);
  return { fileData, fileType: file.type || 'application/pdf', fileName: file.name || 'resume.pdf' };
}

// Extract plain text from a file: pdf.js for PDFs (lazy-loaded), direct read for
// text. Used as the local fallback when AI is unavailable.
export async function extractFileText(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    let out = '';
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += `${content.items.map((it) => it.str || '').join(' ')}\n`;
    }
    return out;
  }
  return file.text();
}

// ── Hyperlink recovery ───────────────────────────────────────────────────────
// A PDF hyperlink is an ANNOTATION layered on the page, not text. OCR sees only
// the rendered glyphs ("GitHub" / an icon) and pdf.js getTextContent() returns
// only text runs — so a LaTeX `\href{url}{GitHub}` loses its URL in both paths.
// We read the annotation layer (page.getAnnotations()) to recover those links and
// the visible text they sit on, so they can be attached to the right field.

// The visible text a link sits on — found by overlapping the link's rect with the
// page's text items (same PDF user-space coords). '' for icon-only links.
function anchorForRect(rect, items) {
  if (!Array.isArray(rect) || rect.length < 4) return '';
  const [x1, y1, x2, y2] = rect;
  const parts = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const ix1 = it.transform[4];
    const ix2 = ix1 + (it.width || 0);
    const iy = it.transform[5];
    if (ix1 <= x2 + 2 && ix2 >= x1 - 2 && iy >= y1 - 2 && iy <= y2 + 4) parts.push(it.str);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// Categorise a URL so we can pick the best contact link.
export function classifyLink(url) {
  const u = String(url || '').toLowerCase();
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('github.com')) return 'github';
  if (/(twitter|x\.com|medium|dev\.to|behance|dribbble|gitlab|stackoverflow|leetcode|codeforces|hackerrank|kaggle|hashnode)/.test(u)) return 'social';
  return 'site';
}

// Read every link annotation from a PDF → [{ url, anchor }] (deduped by url).
// Returns [] for non-PDFs or on any failure (purely additive — never blocks parse).
export async function extractPdfLinks(file) {
  if (!isPdfFile(file)) return [];
  try {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    const seen = new Set();
    const out = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const [annots, content] = await Promise.all([page.getAnnotations(), page.getTextContent()]);
      for (const a of annots) {
        if (a.subtype !== 'Link') continue;
        const url = String(a.url || a.unsafeUrl || '').trim();
        if (!url || /^(mailto:|tel:|javascript:|#)/i.test(url)) continue;
        const key = url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ url, anchor: anchorForRect(a.rect, content.items) });
      }
    }
    return out;
  } catch {
    return [];
  }
}

const stripProto = (s) => String(s || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

// Fill blank links on a parsed resume from the recovered annotation links. Safety
// net for both paths: contact link (linkedin > github > portfolio) when missing,
// and a project's link when an annotation's anchor text matches the project name.
// Conservative — never overwrites an existing link, never guesses by position.
export function applyPdfLinks(parsed, links) {
  if (!parsed || !Array.isArray(links) || !links.length) return parsed;
  if (!parsed.link) {
    const pick = links.find((l) => classifyLink(l.url) === 'linkedin')
      || links.find((l) => classifyLink(l.url) === 'github')
      || links.find((l) => classifyLink(l.url) === 'site');
    if (pick) parsed.link = stripProto(pick.url);
  }
  const used = new Set();
  for (const p of (parsed.projects || [])) {
    if (p.link || !p.name) continue;
    const name = p.name.toLowerCase();
    const hit = links.find((l) => !used.has(l.url) && l.anchor
      && (l.anchor.toLowerCase().includes(name) || name.includes(l.anchor.toLowerCase())));
    if (hit) { p.link = stripProto(hit.url); used.add(hit.url); }
  }
  return parsed;
}

const looksParsed = (r) => Boolean(r && (r.name || r.summary || (r.skills || []).length || (r.experience || []).length));

// Recovered hyperlinks belong on the contact line / a project's link — NEVER as a
// raw "Links / Hyperlinks / URLs" section. The AI sometimes dumps the hyperlink
// hint list into such a section (often mashing anchor+URL together), so drop it.
const LINK_SECTION_RE = /^\s*(hyper[\s-]*links?|links?|urls?|web\s*links?|online\s*presence|social\s*(links?|media))\s*$/i;
function stripLinkSections(parsed) {
  if (!parsed || !Array.isArray(parsed.sections) || !parsed.sections.length) return parsed;
  const sections = parsed.sections.filter((s) => !LINK_SECTION_RE.test((s && s.title) || ''));
  return sections.length === parsed.sections.length ? parsed : { ...parsed, sections };
}

// File → structured resume fields (Mistral OCR+parse when enabled, else pdf.js+heuristic).
// Hyperlinks live in the PDF annotation layer (invisible to OCR + getTextContent),
// so we extract them separately and (a) hand them to the AI to attach in context,
// then (b) backfill any blanks client-side — works whether AI is on or off.
export async function importResumeFields(file, { aiEnabled } = {}) {
  const links = await extractPdfLinks(file);
  if (aiEnabled) {
    try {
      const fileBase64 = await fileToBase64(file);
      const { result } = await aiParseResume({ fileBase64, mimeType: file.type || '', fileName: file.name, links });
      // Fold any duplicate "skills" section back into the skills field, then attach
      // recovered hyperlinks. Both run on the AI AND the heuristic result, so a
      // grouped TECHNICAL SKILLS block never renders twice no matter the path.
      if (looksParsed(result)) return applyPdfLinks(foldSkillSectionsIntoSkills(stripLinkSections(result)), links);
    } catch { /* fall back to on-device extraction */ }
  }
  const text = await extractFileText(file);
  return applyPdfLinks(foldSkillSectionsIntoSkills(stripLinkSections(parseResumeText(text))), links);
}

// Pasted text → structured fields (Mistral parse when enabled, else heuristic).
export async function parseResumeSmart(text, { aiEnabled } = {}) {
  const t = String(text || '');
  if (aiEnabled && t.trim().length > 40) {
    try {
      const { result } = await aiParseResume({ text: t });
      if (looksParsed(result)) return foldSkillSectionsIntoSkills(stripLinkSections(result));
    } catch { /* fall back */ }
  }
  return foldSkillSectionsIntoSkills(stripLinkSections(parseResumeText(t)));
}
