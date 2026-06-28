import mongoose from 'mongoose';

// One portfolio per user (a personal site). Prefilled from a resume on the client,
// then edited independently. Embedded sub-docs mirror the resume shapes so the
// prefill is a near 1:1 map.
const expSchema = new mongoose.Schema({
  company: { type: String, default: '', trim: true },
  role: { type: String, default: '', trim: true },
  period: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  bullets: { type: [String], default: [] },
}, { _id: false });

const projSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  link: { type: String, default: '', trim: true },
  bullets: { type: [String], default: [] },
  tags: { type: [String], default: [] },
}, { _id: false });

const eduSchema = new mongoose.Schema({
  school: { type: String, default: '', trim: true },
  degree: { type: String, default: '', trim: true },
  period: { type: String, default: '', trim: true },
}, { _id: false });

const socialSchema = new mongoose.Schema({
  label: { type: String, default: '', trim: true },
  url: { type: String, default: '', trim: true },
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  // Owner — one portfolio per user (unique). Every query is scoped by this.
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  // Presentation
  template: { type: String, default: 'aurora', maxlength: 40 },
  accent: { type: String, default: '#f97316', maxlength: 20 },
  // Identity / hero
  name: { type: String, default: '', trim: true, maxlength: 120 },
  headline: { type: String, default: '', trim: true, maxlength: 160 },
  tagline: { type: String, default: '', trim: true, maxlength: 280 },
  location: { type: String, default: '', trim: true, maxlength: 160 },
  email: { type: String, default: '', trim: true, maxlength: 200 },
  phone: { type: String, default: '', trim: true, maxlength: 60 },
  website: { type: String, default: '', trim: true, maxlength: 300 },
  about: { type: String, default: '', maxlength: 4000 },
  // Content
  experience: { type: [expSchema], default: [] },
  projects: { type: [projSchema], default: [] },
  education: { type: [eduSchema], default: [] },
  skills: { type: [String], default: [] },
  socials: { type: [socialSchema], default: [] },
}, { timestamps: true });

portfolioSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    template: this.template,
    accent: this.accent,
    name: this.name,
    headline: this.headline,
    tagline: this.tagline,
    location: this.location,
    email: this.email,
    phone: this.phone,
    website: this.website,
    about: this.about,
    experience: this.experience.map((e) => ({ company: e.company, role: e.role, period: e.period, location: e.location, bullets: e.bullets })),
    projects: this.projects.map((p) => ({ name: p.name, link: p.link, bullets: p.bullets, tags: p.tags })),
    education: this.education.map((e) => ({ school: e.school, degree: e.degree, period: e.period })),
    skills: this.skills,
    socials: this.socials.map((s) => ({ label: s.label, url: s.url })),
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
  };
};

export const Portfolio = mongoose.model('Portfolio', portfolioSchema);
