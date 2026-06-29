// Resume template metadata (no React imports — components live in
// src/components/resume/templates/index.js). Each template is a distinct,
// modern, ATS-friendly layout the ResumeDocument renders on an A4 page.
export const TEMPLATES = [
  { id: 'modern', name: 'Modern', blurb: 'Accent header, clean & bold', accent: '#4f46e5' },
  { id: 'minimal', name: 'Minimal', blurb: 'Spare, elegant, lots of air', accent: '#111827' },
  { id: 'classic', name: 'Classic', blurb: 'Timeless centered serif', accent: '#1f2937' },
  { id: 'sidebar', name: 'Sidebar', blurb: 'Bold colored side column', accent: '#0f766e' },
  { id: 'compact', name: 'Compact', blurb: 'Two-column, fits a lot', accent: '#2563eb' },
  { id: 'timeline', name: 'Timeline', blurb: 'Visual career timeline', accent: '#7c3aed' },
];

export const ACCENTS = ['#4f46e5', '#2563eb', '#0ea5e9', '#0f766e', '#059669', '#d97706', '#e11d48', '#7c3aed', '#111827'];

export const DEFAULT_TEMPLATE = 'modern';
export const DEFAULT_ACCENT = '#4f46e5';

export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
