import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Bell, Grid, List, MoreHorizontal, X, Edit2,
  Download, Copy, Target, BarChart2, ChevronRight, ChevronDown,
  Sparkles, Lightbulb, FileText, Upload, Folder,
  Code2, Briefcase, Megaphone, Palette, BarChart, Shield, Zap
} from 'lucide-react';

/* ─────────────────────────── HELPERS ─────────────────────────────────────── */

function getCat(role) {
  const r = (role || '').toLowerCase();
  if (/engineer|developer|fullstack|backend|frontend|data analyst/.test(r)) return 'Software Engineering';
  if (/product manager|growth product/.test(r)) return 'Product Management';
  if (/marketing/.test(r)) return 'Marketing';
  if (/design|ux|ui/.test(r)) return 'Design';
  if (/operations/.test(r)) return 'Operations';
  return 'Other';
}

function groupBy(list) {
  return list.reduce((acc, r) => {
    const c = getCat(r.role);
    (acc[c] = acc[c] || []).push(r);
    return acc;
  }, {});
}

function ago(d) {
  if (!d) return 'recently';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const days = Math.floor(s / 86400);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

const CAT_META = {
  'Software Engineering': { color: '#3b82f6', bg: '#eff6ff', Icon: Code2 },
  'Product Management':   { color: '#8b5cf6', bg: '#f5f3ff', Icon: Briefcase },
  'Marketing':            { color: '#f59e0b', bg: '#fffbeb', Icon: Megaphone },
  'Design':               { color: '#ec4899', bg: '#fdf2f8', Icon: Palette },
  'Operations':           { color: '#10b981', bg: '#ecfdf5', Icon: FileText },
  'Other':                { color: '#64748b', bg: '#f8fafc', Icon: FileText },
};

const STATIC_CATS = [
  { label: 'All Resumes',          Icon: FileText,  color: '#3b82f6' },
  { label: 'Software Engineering', Icon: Code2,     color: '#3b82f6' },
  { label: 'Product Management',   Icon: Briefcase, color: '#8b5cf6' },
  { label: 'Data & Analytics',     Icon: BarChart,  color: '#06b6d4' },
  { label: 'Marketing',            Icon: Megaphone, color: '#f59e0b' },
  { label: 'Design',               Icon: Palette,   color: '#ec4899' },
  { label: 'Operations',           Icon: FileText,  color: '#10b981' },
];

/* ─────────────────────────── ATS RING ────────────────────────────────────── */

function AtsRing({ score = 0, size = 36, stroke = 3 }) {
  const s = Math.max(0, Math.min(100, score));
  const r = size / 2 - stroke * 2;
  const circ = 2 * Math.PI * r;
  const color = s >= 85 ? '#22c55e' : s >= 70 ? '#f59e0b' : '#f97316';
  const fs = size >= 72 ? 20 : size >= 48 ? 13 : 10;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (s / 100) * circ}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span style={{ fontSize: fs, fontWeight: 700, color, position: 'relative', zIndex: 1 }}>{s}</span>
    </div>
  );
}

/* ─────────────────────────── 3-DOT MENU ──────────────────────────────────── */

