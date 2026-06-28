import mongoose from 'mongoose';

// Embedded sub-documents — no own _id (we never address them individually).
const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '', trim: true },
  role: { type: String, default: '', trim: true },
  period: { type: String, default: '', trim: true },
  bullets: { type: [String], default: [] },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  school: { type: String, default: '', trim: true },
  degree: { type: String, default: '', trim: true },
  period: { type: String, default: '', trim: true },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  link: { type: String, default: '', trim: true },
  bullets: { type: [String], default: [] },
}, { _id: false });

// Generic, DYNAMIC section — anything a resume has beyond the structured core
// (Achievements, Certifications, Awards, Publications, Leadership, Languages, …).
const sectionEntrySchema = new mongoose.Schema({
  heading: { type: String, default: '', trim: true },
  meta: { type: String, default: '', trim: true },
  bullets: { type: [String], default: [] },
}, { _id: false });
const sectionSchema = new mongoose.Schema({
  title: { type: String, default: '', trim: true },
  entries: { type: [sectionEntrySchema], default: [] },
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  // Owner. Every query is scoped by this so users only ever see their own data.
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Library display name the user chooses on save (falls back to `role`).
  label: { type: String, default: '', trim: true, maxlength: 120 },
  role: { type: String, default: 'Untitled resume', trim: true, maxlength: 200 },
  target: { type: String, default: '', trim: true, maxlength: 200 },
  score: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, default: 'Draft - Pending Review', trim: true, maxlength: 60 },
  summary: { type: String, default: '', maxlength: 4000 },
  experience: { type: [experienceSchema], default: [] },
  education: { type: [educationSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  // Dynamic, arbitrary sections (so any resume layout is preserved, not just the
  // hardcoded ones).
  sections: { type: [sectionSchema], default: [] },
  skills: { type: [String], default: [] },
  isActive: { type: Boolean, default: false },
  // Presentation: which preview template + accent colour the resume renders with.
  template: { type: String, default: 'modern', maxlength: 40 },
  accent: { type: String, default: '#4f46e5', maxlength: 20 },
  // Builder identity fields (the seed resumes never had these — the live preview
  // falls back to CANDIDATE when name/email are blank).
  name: { type: String, default: '', trim: true, maxlength: 120 },
  email: { type: String, default: '', trim: true, maxlength: 200 },
  phone: { type: String, default: '', trim: true, maxlength: 60 },
  location: { type: String, default: '', trim: true, maxlength: 200 },
  link: { type: String, default: '', trim: true, maxlength: 300 },
  // Original uploaded file so previews can show the user's REAL resume, not just
  // the extracted text re-rendered in a template. `fileData` is base64 (no data:
  // prefix) and `select: false` so it never loads on the list query — fetched
  // on demand via GET /resumes/:id/file. `hasFile` is the cheap flag the client
  // reads to decide whether to fetch (kept in sync by the pre-save hook below).
  fileData: { type: String, default: '', select: false },
  fileType: { type: String, default: '', maxlength: 100 },
  fileName: { type: String, default: '', trim: true, maxlength: 260 },
  hasFile: { type: Boolean, default: false },
  // `score` is meaningful ONLY after a real ATS scan. `scannedAt` (null until the
  // first scan, set by POST /resumes/:id/scan) is the source of truth for "has a
  // real score"; `scanTarget` records what it was scanned against (for display).
  scannedAt: { type: Date, default: null },
  scanTarget: { type: String, default: '', maxlength: 120 },
  // True when the resume's content changed AFTER its last scan, so the shown score
  // is out of date. Set by the update controller, cleared by recordScan.
  scanStale: { type: Boolean, default: false },
}, { timestamps: true });

// Keep `hasFile` in sync with `fileData`. Because `fileData` is select:false, an
// update that doesn't touch it leaves it (and this flag) untouched — so editing a
// resume in Enhance never wipes its stored PDF.
resumeSchema.pre('save', function syncHasFile(next) {
  if (this.isModified('fileData')) this.hasFile = Boolean(this.fileData);
  next();
});

// Shape the client already expects: `id` (string) + `lastAppended` (= updatedAt,
// the "last edited" label the dashboard and library render).
resumeSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    label: this.label,
    role: this.role,
    target: this.target,
    score: this.score,
    status: this.status,
    summary: this.summary,
    experience: this.experience.map((e) => ({ company: e.company, role: e.role, period: e.period, bullets: e.bullets })),
    education: this.education.map((e) => ({ school: e.school, degree: e.degree, period: e.period })),
    projects: this.projects.map((p) => ({ name: p.name, link: p.link, bullets: p.bullets })),
    sections: this.sections.map((s) => ({
      title: s.title,
      entries: s.entries.map((e) => ({ heading: e.heading, meta: e.meta, bullets: e.bullets })),
    })),
    skills: this.skills,
    isActive: this.isActive,
    template: this.template,
    accent: this.accent,
    name: this.name,
    email: this.email,
    phone: this.phone,
    location: this.location,
    link: this.link,
    hasFile: this.hasFile,
    fileType: this.fileType,
    fileName: this.fileName,
    scannedAt: this.scannedAt,
    scanTarget: this.scanTarget,
    scanStale: this.scanStale,
    lastAppended: this.updatedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Resume = mongoose.model('Resume', resumeSchema);
