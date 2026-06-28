import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { Resume } from '../models/Resume.js';
import { sanitizeResume, sanitizeScan } from '../utils/featureInput.js';
import { buildResumeTex } from '../services/latexResume.js';

const execFileP = promisify(execFile);
// The host needs the Tectonic TeX engine (https://tectonic-typesetting.github.io).
// Configurable path; falls back to `tectonic` on PATH.
const TECTONIC = process.env.TECTONIC_PATH || 'tectonic';

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

  // Compile the resume to a print-perfect PDF via LaTeX (Tectonic). Body = resume
  // content (sanitized); user text is escaped in buildResumeTex, and tectonic runs
  // WITHOUT shell-escape, so untrusted content can't execute anything.
  async render(req, res, next) {
    let dir;
    try {
      const content = sanitizeResume(req.body);
      const tex = buildResumeTex(content, { accent: content.accent });
      dir = path.join(os.tmpdir(), `prospera-tex-${crypto.randomUUID()}`);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'resume.tex'), tex, 'utf8');
      await execFileP(TECTONIC, ['-X', 'compile', path.join(dir, 'resume.tex'), '--outdir', dir], { timeout: 45000 });
      const pdf = await fs.readFile(path.join(dir, 'resume.pdf'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
      return res.send(pdf);
    } catch (err) {
      const missing = err && (err.code === 'ENOENT');
      console.error('[latex] render failed:', err && err.message);
      return res.status(missing ? 503 : 500).json({
        error: missing
          ? 'PDF engine not installed on the server. Install Tectonic (or set TECTONIC_PATH) to enable LaTeX export.'
          : 'Could not generate the PDF from this resume. Please try again.',
      });
    } finally {
      if (dir) fs.rm(dir, { recursive: true, force: true }).catch(() => {});
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
