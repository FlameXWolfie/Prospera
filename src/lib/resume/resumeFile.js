// Turns an uploaded résumé (or pasted text) into structured fields.
//
// Preferred path: Mistral — OCR the PDF/image on the server (handles scanned
// résumés) then parse it into structured fields. Fallback (no API key / failure):
// pdf.js text extraction on-device + the regex heuristic. Either way the caller
// gets the same `{ name, role, email, phone, ..., experience[], education[], skills[] }`.
import { parseResumeText } from './resumeParse';
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
// REAL résumé (not the extracted text re-rendered in a template). Only PDFs are
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

const looksParsed = (r) => Boolean(r && (r.name || r.summary || (r.skills || []).length || (r.experience || []).length));

// File → structured résumé fields (Mistral OCR+parse when enabled, else pdf.js+heuristic).
export async function importResumeFields(file, { aiEnabled } = {}) {
  if (aiEnabled) {
    try {
      const fileBase64 = await fileToBase64(file);
      const { result } = await aiParseResume({ fileBase64, mimeType: file.type || '', fileName: file.name });
      if (looksParsed(result)) return result;
    } catch { /* fall back to on-device extraction */ }
  }
  const text = await extractFileText(file);
  return parseResumeText(text);
}

// Pasted text → structured fields (Mistral parse when enabled, else heuristic).
export async function parseResumeSmart(text, { aiEnabled } = {}) {
  const t = String(text || '');
  if (aiEnabled && t.trim().length > 40) {
    try {
      const { result } = await aiParseResume({ text: t });
      if (looksParsed(result)) return result;
    } catch { /* fall back */ }
  }
  return parseResumeText(t);
}
