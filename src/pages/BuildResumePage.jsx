import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import {
  User, Target, Mail, Phone, MapPin, Globe, PenLine, Briefcase, GraduationCap,
  ListChecks, Folder, GripVertical, ChevronUp, ChevronDown, Trash2, Plus, X,
  Sparkles, Lightbulb, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Save,
  Upload, FilePlus, FileText, LayoutGrid, LayoutList, Download, Loader2,
} from 'lucide-react';
import { scanRoleProfile, ROLE_PROFILES } from '../lib/resume/atsKeywords';
import { toSkillGroups, flattenSkills } from '../lib/resume/skills';
import {
  computeReadiness, deriveSectionStatus, draftToResume, emptyDraft,
  sampleDraft, blankDraft, draftFromParsed, draftFromResume, newEntryId,
  resumeContentFromDraft,
} from '../lib/resume/resumeDraft';
import { renderResumePdf } from '../lib/resume/resumesApi';
import { TEMPLATES, ACCENTS, templateById } from '../lib/resume/resumeTemplates';
import { SAMPLE_RESUME } from '../lib/resume/resumeSample';
import { importResumeFields, parseResumeSmart } from '../lib/resume/resumeFile';
import { scanScore, isScanStale } from '../lib/resume/scoreColor';
import { aiStatus, aiEnhance } from '../lib/ai';
import ResumeDocument from '../components/dashboard/ResumeDocument';
import './css/BuildResumePage.css';
import './css/EnhanceResumePage.css'; // shared .en-* / .en-ai-* classes (Enhance folded in here)

const SECTIONS = [
  { key: 'personal', label: 'Personal & contact', icon: User, section: 'header' },
  { key: 'summary', label: 'Summary', icon: PenLine, section: 'summary' },
  { key: 'experience', label: 'Work experience', icon: Briefcase, section: 'experience' },
  { key: 'education', label: 'Education', icon: GraduationCap, section: 'education', optional: true },
  { key: 'skills', label: 'Skills', icon: ListChecks, section: 'skills' },
  { key: 'projects', label: 'Projects', icon: Folder, section: 'projects', optional: true },
  { key: 'sections', label: 'More sections', icon: LayoutList, section: 'sections', optional: true },
];

const SUMMARY_TEMPLATE = '{Role} with {X}+ years of experience delivering {impact}. Skilled in {top skills}, with a track record of {key result}.';

const EDITOR_COPY = {
  personal: { title: 'Personal & contact', desc: 'Your name and headline anchor the whole resume.' },
  summary: { title: 'Professional summary', desc: 'A sharp 1–2 line intro lifts every recruiter scan.' },
  experience: { title: 'Work experience', desc: 'Lead with results, not duties.' },
  education: { title: 'Education', desc: 'Optional — add your degree and school.' },
  skills: { title: 'Skills', desc: 'Curate a focused, role-relevant list.' },
  projects: { title: 'Projects', desc: 'Optional — showcase standout work.' },
  sections: { title: 'More sections', desc: 'Add anything else — achievements, certifications, awards, languages…' },
};

const EDITOR_TIP = {
  personal: 'Use the exact job title you’re targeting as your headline — recruiters and ATS both match on it.',
  summary: 'Lead with your role, years of experience and one standout result. Two tight lines beat a paragraph.',
  experience: 'Numbers make achievements believable — “cut latency 40%” beats “improved performance.” Aim for a metric in most bullets.',
  education: 'Keep it brief: degree, school, and graduation year. Recent grads can lead with this; everyone else puts it after experience.',
  skills: 'Keyword score reflects your summary, experience & skills — education and projects aren’t scanned for keywords. Add the terms you genuinely have.',
  projects: 'Projects are gold for career-changers and juniors. Show the impact or scale, and link to something live if you can.',
  sections: 'Use the real section titles from your resume. Each item can have a heading, a short detail/date, and bullet points — nothing gets dropped.',
};