function Dots({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 300, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.13)', minWidth: 130, overflow: 'hidden' }}>
          {items.map(([label, fn]) => (
            <button key={label} onClick={e => { e.stopPropagation(); setOpen(false); fn && fn(); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: label === 'Delete' ? '#ef4444' : '#0f172a', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── THUMB ───────────────────────────────────────── */

function Thumb({ w = 38, h = 50 }) {
  return (
    <div style={{ width: w, height: h, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, flexShrink: 0, padding: '4px 4px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <div style={{ width: '55%', height: 3.5, background: '#cbd5e1', borderRadius: 2 }} />
      {[90, 75, 88, 62, 80, 70, 84, 68].map((p, i) => (
        <div key={i} style={{ width: `${p}%`, height: 2.5, background: '#e2e8f0', borderRadius: 1 }} />
      ))}
    </div>
  );
}

/* ─────────────────────────── SHARED HEADER / FILTERS ────────────────────── */

function PageHeader({ onCreateNew, showBreadcrumb }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <div>
        {showBreadcrumb && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Resume Library
          </div>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1, margin: 0 }}>
          Resume Library
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 5, margin: 0 }}>
          Organize, tailor, and manage your resumes for every opportunity.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {showBreadcrumb && (
          <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Bell size={16} />
            <span style={{ position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />
          </button>
        )}
        <button onClick={onCreateNew}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
          <Plus size={14} /> Create New Resume
        </button>
      </div>
    </div>
  );
}

function FilterBar({ search, setSearch, viewMode, setViewMode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search resumes by title, role or keyword..."
          style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
      </div>
      <select style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 32px 9px 12px', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
        <option>All Categories</option>
        <option>Software Engineering</option>
        <option>Product Management</option>
        <option>Marketing</option>
        <option>Design</option>
      </select>
      <select style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 32px 9px 12px', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
        <option>Sort: Recently Updated</option>
        <option>Sort: ATS Score</option>
        <option>Sort: Title A–Z</option>
      </select>
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
        {[['list', <List size={15} />], ['grid', <Grid size={15} />]].map(([mode, icon]) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            style={{ padding: '6px 9px', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', background: viewMode === mode ? '#fff' : 'transparent', color: viewMode === mode ? '#3b82f6' : '#94a3b8', boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all .12s' }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATE 1 — EMPTY LIBRARY
══════════════════════════════════════════════════════════════════════════ */

function EmptyLibrary({ onCreateNew }) {
  const features = [
    { Icon: Copy,   label: 'Multiple versions', desc: 'Create role-specific resumes for different opportunities.' },
    { Icon: BarChart, label: 'Track & improve', desc: 'Compare ATS scores and improve over time.' },
    { Icon: Shield, label: 'Organized & secure', desc: 'Keep all your resumes organized in one place.' },
    { Icon: Zap,    label: 'AI-powered insights', desc: 'Get AI recommendations to make your resume stand out.' },
  ];

  return (
    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

      {/* ── Left column ── */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* No resumes card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '28px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Folder size={26} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>No resumes yet</div>
            <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.65 }}>Add your first resume to get started. You can create a new one or upload an existing file.</div>
          </div>
          <button onClick={onCreateNew}
            style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Plus size={14} /> Create New Resume
          </button>
          <button style={{ width: '100%', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Download size={14} /> Upload Resume
          </button>
        </div>

        {/* Categories */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px 22px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 14 }}>Categories</div>
          {STATIC_CATS.map(({ label, Icon: CatIcon, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <CatIcon size={14} style={{ color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', borderRadius: 99, padding: '1px 8px' }}>0</span>
            </div>
          ))}
          <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginTop: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <Plus size={13} /> Create Category
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 0 }}>

        {/* Box SVG illustration */}
        <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 24 }}>
          {/* Box body */}
          <rect x="28" y="72" width="104" height="60" rx="6" fill="#e0e7ff" />
          {/* Box front flap */}
          <path d="M28 72 L80 90 L132 72" stroke="#a5b4fc" strokeWidth="2" fill="#c7d2fe" />
          {/* Left flap */}
          <path d="M28 72 L28 52 L55 60 L55 72 Z" fill="#a5b4fc" />
          {/* Right flap */}
          <path d="M132 72 L132 52 L105 60 L105 72 Z" fill="#a5b4fc" />
          {/* Center front flap open */}
          <path d="M55 60 L80 52 L105 60 L80 72 Z" fill="#818cf8" />
          {/* Document 1 - floating */}
          <rect x="52" y="12" width="38" height="50" rx="4" fill="#fff" stroke="#c7d2fe" strokeWidth="1.5" transform="rotate(-8 52 12)" />
          <rect x="58" y="22" width="24" height="3" rx="1.5" fill="#ddd6fe" transform="rotate(-8 52 12)" />
          <rect x="58" y="28" width="20" height="2.5" rx="1.2" fill="#e0e7ff" transform="rotate(-8 52 12)" />
          <rect x="58" y="33" width="22" height="2.5" rx="1.2" fill="#e0e7ff" transform="rotate(-8 52 12)" />
          {/* Document 2 - floating */}
          <rect x="74" y="8" width="38" height="50" rx="4" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5" transform="rotate(6 74 8)" />
          <rect x="80" y="18" width="24" height="3" rx="1.5" fill="#bbf7d0" transform="rotate(6 74 8)" />
          <rect x="80" y="24" width="20" height="2.5" rx="1.2" fill="#dcfce7" transform="rotate(6 74 8)" />
          <rect x="80" y="29" width="22" height="2.5" rx="1.2" fill="#dcfce7" transform="rotate(6 74 8)" />
          {/* Check circle */}
          <circle cx="118" cy="30" r="14" fill="#22c55e" />
          <path d="M111 30 L116 35 L125 23" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Upload cloud */}
          <circle cx="42" cy="110" r="10" fill="#e0e7ff" />
          <path d="M42 106 L42 114 M38 110 L42 106 L46 110" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Sparkle top right */}
          <path d="M136 18 L138 12 L140 18 L146 20 L140 22 L138 28 L136 22 L130 20 Z" fill="#a5b4fc" opacity="0.7" />
          <path d="M20 50 L21.5 46 L23 50 L27 51.5 L23 53 L21.5 57 L20 53 L16 51.5 Z" fill="#818cf8" opacity="0.5" />
        </svg>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>Your resume library is empty</h2>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, maxWidth: 400, marginBottom: 28 }}>
          Resumes you add will appear here. You can tailor them for different roles, run ATS scans, and track improvements over time.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
          <button onClick={onCreateNew}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
            <Plus size={14} /> Create New Resume
          </button>
          <button style={{ background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
            <Upload size={14} /> Upload Resume
          </button>
        </div>

        {/* Why build */}
        <div style={{ width: '100%', maxWidth: 540 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 16 }}>Why build your library?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {features.map(({ Icon: FIcon, label, desc }) => (
              <div key={label} style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #f1f5f9', padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#3b82f6' }}>
                  <FIcon size={16} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATE 2 — POPULATED GRID (no resume selected)
══════════════════════════════════════════════════════════════════════════ */

function GridCard({ resume, onSelect, onClone, onDelete }) {
  const tags = (resume.skills || []).slice(0, 2);
  const extra = Math.max(0, (resume.skills || []).length - 2);
  return (
    <div onClick={() => onSelect(resume.id)}
      style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0, transition: 'box-shadow 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.12)'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#f1f5f9'; }}>
      {/* Top row: thumb + dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Thumb w={42} h={54} />
        <div onClick={e => e.stopPropagation()}>
          <Dots items={[['Edit', () => {}], ['Duplicate', () => onClone(resume.id)], ['Delete', () => onDelete(resume.id)]]} />
        </div>
      </div>
      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume.role} Resume</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume.target || resume.role}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Updated {ago(resume.lastAppended)}</div>
      {/* Bottom row: tags + ATS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1, overflow: 'hidden' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 10.5, background: '#f1f5f9', color: '#374151', borderRadius: 5, padding: '2px 7px', fontWeight: 500, whiteSpace: 'nowrap' }}>{t}</span>
          ))}
          {extra > 0 && <span style={{ fontSize: 10.5, background: '#f1f5f9', color: '#94a3b8', borderRadius: 5, padding: '2px 6px' }}>+{extra}</span>}
        </div>
        <AtsRing score={resume.score ?? 0} size={34} stroke={3} />
      </div>
    </div>
  );
}

function GridView({ resumes, search, setSearch, viewMode, setViewMode, onSelect, onCreateNew, onClone, onDelete }) {
  const filtered = resumes.filter(r =>
    [r.role, r.target, ...(r.skills || [])].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  );
  const groups = groupBy(filtered);

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
      {/* Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>All Resumes</span>
        <span style={{ fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#374151', borderRadius: 99, padding: '2px 10px' }}>{filtered.length}</span>
      </div>

      {/* Category groups */}
      {Object.entries(groups).map(([cat, items]) => {
        const m = CAT_META[cat] || CAT_META['Other'];
        const CatIcon = m.Icon;
        return (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CatIcon size={15} style={{ color: m.color }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{cat}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, borderRadius: 99, padding: '2px 9px' }}>{items.length}</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#3b82f6', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                View all ({items.length}) <ChevronRight size={13} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {items.slice(0, 4).map(r => (
                <GridCard key={r.id} resume={r} onSelect={onSelect} onClone={onClone} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 13 }}>
          No resumes match your search.
        </div>
      )}

      {/* Sticky bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 270, right: 0, background: '#fff', borderTop: '1px solid #f1f5f9', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={15} style={{ color: '#3b82f6' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Select a resume to view its details, ATS score, recommendations, and preview.</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Pick any resume card above to get started.</div>
        </div>
        <Sparkles size={16} style={{ color: '#e0e7ff' }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATE 3 — SPLIT VIEW (resume selected)
══════════════════════════════════════════════════════════════════════════ */

/* ── Left panel list ── */

function SplitLeft({ resumes, selId, search, onSelect, onCreateNew, onClone, onDelete }) {
  const [collapsed, setCollapsed] = useState({});
  const filtered = resumes.filter(r =>
    [r.role, r.target, ...(r.skills || [])].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  );
  const groups = groupBy(filtered);

  return (
    <div style={{ width: 430, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #f1f5f9', background: '#fff', overflowY: 'auto' }}>
      {/* Count */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #f5f7fa', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>All Resumes</span>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#374151', borderRadius: 99, padding: '2px 9px' }}>{filtered.length}</span>
      </div>

      {Object.entries(groups).map(([cat, items]) => {
        const m = CAT_META[cat] || CAT_META['Other'];
        const CatIcon = m.Icon;
        const isOpen = !collapsed[cat];
        return (
          <div key={cat}>
            {/* Category row */}
            <button onClick={() => setCollapsed(p => ({ ...p, [cat]: !p[cat] }))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f5f7fa', textAlign: 'left' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CatIcon size={14} style={{ color: m.color }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', flex: 1 }}>{cat}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, borderRadius: 99, padding: '1px 8px' }}>{items.length}</span>
              <ChevronDown size={13} style={{ color: '#94a3b8', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s', flexShrink: 0 }} />
            </button>

            {/* Resume rows */}
            {isOpen && items.map(r => {
              const isSel = r.id === selId;
              return (
                <div key={r.id} onClick={() => onSelect(r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px 9px 58px', cursor: 'pointer', background: isSel ? '#eff6ff' : 'transparent', borderLeft: `3px solid ${isSel ? '#3b82f6' : 'transparent'}`, transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                  <Thumb w={36} h={46} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isSel ? 700 : 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.role} Resume
                  </span>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500, flexShrink: 0, marginRight: 2 }}>ATS</span>
                  <AtsRing score={r.score ?? 0} size={32} stroke={3} />
                  <div onClick={e => e.stopPropagation()}>
                    <Dots items={[['Edit', () => {}], ['Duplicate', () => onClone(r.id)], ['Delete', () => onDelete(r.id)]]} />
                  </div>
                </div>
              );
            })}

            {/* View all */}
            {isOpen && (
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 20px 10px 58px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                View all ({items.length}) <ChevronRight size={12} />
              </button>
            )}
          </div>
        );
      })}

      {/* Create new row */}
      <div onClick={onCreateNew}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus size={15} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Create New Resume</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Start from scratch or import your existing resume</div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini resume doc ── */

function MiniDoc({ resume, fill }) {
  const exp = (resume.experience || []).slice(0, 2);
  const skills = (resume.skills || []).slice(0, 6);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px 18px', fontSize: 9.5, color: '#374151', lineHeight: 1.6, overflowY: 'auto', ...(fill ? { height: '100%' } : { maxHeight: 440 }) }}>
      <div style={{ textAlign: 'center', paddingBottom: 8, marginBottom: 10, borderBottom: '2px solid #0f172a' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AARAV PATEL</div>
        <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 3 }}>aaravpatel@email.com · (713) 456-7890 · San Francisco, CA</div>
        <div style={{ fontSize: 8.5, color: '#64748b' }}>linkedin.com/in/aaravpatel · aaravpatel.com</div>
      </div>
      {[['SUMMARY', <div style={{ fontSize: 9, lineHeight: 1.65, color: '#374151' }}>{(resume.summary || '').slice(0, 200)}</div>]].map(([lbl, content]) => (
        <div key={lbl} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a', borderBottom: '1px solid #d1d5db', paddingBottom: 2, marginBottom: 5 }}>{lbl}</div>
          {content}
        </div>
      ))}
      {exp.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a', borderBottom: '1px solid #d1d5db', paddingBottom: 2, marginBottom: 5 }}>EXPERIENCE</div>
          {exp.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 9.5 }}>{e.role || 'Role'}</span>
                <span style={{ fontSize: 8.5, color: '#64748b' }}>{e.period || ''}</span>
              </div>
              <div style={{ fontSize: 9, color: '#374151', marginBottom: 2 }}>{e.company || 'Company'}</div>
              {(e.bullets || []).slice(0, 2).map((b, j) => (
                <div key={j} style={{ fontSize: 8.5, color: '#374151', paddingLeft: 8 }}>· {b}</div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a', borderBottom: '1px solid #d1d5db', paddingBottom: 2, marginBottom: 5 }}>EDUCATION</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>B.S. in Computer Science</span>
          <span style={{ color: '#94a3b8' }}>2018</span>
        </div>
        <div style={{ fontSize: 9, color: '#64748b' }}>University of California, Berkeley</div>
      </div>
      {skills.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a', borderBottom: '1px solid #d1d5db', paddingBottom: 2, marginBottom: 5 }}>SKILLS</div>
          <div style={{ fontSize: 9, color: '#374151' }}>
            <div>Languages: {skills.slice(0, 3).join(', ')}</div>
            {skills.length > 3 && <div style={{ marginTop: 3 }}>Frameworks: {skills.slice(3, 6).join(', ')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Right detail panel ── */

const TABS = ['Overview', 'ATS Score', 'Recommendations', 'Versions', 'Activity'];

function DetailPanel({ resume, onClose, onClone, onNavigate, AppScreen }) {
  const [tab, setTab] = useState('Overview');
  const score = resume.score ?? 0;
  const skills = resume.skills || [];
  const vis = skills.slice(0, 6);
  const extra = Math.max(0, skills.length - 6);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

      {/* ── Header card ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '20px 24px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>

          {/* LEFT: thumb + all text info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0, flex: 1 }}>

            {/* Bigger thumbnail */}
            <div style={{ width: 72, height: 92, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, flexShrink: 0, padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ width: '55%', height: 4, background: '#cbd5e1', borderRadius: 2 }} />
              {[88, 75, 90, 62, 82, 70, 86, 68, 78].map((p, i) => (
                <div key={i} style={{ width: `${p}%`, height: 3, background: '#e2e8f0', borderRadius: 1 }} />
              ))}
            </div>

            {/* Text block */}
            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                  {resume.role} Resume
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, border: '1.5px solid #bfdbfe', color: '#3b82f6', borderRadius: 99, padding: '2px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Primary
                </span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0, flexShrink: 0 }}>
                  <Edit2 size={13} />
                </button>
              </div>
              {/* Subtitle: target role */}
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 3, fontWeight: 400 }}>
                {resume.target || resume.role}
              </div>
              {/* Company line */}
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                Google, Microsoft, Stripe
              </div>
              {/* Date */}
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                Updated {ago(resume.lastAppended)}
              </div>
              {/* Company tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Google', 'Microsoft', 'Stripe'].map(t => (
                  <span key={t} style={{ fontSize: 11.5, background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>
                    {t}
                  </span>
                ))}
                <span style={{ fontSize: 11.5, background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '3px 9px' }}>+2</span>
              </div>
            </div>
          </div>

          {/* RIGHT: ATS ring, then controls stacked above */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
            {/* ATS ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <AtsRing score={score} size={82} stroke={6} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>ATS Score</span>
            </div>
            {/* Controls: dots + close stacked top-right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Dots items={[['Edit', () => {}], ['Duplicate', () => onClone(resume.id)], ['Delete', () => {}]]} />
                <button onClick={onClose}
                  style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', display: 'flex', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flexShrink: 0, padding: '12px 20px', border: 'none', borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#3b82f6' : '#64748b', fontFamily: 'inherit' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT: analysis cards, scrollable */}
          <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', overflowY: 'auto', minWidth: 0, borderRight: '1px solid #f0f2f5' }}>

            {/* AI Summary */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #eef0f4', padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={12} style={{ color: '#3b82f6' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>AI Summary</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                {resume.summary || 'Strong resume with relevant experience in backend systems and distributed architectures. Optimized for top product companies.'}
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['ATS Score', score, '#3b82f6'], ['Keyword Match', 18, '#0f172a'], ['Overall Match', 'High', '#0f172a']].map(([lbl, val, col]) => (
                <div key={lbl} style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: col, marginBottom: 2 }}>{val}</div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Top Keywords */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #eef0f4', padding: '13px 15px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 9 }}>Top Keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {vis.map(s => (
                  <span key={s} style={{ fontSize: 11.5, background: '#eff6ff', color: '#1d4ed8', borderRadius: 5, padding: '3px 9px', fontWeight: 500 }}>{s}</span>
                ))}
                {extra > 0 && <span style={{ fontSize: 11.5, background: '#f1f5f9', color: '#64748b', borderRadius: 5, padding: '3px 8px' }}>+{extra} more</span>}
              </div>
            </div>

            {/* Tip */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>Add 3 missing keywords to increase your ATS score by up to 9 points.</div>
                <button style={{ background: 'none', border: 'none', color: '#d97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 3, fontFamily: 'inherit' }}>
                  View Keywords →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Resume preview, larger column */}
          <div style={{ flex: '0 0 56%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #eef0f4', flexShrink: 0, background: '#fff' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>Resume Preview</span>
              <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                Open Preview ↗
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '12px 18px 14px' }}>
              <MiniDoc resume={resume} fill />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>{tab} — coming soon</div>
      )}

      {/* ── Action bar ── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8ecf0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', flexShrink: 0 }}>
        {[
          [<Copy size={15} />, 'Duplicate', () => onClone(resume.id)],
          [<Target size={15} />, 'Customize for a job', () => onNavigate(AppScreen.TAILOR)],
          [<BarChart2 size={15} />, 'Compare ATS Score', () => {}],
          [<Download size={15} />, 'Download PDF', () => {}],
        ].map(([ico, lbl, fn], i) => (
          <button key={lbl} onClick={fn}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 8px', border: 'none', borderRight: i < 3 ? '1px solid #f0f2f5' : 'none', background: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: '#374151', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span style={{ color: '#64748b' }}>{ico}</span>{lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AppScreen + MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */

export const AppScreen = {
  DASHBOARD: 0, BUILD_RESUME: 1, LIBRARY: 2,
  TRACKER: 3, TAILOR: 4, SKILL_GAPS: 5, PORTFOLIO: 6,
};

export default function LibraryPage({ onNavigate, resumes, onSelectResume, onDeleteResume, onCloneResume }) {
  const [selId, setSelId] = useState(null);   // null = grid view; id = split view
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const pick = id => { setSelId(id); onSelectResume(id); };
  const deselect = () => setSelId(null);
  const createNew = () => { onSelectResume(''); onNavigate(AppScreen.BUILD_RESUME); };
  const selected = resumes.find(r => r.id === selId) || null;

  // When a resume is selected, switch to list viewMode so the split panel makes sense
  const handlePick = id => {
    pick(id);
    setViewMode('list');
  };

  const isEmpty = resumes.length === 0;
  const showSplit = !isEmpty && selected;

  return (
    /* The parent DashboardPage sets padding:0 and overflow:hidden on main-content when isLibrary */
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1,
      height: '100vh', overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: '#f8fafc',
    }}>

      {/* ── Shared header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '16px 32px 0', flexShrink: 0 }}>
        <PageHeader onCreateNew={createNew} showBreadcrumb={!isEmpty} />
        <div style={{ marginTop: 16 }}>
          <FilterBar search={search} setSearch={setSearch} viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* STATE 1: Empty */}
        {isEmpty && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <EmptyLibrary onCreateNew={createNew} />
          </div>
        )}

        {/* STATE 2: Populated, nothing selected → full grid */}
        {!isEmpty && !showSplit && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <GridView
              resumes={resumes}
              search={search} setSearch={setSearch}
              viewMode={viewMode} setViewMode={setViewMode}
              onSelect={handlePick}
              onCreateNew={createNew}
              onClone={onCloneResume}
              onDelete={onDeleteResume}
            />
          </div>
        )}

        {/* STATE 3: Resume selected → split view */}
        {showSplit && (
          <>
            <SplitLeft
              resumes={resumes}
              selId={selId}
              search={search}
              onSelect={handlePick}
              onCreateNew={createNew}
              onClone={onCloneResume}
              onDelete={onDeleteResume}
            />
            <DetailPanel
              resume={selected}
              onClose={deselect}
              onClone={onCloneResume}
              onNavigate={onNavigate}
              AppScreen={AppScreen}
            />
          </>
        )}
      </div>
    </div>
  );
}
