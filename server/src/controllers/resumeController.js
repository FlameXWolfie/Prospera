import { Resume } from '../models/Resume.js';
import { sanitizeResume, sanitizeScan } from '../utils/featureInput.js';
import { htmlToPdf } from '../services/htmlPdf.js';

// Content fields whose change invalidates a prior ATS scan (presentation-only
// fields like template/accent don't). Used to flag `scanStale` on update.
const SCAN_CONTENT_KEYS = ['role', 'target', 'summary', 'experience', 'education', 'projects', 'sections', 'skills', 'name'];
const contentChanged = (resume, data) =>
  SCAN_CONTENT_KEYS.some((k) => k in data && JSON.stringify(data[k]) !== JSON.stringify(resume[k]));

// All handlers are scoped to req.user (set by requireAuth) so a user can only
// ever read or mutate their own resumes.
export const resumeController = {
  async list(req, res, next) {
    try {
      const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ resumes: resumes.map((r) => r.toClientJSON()) });
    } catch (err) {
      return next(err);
    }
  },

  // The original uploaded file, fetched on demand (it's select:false on the model
  // so it never rides along on the list query). Powers the "show my real PDF"
  // preview. Returns 404 when the resume has no stored file.
  async getFile(req, res, next) {
    try {
      const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).select('+fileData');
      if (!resume || !resume.fileData) return res.status(404).json({ error: 'No file stored for this resume.' });
      return res.json({
        fileData: resume.fileData,
        fileType: resume.fileType || 'application/pdf',
        fileName: resume.fileName || 'resume.pdf',
      });
    } catch (err) {
      return next(err);
    }
  },

  // Record a real ATS scan result. Sets `score`, `scanTarget`, and a server-side
  // `scannedAt` so the score is only ever shown once it has genuinely been scanned.
  async recordScan(req, res, next) {
    try {
      const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
      if (!resume) return res.status(404).json({ error: 'Resume not found.' });
      const { score, scanTarget } = sanitizeScan(req.body);
      if (typeof score !== 'number') return res.status(400).json({ error: 'A numeric score is required.' });
      resume.score = score;
      resume.scanTarget = scanTarget || '';
      resume.scannedAt = new Date();
      resume.scanStale = false; // a fresh scan is, by definition, not stale
      await resume.save();
      return res.json({ resume: resume.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },

  // Render the resume to a print-perfect A4 PDF via headless Chrome. Body = a
  // self-contained HTML document built client-side from the SAME templates the
  // editor shows (printDoc.js), so the PDF matches the on-screen preview exactly.
  // The HTML is rendered with JS disabled + a request allowlist (data: + Google
  // Fonts only), so untrusted content can't run scripts or do SSRF — see htmlPdf.js.
  async render(req, res, next) {
    try {
      const html = typeof req.body?.html === 'string' ? req.body.html : '';
      if (html.length < 40) return res.status(400).json({ error: 'No resume content to render.' });
      if (html.length > 3_000_000) return res.status(413).json({ error: 'Resume document is too large to render.' });
      const pdf = await htmlToPdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
      return res.send(pdf);
    } catch (err) {
      const missing = err && err.code === 'ENOENT';
      console.error('[pdf] render failed:', err && err.message);
      return res.status(missing ? 503 : 500).json({
        error: missing
          ? 'PDF engine unavailable: install Google Chrome/Chromium on the server (or set CHROME_PATH).'
          : 'Could not generate the PDF from this resume. Please try again.',
      });
    }
  },

  async create(req, res, next) {
    try {
      const data = sanitizeResume(req.body);
      // A brand-new resume can ask to be the active one; enforce single-active.
      if (data.isActive) await Resume.updateMany({ user: req.user._id }, { isActive: false });
      const resume = await Resume.create({ ...data, user: req.user._id });
      return res.status(201).json({ resume: resume.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
      if (!resume) return res.status(404).json({ error: 'Resume not found.' });
      const data = sanitizeResume(req.body);
      if (data.isActive === true) await Resume.updateMany({ user: req.user._id, _id: { $ne: resume._id } }, { isActive: false });
      // Editing content after a scan makes the saved score out of date.
      if (resume.scannedAt && !resume.scanStale && contentChanged(resume, data)) data.scanStale = true;
      Object.assign(resume, data);
      await resume.save();
      return res.json({ resume: resume.toClientJSON() });
    } catch (err) {
      return next(err);
    }
  },

  // Promote one resume to the single active version (clears the flag on the rest).
  // Returns the full list so the client can replace its state in one shot.
  async activate(req, res, next) {
    try {
      const target = await Resume.findOne({ _id: req.params.id, user: req.user._id });
      if (!target) return res.status(404).json({ error: 'Resume not found.' });
      await Resume.updateMany({ user: req.user._id }, { isActive: false });
      target.isActive = true;
      await target.save();
      const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ resumes: resumes.map((r) => r.toClientJSON()) });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!resume) return res.status(404).json({ error: 'Resume not found.' });
      return res.json({ ok: true, id: resume._id.toString() });
    } catch (err) {
      return next(err);
    }
  },
};