function ContactField({ label, icon: Icon, value, onChange, placeholder, full }) {
  const id = `bld-f-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className={`bld-field${full ? ' full' : ''}`}>
      <label className="bld-field-label" htmlFor={id}><Icon size={13} /> {label}</label>
      <input id={id} className="bld-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function BulletRow({ value, onChange, onRemove }) {
  const hasNum = /\d/.test(value);
  return (
    <div className={`en-bullet${hasNum ? ' ok' : ''}`}>
      <span className="en-bullet-dot" title={hasNum ? 'Has a metric' : 'Add a number'} />
      <input className="en-bullet-input" aria-label="Achievement bullet" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Describe an achievement with a number…" />
      <button type="button" className="bld-icon-btn danger" onClick={onRemove} aria-label="Remove bullet"><X size={14} /></button>
    </div>
  );
}

function AddInline({ value, onChange, onAdd, placeholder }) {
  return (
    <form className="en-add" onSubmit={(e) => { e.preventDefault(); onAdd(value); }}>
      <input className="en-add-input" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="submit" className="en-btn-mini" disabled={!value.trim()}><Plus size={14} /> Add</button>
    </form>
  );
}

// ── Template gallery — the single place templates are chosen. Shown on an empty
// draft (mode 'start': loads the example) and via "Change template" (mode 'switch':
// previews YOUR content in each layout and swaps it in, keeping everything). ─────
function TemplateGallery({ onUse, onBlank, onImport, onBack, mode = 'start', currentId, previewResume, resumes = [], onPick }) {
  const isSwitch = mode === 'switch';
  return (
    <div className="bgal">
      <div className="bgal-head">
        <div>
          {isSwitch && <button type="button" className="bgal-back" onClick={onBack}><ArrowLeft size={15} /> Back to editor</button>}
          <h1 className="bgal-title">{isSwitch ? 'Choose a template' : 'Build your resume'}</h1>
          <p className="bgal-sub">
            {isSwitch
              ? 'Switch your layout anytime — your content stays exactly as you left it.'
              : 'Start from a polished template, import an existing resume to autofill it, or begin from a blank page.'}
          </p>
        </div>
        {!isSwitch && (
          <div className="bgal-actions">
            {resumes.length > 0 && (
              <select className="en-select" aria-label="Edit a saved resume" value="__placeholder__" onChange={(e) => onPick && onPick(e.target.value)}>
                <option value="__placeholder__" disabled>Edit a saved resume…</option>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.role || 'Untitled'}</option>)}
              </select>
            )}
            <button type="button" className="bgal-btn primary" onClick={onImport}><Upload size={16} /> Import resume</button>
            <button type="button" className="bgal-btn" onClick={onBlank}><FilePlus size={16} /> Start blank</button>
          </div>
        )}
      </div>

      <div className="bgal-grid">
        {TEMPLATES.map((t) => {
          const current = isSwitch && currentId === t.id;
          return (
            <div className={`bgal-card${current ? ' current' : ''}`} key={t.id}>
              <div className="bgal-thumb">
                <ResumeDocument resume={previewResume || SAMPLE_RESUME} template={t.id} accent={isSwitch ? undefined : t.accent} />
                <div className="bgal-fade" />
              </div>
              <div className="bgal-meta">
                <div className="bgal-meta-text">
                  <span className="bgal-name">{t.name}{current ? ' · current' : ''}</span>
                  <span className="bgal-blurb">{t.blurb}</span>
                </div>
                <button type="button" className="bgal-use" onClick={() => onUse(t.id, t.accent)}>
                  {current ? 'Selected' : 'Use'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Import dialog (upload PDF/text or paste) ────────────────────────────────
function ImportDialog({ onClose, onFile, onPaste, busy, err, pasteText, setPasteText, fileRef }) {
  return (
    <div className="bimp-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bimp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bimp-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h2 className="bimp-title">Import your resume</h2>
        <p className="bimp-sub">Upload a PDF or text file, or paste your resume — we’ll auto-fill the details.</p>

        <button type="button" className="bimp-drop" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
          {busy ? <Sparkles size={22} className="bimp-spin" /> : <Upload size={22} />}
          <span>{busy ? 'Reading your file…' : 'Click to upload a file'}</span>
          <small>PDF, TXT, MD · parsed on your device, never uploaded</small>
        </button>

        <div className="bimp-or"><span>or paste text</span></div>
        <textarea
          className="bimp-text"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your resume text here…"
        />
        {err && <p className="bimp-err"><AlertCircle size={14} /> {err}</p>}

        <div className="bimp-foot">
          <button type="button" className="en-btn-mini ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="bld-save-btn" onClick={onPaste} disabled={busy || !pasteText.trim()}>
            <FileText size={15} /> Fill resume
          </button>
        </div>

        <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.markdown,.text" onChange={onFile} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

// ── Save dialog (name the resume + confirm the role before adding to library) ─
function SaveDialog({ draft, onCancel, onSave }) {
  const [label, setLabel] = useState(draft.role || 'Untitled resume');
  const [role, setRole] = useState(draft.role || '');
  const [target, setTarget] = useState(draft.target || '');
  const valid = label.trim() && role.trim();
  return (
    <div className="bimp-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="bimp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bimp-x" onClick={onCancel} aria-label="Close"><X size={18} /></button>
        <h2 className="bimp-title">Save to library</h2>
        <p className="bimp-sub">Name this resume and confirm the role it targets — so you can find the right one later.</p>
        <div className="bsave-form">
          <label className="bld-field">
            <span className="bld-field-label">Resume name</span>
            <input className="bld-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Frontend — Stripe application" autoFocus />
          </label>
          <label className="bld-field">
            <span className="bld-field-label">Job title / role</span>
            <input className="bld-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Software Engineer" />
          </label>
          <label className="bld-field">
            <span className="bld-field-label">Target / seniority <span className="bld-field-opt">optional</span></span>
            <input className="bld-input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Staff Engineer" />
          </label>
        </div>
        <div className="bimp-foot">
          <button type="button" className="en-btn-mini ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="bld-save-btn" disabled={!valid} onClick={() => onSave({ label: label.trim(), role: role.trim(), target: target.trim() })}>
            <Save size={15} /> Save to library
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuildResumePage({ draft, onChange, onSaveResume, onNavigate, resumes = [] }) {
  const [activeSection, setActiveSection] = useState('personal');
  const [skillInputs, setSkillInputs] = useState({}); // per-group "add skill" input
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importErr, setImportErr] = useState('');
  const [browsing, setBrowsing] = useState(false); // "Change template" overlay (keeps content)
  const [saveOpen, setSaveOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [advOpen, setAdvOpen] = useState(false);
  // Layout controls (Advanced): clamp font scale to a sane range.
  const adjFont = (d) => set('fontScale', Math.max(0.7, Math.min(1.2, Math.round(((draft.fontScale || 1) + d) * 100) / 100)));
  const fontPct = Math.round((draft.fontScale || 1) * 100);
  const curMargin = draft.pageMargin || 1;
  const fileRef = useRef(null);
  const editing = Boolean(draft.sourceId); // editing a saved resume (autosaves) vs a new draft
  // The saved resume behind this edit (carries the real ATS scan + stale flag).
  const sourceResume = editing ? resumes.find((r) => r.id === draft.sourceId) : null;
  const sourceScan = scanScore(sourceResume);
  const sourceStale = isScanStale(sourceResume);

  useEffect(() => {
    let live = true;
    aiStatus().then((d) => { if (live) setAiEnabled(Boolean(d && d.enabled)); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const profile = useMemo(() => ROLE_PROFILES.find((p) => p.id === draft.roleId) || ROLE_PROFILES[0], [draft.roleId]);
  const scan = useMemo(() => scanRoleProfile(profile, draft), [profile, draft]);
  const matchedSet = useMemo(() => new Set(scan.matched.map((m) => m.toLowerCase())), [scan]);
  // Skills are polymorphic — edit them as canonical groups (loose skills live in a
  // leading category:'' group); tolerant of a flat array or an old persisted draft.
  const skillGroups = useMemo(() => toSkillGroups(draft.skills), [draft.skills]);
  const readiness = useMemo(() => computeReadiness(draft, scan), [draft, scan]);
  const sectionStatus = useMemo(() => deriveSectionStatus(draft, scan), [draft, scan]);

  // ── mutations (single source of truth is the lifted draft in DashboardPage) ──
  const set = (field, value) => { onChange((d) => ({ ...d, [field]: value })); setSavedMsg(null); };
  const addRole = () => onChange((d) => ({ ...d, experience: [...d.experience, { _id: newEntryId(), company: '', role: '', period: '', bullets: [''] }] }));
  const removeRole = (i) => onChange((d) => ({ ...d, experience: d.experience.filter((_, idx) => idx !== i) }));
  const setRoleField = (i, f, v) => onChange((d) => ({ ...d, experience: d.experience.map((e, idx) => (idx === i ? { ...e, [f]: v } : e)) }));
  const addBullet = (i) => onChange((d) => ({ ...d, experience: d.experience.map((e, idx) => (idx === i ? { ...e, bullets: [...(e.bullets || []), ''] } : e)) }));
  const setBullet = (i, bi, v) => onChange((d) => ({ ...d, experience: d.experience.map((e, idx) => (idx === i ? { ...e, bullets: e.bullets.map((b, j) => (j === bi ? v : b)) } : e)) }));
  const removeBullet = (i, bi) => onChange((d) => ({ ...d, experience: d.experience.map((e, idx) => (idx === i ? { ...e, bullets: e.bullets.filter((_, j) => j !== bi) } : e)) }));
  const moveRole = (i, dir) => onChange((d) => {
    const j = i + dir;
    if (j < 0 || j >= d.experience.length) return d;
    const e = [...d.experience];
    [e[i], e[j]] = [e[j], e[i]];
    return { ...d, experience: e };
  });
  const applyMove = (from, to) => onChange((d) => {
    const e = [...d.experience];
    const [m] = e.splice(from, 1);
    e.splice(to > from ? to - 1 : to, 0, m);
    return { ...d, experience: e };
  });

  const addEdu = () => onChange((d) => ({ ...d, education: [...d.education, { _id: newEntryId(), school: '', degree: '', period: '' }] }));
  const removeEdu = (i) => onChange((d) => ({ ...d, education: d.education.filter((_, idx) => idx !== i) }));
  const setEduField = (i, f, v) => onChange((d) => ({ ...d, education: d.education.map((e, idx) => (idx === i ? { ...e, [f]: v } : e)) }));

  const addProject = () => onChange((d) => ({ ...d, projects: [...d.projects, { _id: newEntryId(), name: '', link: '', bullets: [''] }] }));
  const removeProject = (i) => onChange((d) => ({ ...d, projects: d.projects.filter((_, idx) => idx !== i) }));
  const setProjField = (i, f, v) => onChange((d) => ({ ...d, projects: d.projects.map((p, idx) => (idx === i ? { ...p, [f]: v } : p)) }));
  const addProjBullet = (i) => onChange((d) => ({ ...d, projects: d.projects.map((p, idx) => (idx === i ? { ...p, bullets: [...(p.bullets || []), ''] } : p)) }));
  const setProjBullet = (i, bi, v) => onChange((d) => ({ ...d, projects: d.projects.map((p, idx) => (idx === i ? { ...p, bullets: p.bullets.map((b, j) => (j === bi ? v : b)) } : p)) }));
  const removeProjBullet = (i, bi) => onChange((d) => ({ ...d, projects: d.projects.map((p, idx) => (idx === i ? { ...p, bullets: p.bullets.filter((_, j) => j !== bi) } : p)) }));

  // ── categorized skills (loose skills live in a category:'' group) ──
  // Every mutation normalises draft.skills → canonical groups first, so it works
  // whether the draft is still flat (new/legacy) or already grouped.
  const mutateSkills = (fn) => { onChange((d) => ({ ...d, skills: fn(toSkillGroups(d.skills)) })); setSavedMsg(null); };
  const skillExists = (groups, s) => flattenSkills(groups).some((x) => x.toLowerCase() === s.toLowerCase());
  const setSkillInput = (gi, v) => setSkillInputs((m) => ({ ...m, [gi]: v }));
  const addSkillToGroup = (gi, raw) => {
    const s = (raw || '').trim();
    if (!s) return;
    mutateSkills((groups) => {
      if (!groups[gi] || skillExists(groups, s)) return groups;
      return groups.map((g, i) => (i === gi ? { ...g, items: [...g.items, s] } : g));
    });
  };
  // Add to the (first) uncategorized group, creating it if absent — used by the
  // role suggestions + AI "skills to add".
  const addSkill = (raw) => {
    const s = (raw || '').trim();
    if (!s) return;
    mutateSkills((groups) => {
      if (skillExists(groups, s)) return groups;
      const g = [...groups];
      let li = g.findIndex((x) => !x.category);
      if (li < 0) { g.unshift({ category: '', items: [] }); li = 0; }
      g[li] = { ...g[li], items: [...g[li].items, s] };
      return g;
    });
  };
  const removeSkillFromGroup = (gi, skill) => mutateSkills((groups) => groups
    .map((g, i) => (i === gi ? { ...g, items: g.items.filter((x) => x !== skill) } : g))
    .filter((g) => g.category || g.items.length)); // drop an emptied uncategorized group
  const setGroupCategory = (gi, v) => mutateSkills((groups) => groups.map((g, i) => (i === gi ? { ...g, category: v } : g)));
  const addSkillGroup = (category = '') => mutateSkills((groups) => [...groups, { category, items: [] }]);
  const removeSkillGroup = (gi) => mutateSkills((groups) => groups.filter((_, i) => i !== gi));
  const moveSkillGroup = (gi, dir) => mutateSkills((groups) => {
    const j = gi + dir;
    if (j < 0 || j >= groups.length) return groups;
    const g = [...groups];
    [g[gi], g[j]] = [g[j], g[gi]];
    return g;
  });

  // ── dynamic custom sections (Achievements, Certifications, …) ──
  const mapSections = (d, fn) => ({ ...d, sections: (d.sections || []).map(fn) });
  const addSectionBlock = (title = '') => onChange((d) => ({ ...d, sections: [...(d.sections || []), { _id: newEntryId(), title, entries: [{ _id: newEntryId(), heading: '', meta: '', bullets: [''] }] }] }));
  const removeSectionBlock = (si) => onChange((d) => ({ ...d, sections: (d.sections || []).filter((_, i) => i !== si) }));
  const setSectionTitle = (si, v) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, title: v } : s)));
  const moveSection = (si, dir) => onChange((d) => {
    const arr = [...(d.sections || [])];
    const j = si + dir;
    if (j < 0 || j >= arr.length) return d;
    [arr[si], arr[j]] = [arr[j], arr[si]];
    return { ...d, sections: arr };
  });
  const addSectionEntry = (si) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: [...(s.entries || []), { _id: newEntryId(), heading: '', meta: '', bullets: [''] }] } : s)));
  const removeSectionEntry = (si, ei) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: (s.entries || []).filter((_, j) => j !== ei) } : s)));
  const setSectionEntryField = (si, ei, f, v) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: (s.entries || []).map((e, j) => (j === ei ? { ...e, [f]: v } : e)) } : s)));
  const addSectionBullet = (si, ei) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: (s.entries || []).map((e, j) => (j === ei ? { ...e, bullets: [...(e.bullets || []), ''] } : e)) } : s)));
  const setSectionBullet = (si, ei, bi, v) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: (s.entries || []).map((e, j) => (j === ei ? { ...e, bullets: (e.bullets || []).map((b, k) => (k === bi ? v : b)) } : e)) } : s)));
  const removeSectionBullet = (si, ei, bi) => onChange((d) => mapSections(d, (s, i) => (i === si ? { ...s, entries: (s.entries || []).map((e, j) => (j === ei ? { ...e, bullets: (e.bullets || []).filter((_, k) => k !== bi) } : e)) } : s)));

  // ── drag-to-reorder roles (native HTML5; grip-only) ──
  const commitReorder = (e) => {
    e.preventDefault();
    if (dragIndex !== null && dropIndex !== null && dropIndex !== dragIndex) applyMove(dragIndex, dropIndex);
    setDragIndex(null);
    setDropIndex(null);
  };
  const endDrag = () => { setDragIndex(null); setDropIndex(null); };

  const nav = (k) => { setActiveSection(k); setSavedMsg(null); };
  const order = SECTIONS.map((s) => s.key);
  const idx = order.indexOf(activeSection);
  const prevSec = idx > 0 ? SECTIONS[idx - 1] : null;
  const nextSec = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;

  const activeSec = SECTIONS[idx];
  const activeStatus = sectionStatus[activeSection];
  const canSave = !!draft.name.trim();
  const openSave = () => { if (canSave) setSaveOpen(true); };
  const handleSaveConfirm = async ({ label, role, target }) => {
    const next = { ...draft, role, target };
    const saved = await onSaveResume(draftToResume(next, readiness, label));
    // Adopt the server id so further edits autosave in place (never a duplicate).
    onChange((d) => ({ ...d, role, target, sourceId: saved ? saved.id : d.sourceId }));
    setSaveOpen(false);
    setSavedMsg({ name: label });
  };
  const handleClear = () => {
    if (window.confirm('Start a new resume? Your current edits to a saved resume are already kept; an unsaved new draft will be cleared.')) {
      onChange(emptyDraft());
      setActiveSection('personal');
      setSavedMsg(null);
    }
  };

  // ── resume picker: edit a saved resume in place, or start a new one ──
  const draftHasContent = (d) => Boolean(d && (
    (d.name || '').trim() || (d.summary || '').trim() || flattenSkills(d.skills).length ||
    (d.experience || []).some((e) => (e.company || '').trim() || (e.role || '').trim() || (e.bullets || []).some((b) => (b || '').trim()))
  ));
  // Only a NEW draft with content is at risk on switch (existing resumes autosave).
  const confirmLeaveNew = () => editing || !draftHasContent(draft) || window.confirm('Discard your unsaved new resume?');
  const pickResume = (id) => {
    if (id === '__new__') {
      if (!confirmLeaveNew()) return;
      onChange(emptyDraft());
    } else {
      const r = resumes.find((x) => x.id === id);
      if (!r || !confirmLeaveNew()) return;
      onChange(draftFromResume(r));
    }
    setActiveSection('personal');
    setBrowsing(false);
    setSavedMsg(null);
  };

  // ── Improve with AI (Mistral) — folded in from the old Enhance page ──
  const runAi = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const { result } = await aiEnhance({ resume: draft, target: profile.label });
      setAiResult(result);
    } catch (err) {
      setAiError((err && err.message) || 'Could not get AI suggestions.');
    } finally {
      setAiLoading(false);
    }
  };
  const openAi = () => { setAiOpen(true); setAiResult(null); runAi(); };
  const applyRewrite = (original, improved) => onChange((d) => ({
    ...d,
    experience: (d.experience || []).map((e) => ({ ...e, bullets: (e.bullets || []).map((b) => (b === original ? improved : b)) })),
  }));

  // ── template gallery / import ──
  // Picking a template: on first run loads the example; via "Change template" it
  // just swaps the layout and keeps the user's content + accent.
  const handleUse = (id, accent) => {
    if (browsing) onChange((d) => ({ ...d, template: id }));
    else onChange(sampleDraft(id, accent));
    setBrowsing(false);
    setActiveSection('personal');
  };
  const startBlank = () => { onChange(blankDraft('modern')); setActiveSection('personal'); };
  // Download = render the SAME template the editor shows to a print-perfect A4 PDF
  // via headless Chrome (so the PDF matches the preview exactly, with clickable
  // links). Falls back to the browser print dialog if the engine is unavailable.
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const { buildResumePrintHtml } = await import('../components/resume/printDoc');
      const blob = await renderResumePdf(buildResumePrintHtml(resumeContentFromDraft(draft)));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(draft.name || 'resume').trim().replace(/\s+/g, '_') || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (typeof window !== 'undefined') window.print(); // graceful fallback
    } finally {
      setDownloading(false);
    }
  };
  const hasContent = (p) => p && (p.name || p.summary || (p.skills || []).length || (p.experience || []).length);
  const applyParsedFields = (parsed) => {
    // Keep sourceId/roleId so importing INTO a saved resume updates it in place
    // (autosaves) rather than spawning a new draft.
    onChange((d) => ({ ...draftFromParsed(parsed, d.template || 'modern', d.accent), sourceId: d.sourceId, roleId: d.roleId }));
    setActiveSection('personal');
    setImportOpen(false);
    setPasteText('');
    setImportErr('');
  };
  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setImportBusy(true);
    setImportErr('');
    try {
      const parsed = await importResumeFields(file, { aiEnabled });
      if (!hasContent(parsed)) throw new Error('empty');
      applyParsedFields(parsed);
    } catch {
      setImportErr('Could not read that file. Try another PDF, or paste the text instead.');
    } finally {
      setImportBusy(false);
    }
  };
  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    setImportBusy(true);
    setImportErr('');
    try {
      applyParsedFields(await parseResumeSmart(pasteText, { aiEnabled }));
    } catch {
      setImportErr('Could not parse that text.');
    } finally {
      setImportBusy(false);
    }
  };

  const summaryLen = (draft.summary || '').trim().length;
  const inGallery = !draft.template || browsing;

  const importDialog = importOpen && (
    <ImportDialog
      onClose={() => { setImportOpen(false); setImportErr(''); }}
      onFile={handleImportFile}
      onPaste={handlePaste}
      busy={importBusy}
      err={importErr}
      pasteText={pasteText}
      setPasteText={setPasteText}
      fileRef={fileRef}
    />
  );

  if (inGallery) {
    return (
      <div className="bld-page bld-page--gallery">
        <TemplateGallery
          mode={draft.template ? 'switch' : 'start'}
          currentId={draft.template}
          previewResume={draft.template ? draft : undefined}
          resumes={resumes}
          onPick={pickResume}
          onUse={handleUse}
          onBlank={startBlank}
          onImport={() => setImportOpen(true)}
          onBack={() => setBrowsing(false)}
        />
        {importDialog}
      </div>
    );
  }

  return (
    <div className="bld-page">
      <div className="bld-topbar">
        <div className="bld-topbar-left">
          <h1 className="bld-title">Resume Studio</h1>
          <select
            className="en-select bld-resume-picker"
            aria-label="Choose a resume to edit"
            value={draft.sourceId || '__new__'}
            onChange={(e) => pickResume(e.target.value)}
          >
            <option value="__new__">＋ New resume</option>
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.role || 'Untitled'}</option>)}
          </select>
          <span className="bld-pill">
            {editing ? <><CheckCircle2 size={13} /> Editing · autosaved</> : <><PenLine size={13} /> New · not saved</>}
          </span>
          {sourceScan !== null && (
            <span className="bld-pill" style={{ color: sourceStale ? '#d97706' : undefined }}>
              {sourceStale
                ? <>ATS {sourceScan} · edited — <button type="button" onClick={() => onNavigate('ats')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>re-scan</button></>
                : <>ATS {sourceScan}{sourceResume.scanTarget ? ` · vs ${sourceResume.scanTarget}` : ''}</>}
            </span>
          )}
        </div>
        <div className="bld-topbar-actions">
          {aiEnabled && <button type="button" className="bld-import-btn" onClick={openAi}><Sparkles size={15} /> Improve with AI</button>}
          <button type="button" className="bld-import-btn" onClick={() => setImportOpen(true)}><Upload size={15} /> Import</button>
          {!editing && (
            <button type="button" className="bld-save-btn" onClick={openSave} disabled={!canSave} title={canSave ? 'Save to your library' : 'Add your name to save'}>
              <Save size={16} /> Save to library
            </button>
          )}
        </div>
      </div>

      <div className="bld-grid">
        {/* ── Workspace: compact strength + section stepper + the active form ── */}
        <main className="bld-work">
          <div className="bld-work-top">
            <div className="bld-tailor">
              <span className="bld-tailor-label">Tailoring for</span>
              <select id="bld-role" aria-label="Target role" className="en-select" value={draft.roleId} onChange={(e) => set('roleId', e.target.value)}>
                {ROLE_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <button type="button" className="bld-clear-btn" onClick={handleClear}><Trash2 size={13} /> Clear</button>
          </div>

          <nav className="bld-steps" aria-label="Resume sections">
            {SECTIONS.map((s) => {
              const st = sectionStatus[s.key];
              const Icon = s.icon;
              return (
                <button key={s.key} type="button" className={`bld-step${s.key === activeSection ? ' active' : ''}`} onClick={() => nav(s.key)} title={st.badge}>
                  <Icon size={14} className="bld-step-ic" />
                  <span className="bld-step-label">{s.label}</span>
                  <span className={`bld-step-dot ${st.pip}`} />
                </button>
              );
            })}
          </nav>

          {/* ── Active section form ── */}
          <section className="bld-editor card-widget">
          <div className="en-editor-head">
            <div className="en-editor-ic"><activeSec.icon size={18} /></div>
            <div className="en-editor-headtext">
              <h2 className="en-editor-title">{EDITOR_COPY[activeSection].title}</h2>
              <p className="en-editor-desc">{EDITOR_COPY[activeSection].desc}</p>
            </div>
            <span className={`en-editor-badge ${activeStatus.pip === 'done' ? 'ok' : 'warn'}`}>
              {activeStatus.pip === 'done' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{activeStatus.badge}
            </span>
          </div>

          <div className="en-editor-body">
            {savedMsg && (
              <div className="en-ok-note" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} /> “{savedMsg.name}” saved to your library</span>
                <div className="bld-saved-actions">
                  <button type="button" className="en-btn-mini" onClick={() => onNavigate('library')}>View in library</button>
                  <button type="button" className="en-btn-mini ghost" onClick={() => setSavedMsg(null)}>Keep editing</button>
                </div>
              </div>
            )}

            {activeSection === 'personal' && (
              <div className="bld-field-grid">
                <ContactField label="Full name" icon={User} value={draft.name} onChange={(v) => set('name', v)} placeholder="Alex Johnson" />
                <ContactField label="Job title" icon={Briefcase} value={draft.role} onChange={(v) => set('role', v)} placeholder="Frontend Engineer" />
                <ContactField label="Target / seniority" icon={Target} value={draft.target} onChange={(v) => set('target', v)} placeholder="Senior" />
                <ContactField label="Email" icon={Mail} value={draft.email} onChange={(v) => set('email', v)} placeholder="you@email.com" />
                <ContactField label="Phone" icon={Phone} value={draft.phone} onChange={(v) => set('phone', v)} placeholder="(555) 123-4567" />
                <ContactField label="Location" icon={MapPin} value={draft.location} onChange={(v) => set('location', v)} placeholder="San Francisco, CA" />
                <ContactField full label="Website / portfolio" icon={Globe} value={draft.link} onChange={(v) => set('link', v)} placeholder="yoursite.com" />
              </div>
            )}

            {activeSection === 'summary' && (
              <>
                <textarea
                  className="en-textarea"
                  value={draft.summary}
                  onChange={(e) => set('summary', e.target.value)}
                  placeholder="Write a 1–2 line professional summary that frames your target role and strongest results."
                />
                <div className="en-row-between">
                  <span className={`en-count${summaryLen >= 80 ? ' ok' : ''}`}>{summaryLen} chars{summaryLen < 80 ? ' · aim for 80+' : ' ✓'}</span>
                  {summaryLen === 0 && <button type="button" className="en-btn-mini" onClick={() => set('summary', SUMMARY_TEMPLATE)}><Lightbulb size={13} /> Insert template</button>}
                </div>
              </>
            )}

            {activeSection === 'experience' && (
              <div className="bld-cards" onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }} onDrop={commitReorder}>
                {draft.experience.map((exp, i) => (
                  <Fragment key={exp._id || i}>
                    {dragIndex !== null && dropIndex === i && dragIndex !== i && <div className="bld-drop-line" />}
                    <div className={`bld-card${dragIndex === i ? ' dragging' : ''}`} onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); setDropIndex(i); } }}>
                      <div className="bld-card-head">
                        <span className="bld-grip" draggable onDragStart={() => setDragIndex(i)} onDragEnd={endDrag} title="Drag to reorder"><GripVertical size={15} /></span>
                        <span className="bld-card-index">Role {i + 1}</span>
                        <div className="bld-card-tools">
                          <button type="button" className="bld-icon-btn" disabled={i === 0} onClick={() => moveRole(i, -1)} aria-label="Move role up"><ChevronUp size={15} /></button>
                          <button type="button" className="bld-icon-btn" disabled={i === draft.experience.length - 1} onClick={() => moveRole(i, 1)} aria-label="Move role down"><ChevronDown size={15} /></button>
                          <button type="button" className="bld-icon-btn danger" onClick={() => removeRole(i)} aria-label="Remove role"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <div className="bld-card-fields">
                        <input className="bld-input" placeholder="Company" value={exp.company} onChange={(e) => setRoleField(i, 'company', e.target.value)} />
                        <input className="bld-input" placeholder="Period (e.g. 2021 – Present)" value={exp.period} onChange={(e) => setRoleField(i, 'period', e.target.value)} />
                        <input className="bld-input wide" placeholder="Job title" value={exp.role} onChange={(e) => setRoleField(i, 'role', e.target.value)} />
                      </div>
                      <div className="bld-card-bullets">
                        {(exp.bullets || []).map((b, bi) => <BulletRow key={bi} value={b} onChange={(v) => setBullet(i, bi, v)} onRemove={() => removeBullet(i, bi)} />)}
                        <button type="button" className="en-btn-mini ghost" onClick={() => addBullet(i)}><Plus size={13} /> Add bullet</button>
                      </div>
                    </div>
                  </Fragment>
                ))}
                {dragIndex !== null && dropIndex === draft.experience.length && <div className="bld-drop-line" />}
                <div onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); setDropIndex(draft.experience.length); } }}>
                  <button type="button" className="bld-add-entry" onClick={addRole}><Plus size={15} /> Add role</button>
                </div>
              </div>
            )}

            {activeSection === 'education' && (
              draft.education.length === 0 ? (
                <div className="bld-optional-empty">
                  <GraduationCap size={22} style={{ color: 'var(--text-light)' }} />
                  <p>Add your degree and school. Optional, but it rounds out your resume.</p>
                  <button type="button" className="bld-add-entry" onClick={addEdu}><Plus size={15} /> Add education</button>
                </div>
              ) : (
                <>
                  {draft.education.map((ed, i) => (
                    <div key={ed._id || i} className="bld-card">
                      <div className="bld-card-head">
                        <span className="bld-card-index">Education {i + 1}</span>
                        <div className="bld-card-tools">
                          <button type="button" className="bld-icon-btn danger" onClick={() => removeEdu(i)} aria-label="Remove education"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <div className="bld-card-fields">
                        <input className="bld-input wide" placeholder="School" value={ed.school} onChange={(e) => setEduField(i, 'school', e.target.value)} />
                        <input className="bld-input" placeholder="Degree / field" value={ed.degree} onChange={(e) => setEduField(i, 'degree', e.target.value)} />
                        <input className="bld-input" placeholder="Period (e.g. 2015 – 2019)" value={ed.period} onChange={(e) => setEduField(i, 'period', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="bld-add-entry" onClick={addEdu}><Plus size={15} /> Add education</button>
                </>
              )
            )}

            {activeSection === 'skills' && (
              <>
                <span className="en-subhead">Group skills under a category (Languages, Frameworks…) or leave them uncategorized — either renders cleanly.</span>
                {skillGroups.length === 0 && (
                  <span className="en-count">No skills yet — add your own below, or pull from the suggestions.</span>
                )}
                {skillGroups.map((g, gi) => (
                  <div key={gi} style={{ marginTop: gi ? 12 : 8, paddingTop: gi ? 12 : 0, borderTop: gi ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input
                        className="bld-input wide"
                        placeholder="Category (optional, e.g. Languages)"
                        value={g.category}
                        onChange={(e) => setGroupCategory(gi, e.target.value)}
                      />
                      <div className="bld-card-tools">
                        <button type="button" className="bld-icon-btn" disabled={gi === 0} onClick={() => moveSkillGroup(gi, -1)} aria-label="Move group up"><ChevronUp size={15} /></button>
                        <button type="button" className="bld-icon-btn" disabled={gi === skillGroups.length - 1} onClick={() => moveSkillGroup(gi, 1)} aria-label="Move group down"><ChevronDown size={15} /></button>
                        <button type="button" className="bld-icon-btn danger" onClick={() => removeSkillGroup(gi)} aria-label="Remove group"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="en-chips">
                      {g.items.map((s) => (
                        <span key={s} className={`en-chip-edit${matchedSet.has(s.toLowerCase()) ? ' hit' : ''}`}>
                          {s}<button type="button" className="en-chip-x" aria-label={`Remove ${s}`} onClick={() => removeSkillFromGroup(gi, s)}><X size={12} strokeWidth={3} /></button>
                        </span>
                      ))}
                      {g.items.length === 0 && <span className="en-count">No skills in this group yet.</span>}
                    </div>
                    <AddInline value={skillInputs[gi] || ''} onChange={(v) => setSkillInput(gi, v)} onAdd={(v) => { addSkillToGroup(gi, v); setSkillInput(gi, ''); }} placeholder="Add a skill (e.g. Terraform)" />
                  </div>
                ))}
                <button type="button" className="bld-add-entry" style={{ marginTop: 12 }} onClick={() => addSkillGroup('')}><Plus size={15} /> Add category</button>
                {scan.missing.length > 0 && (
                  <>
                    <div className="en-row-between" style={{ marginTop: 12 }}>
                      <span className="en-subhead">Suggested for {profile.label}</span>
                      <button type="button" className="en-btn-mini" onClick={() => scan.missing.forEach(addSkill)}><Sparkles size={13} /> Add all</button>
                    </div>
                    <div className="en-chips">
                      {scan.missing.map((kw) => <button key={kw} type="button" className="en-chip-add" onClick={() => addSkill(kw)}><Plus size={13} strokeWidth={3} /> {kw}</button>)}
                    </div>
                  </>
                )}
                <span className="bld-kw-count" style={{ marginTop: 10 }}><strong>{scan.matched.length}/{scan.detected.length}</strong> {profile.label} keywords covered</span>
              </>
            )}

            {activeSection === 'projects' && (
              draft.projects.length === 0 ? (
                <div className="bld-optional-empty">
                  <Folder size={22} style={{ color: 'var(--text-light)' }} />
                  <p>Showcase standout work — side projects, open source, or case studies.</p>
                  <button type="button" className="bld-add-entry" onClick={addProject}><Plus size={15} /> Add project</button>
                </div>
              ) : (
                <>
                  {draft.projects.map((p, i) => (
                    <div key={p._id || i} className="bld-card">
                      <div className="bld-card-head">
                        <span className="bld-card-index">Project {i + 1}</span>
                        <div className="bld-card-tools">
                          <button type="button" className="bld-icon-btn danger" onClick={() => removeProject(i)} aria-label="Remove project"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <div className="bld-card-fields">
                        <input className="bld-input" placeholder="Project name" value={p.name} onChange={(e) => setProjField(i, 'name', e.target.value)} />
                        <input className="bld-input" placeholder="Link (optional)" value={p.link} onChange={(e) => setProjField(i, 'link', e.target.value)} />
                      </div>
                      <div className="bld-card-bullets">
                        {(p.bullets || []).map((b, bi) => <BulletRow key={bi} value={b} onChange={(v) => setProjBullet(i, bi, v)} onRemove={() => removeProjBullet(i, bi)} />)}
                        <button type="button" className="en-btn-mini ghost" onClick={() => addProjBullet(i)}><Plus size={13} /> Add bullet</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="bld-add-entry" onClick={addProject}><Plus size={15} /> Add project</button>
                </>
              )
            )}

            {activeSection === 'sections' && (
              <>
                {(draft.sections || []).length === 0 && (
                  <div className="bld-optional-empty">
                    <LayoutList size={22} style={{ color: 'var(--text-light)' }} />
                    <p>Add any extra sections your resume has — Achievements, Certifications, Awards, Languages, Volunteering, anything.</p>
                  </div>
                )}
                {(draft.sections || []).map((sec, si) => (
                  <div key={sec._id || si} className="bld-card">
                    <div className="bld-card-head">
                      <span className="bld-card-index">Section {si + 1}</span>
                      <div className="bld-card-tools">
                        <button type="button" className="bld-icon-btn" disabled={si === 0} onClick={() => moveSection(si, -1)} aria-label="Move section up"><ChevronUp size={15} /></button>
                        <button type="button" className="bld-icon-btn" disabled={si === draft.sections.length - 1} onClick={() => moveSection(si, 1)} aria-label="Move section down"><ChevronDown size={15} /></button>
                        <button type="button" className="bld-icon-btn danger" onClick={() => removeSectionBlock(si)} aria-label="Remove section"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="bld-card-fields">
                      <input className="bld-input wide" placeholder="Section title (e.g. Achievements)" value={sec.title} onChange={(e) => setSectionTitle(si, e.target.value)} />
                    </div>
                    {(sec.entries || []).map((en, ei) => (
                      <div key={en._id || ei} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                        <div className="bld-card-fields">
                          <input className="bld-input wide" placeholder="Heading (e.g. AWS Certified Developer) — optional" value={en.heading} onChange={(e) => setSectionEntryField(si, ei, 'heading', e.target.value)} />
                          <input className="bld-input" placeholder="Detail / date (optional)" value={en.meta} onChange={(e) => setSectionEntryField(si, ei, 'meta', e.target.value)} />
                        </div>
                        <div className="bld-card-bullets">
                          {(en.bullets || []).map((b, bi) => <BulletRow key={bi} value={b} onChange={(v) => setSectionBullet(si, ei, bi, v)} onRemove={() => removeSectionBullet(si, ei, bi)} />)}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="en-btn-mini ghost" onClick={() => addSectionBullet(si, ei)}><Plus size={13} /> Add line</button>
                            {(sec.entries || []).length > 1 && <button type="button" className="en-btn-mini ghost" onClick={() => removeSectionEntry(si, ei)}><Trash2 size={13} /> Remove item</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="en-btn-mini ghost" style={{ marginTop: 10 }} onClick={() => addSectionEntry(si)}><Plus size={13} /> Add item</button>
                  </div>
                ))}
                <button type="button" className="bld-add-entry" onClick={() => addSectionBlock('')}><Plus size={15} /> Add section</button>
                <div className="en-chips" style={{ marginTop: 10 }}>
                  {['Achievements', 'Certifications', 'Awards', 'Publications', 'Languages', 'Volunteering'].map((t) => (
                    <button key={t} type="button" className="en-chip-add" onClick={() => addSectionBlock(t)}><Plus size={13} strokeWidth={3} /> {t}</button>
                  ))}
                </div>
              </>
            )}

            <div className="en-tip">
              <Lightbulb size={15} className="en-tip-ic" />
              <span>{EDITOR_TIP[activeSection]}</span>
            </div>
          </div>

          <div className="bld-editor-foot">
            <button type="button" className="bld-nav-btn" onClick={() => prevSec && nav(prevSec.key)} disabled={!prevSec}><ArrowLeft size={15} /> Back</button>
            {nextSec
              ? <button type="button" className="bld-nav-btn next" onClick={() => nav(nextSec.key)}>Next: {nextSec.label} <ArrowRight size={15} /></button>
              : editing
                ? <button type="button" className="bld-nav-btn next" onClick={() => onNavigate('library')}>Done · view in library <ArrowRight size={15} /></button>
                : <button type="button" className="bld-save-btn" onClick={openSave} disabled={!canSave}><Save size={15} /> Save to library</button>}
          </div>
          </section>
        </main>

        {/* ── Live PDF preview (template is chosen in the gallery; this is a quick
               accent picker + a link back to templates) ── */}
        <aside className="bld-preview">
          <div className="bld-preview-bar">
            <button type="button" className="bld-change-tpl" onClick={() => setBrowsing(true)}>
              <LayoutGrid size={14} /> {templateById(draft.template).name}
              <span className="bld-change-tpl-hint">Change</span>
            </button>
            <span className="bld-pagecount" title="Pages in the exported PDF">
              <FileText size={13} /> {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
            <div className="bld-preview-actions">
              <div className="bld-accent-row">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`bld-accent${draft.accent === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => set('accent', c)}
                    aria-label={`Use accent ${c}`}
                  />
                ))}
              </div>
              <div className="bld-adv">
                <button
                  type="button"
                  className={`bld-adv-btn${advOpen ? ' open' : ''}`}
                  onClick={() => setAdvOpen((o) => !o)}
                  title="Layout: font size & margins"
                >
                  Layout <ChevronDown size={13} />
                </button>
                {advOpen && (
                  <>
                    <button type="button" className="bld-adv-backdrop" aria-label="Close layout options" onClick={() => setAdvOpen(false)} />
                    <div className="bld-adv-pop">
                      <div className="bld-adv-row">
                        <span className="bld-adv-label">Font size</span>
                        <div className="bld-adv-step">
                          <button type="button" onClick={() => adjFont(-0.05)} disabled={fontPct <= 70} aria-label="Smaller font">−</button>
                          <span className="bld-adv-val">{fontPct}%</span>
                          <button type="button" onClick={() => adjFont(0.05)} disabled={fontPct >= 120} aria-label="Larger font">+</button>
                        </div>
                      </div>
                      <div className="bld-adv-row">
                        <span className="bld-adv-label">Margins</span>
                        <div className="bld-adv-seg">
                          {[['Narrow', 0.6], ['Normal', 1], ['Wide', 1.4]].map(([lbl, v]) => (
                            <button
                              key={lbl}
                              type="button"
                              className={curMargin === v ? 'active' : ''}
                              onClick={() => set('pageMargin', v)}
                            >{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="bld-adv-reset"
                        onClick={() => { set('fontScale', 1); set('pageMargin', 1); }}
                      >Reset to default</button>
                    </div>
                  </>
                )}
              </div>
              <button type="button" className="bld-download-btn" onClick={handleDownload} disabled={downloading} title="Download as PDF">
                {downloading ? <><Loader2 size={14} className="en-ai-spin" /> Preparing…</> : <><Download size={14} /> Download</>}
              </button>
            </div>
          </div>
          <div className="bld-canvas">
            <ResumeDocument resume={draft} template={draft.template} accent={draft.accent} paged onPageCount={setPageCount} />
          </div>
        </aside>
      </div>

      {importDialog}
      {saveOpen && <SaveDialog draft={draft} onCancel={() => setSaveOpen(false)} onSave={handleSaveConfirm} />}

      {aiOpen && (
        <div className="en-ai-overlay" role="dialog" aria-modal="true" onClick={() => setAiOpen(false)}>
          <div className="en-ai-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="en-ai-x" onClick={() => setAiOpen(false)} aria-label="Close"><X size={18} /></button>
            <h2 className="en-ai-title"><Sparkles size={18} /> AI suggestions</h2>
            <p className="en-ai-sub">Mistral reviewed your resume for {profile.label}. Apply what fits.</p>

            {aiLoading && <div className="en-ai-loading"><Loader2 size={22} className="en-ai-spin" /> Analyzing your resume…</div>}
            {aiError && <p className="en-ai-error"><AlertCircle size={14} /> {aiError} <button type="button" className="en-btn-mini" onClick={runAi}>Retry</button></p>}

            {aiResult && !aiLoading && (
              <div className="en-ai-body">
                {aiResult.summary && (
                  <div className="en-ai-block">
                    <div className="en-ai-block-h"><span>Summary</span><button type="button" className="en-btn-mini" onClick={() => set('summary', aiResult.summary)}>Apply</button></div>
                    <p className="en-ai-text">{aiResult.summary}</p>
                  </div>
                )}
                {aiResult.bullets && aiResult.bullets.length > 0 && (
                  <div className="en-ai-block">
                    <div className="en-ai-block-h"><span>Stronger bullets</span></div>
                    {aiResult.bullets.map((b, i) => (
                      <div className="en-ai-bullet" key={i}>
                        <p className="en-ai-orig">{b.original}</p>
                        <p className="en-ai-improved">{b.improved}</p>
                        <button type="button" className="en-btn-mini" onClick={() => applyRewrite(b.original, b.improved)}>Apply</button>
                      </div>
                    ))}
                  </div>
                )}
                {aiResult.missingSkills && aiResult.missingSkills.length > 0 && (
                  <div className="en-ai-block">
                    <div className="en-ai-block-h"><span>Skills to add</span></div>
                    <div className="en-chips">
                      {aiResult.missingSkills.map((s) => <button key={s} type="button" className="en-chip-add" onClick={() => addSkill(s)}><Plus size={13} strokeWidth={3} /> {s}</button>)}
                    </div>
                  </div>
                )}
                {aiResult.tips && aiResult.tips.length > 0 && (
                  <div className="en-ai-block">
                    <div className="en-ai-block-h"><span>Tips</span></div>
                    <ul className="en-ai-tips">{aiResult.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
