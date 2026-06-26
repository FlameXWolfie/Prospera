import { useState, useMemo, useRef } from 'react';
import {
  Sparkles, Plus, X, Wand2, Upload, FilePlus, ChevronRight,
  CheckCircle2, AlertCircle, KeyRound, ListChecks, PenLine, TrendingUp, Lightbulb,
} from 'lucide-react';
import { scanRole, ROLE_PROFILES, profileForResume } from '../lib/atsKeywords';
import { resumeFromUpload } from '../lib/resumeUpload';
import { scoreColor } from '../lib/scoreColor';
import ResumeDocument from '../components/dashboard/ResumeDocument';
import './css/EnhanceResumePage.css';

const CATS = [
  { key: 'keywords', label: 'Keywords', icon: KeyRound, section: 'skills' },
  { key: 'skills', label: 'Skills', icon: ListChecks, section: 'skills' },
  { key: 'summary', label: 'Summary', icon: PenLine, section: 'summary' },
  { key: 'impact', label: 'Impact', icon: TrendingUp, section: 'experience' },
];

const SUMMARY_TEMPLATE = '{Role} with {X}+ years of experience delivering {impact}. Skilled in {top skills}, with a track record of {key result}.';

// Small dependency-free score ring (conic gradient).
function Ring({ value }) {
  const color = scoreColor(value);
  return (
    <div className="en-ring" style={{ background: `conic-gradient(${color} ${value * 3.6}deg, var(--border-color) 0deg)` }}>
      <div className="en-ring-inner">
        <span className="en-ring-num" style={{ color }}>{value}%</span>
        <span className="en-ring-lbl">match</span>
      </div>
    </div>
  );
}

export default function EnhanceResumePage({ resumes, onUpdateResume, onUpload, onOpenBuilder }) {
  const active = resumes.find((r) => r.isActive) || resumes[0];
  const [selectedId, setSelectedId] = useState(active ? active.id : '');
  const [roleId, setRoleId] = useState(() => profileForResume(active).id);
  const [activeCat, setActiveCat] = useState(null);
  const [addInput, setAddInput] = useState('');
  const fileRef = useRef(null);

  const selected = resumes.find((r) => r.id === selectedId) || resumes[0];
  const profile = ROLE_PROFILES.find((p) => p.id === roleId) || ROLE_PROFILES[0];

  const scan = useMemo(() => scanRole(profile.keywords, selected || {}), [profile, selected]);
  const matchedSet = useMemo(() => new Set(scan.matched.map((m) => m.toLowerCase())), [scan]);

  // ---- mutations (single source of truth lives in DashboardPage) ----
  const patch = (updater) => onUpdateResume(selected.id, updater);
  const addSkill = (raw) => {
    const s = (raw || '').trim();
    if (!s) return;
    patch((r) => (r.skills || []).some((x) => x.toLowerCase() === s.toLowerCase())
      ? r
      : { ...r, skills: [...(r.skills || []), s], score: Math.min(99, (r.score || 80) + 1) });
  };
  const removeSkill = (skill) => patch((r) => ({ ...r, skills: (r.skills || []).filter((x) => x !== skill) }));
  const setSummary = (text) => patch((r) => ({ ...r, summary: text }));
  const setBullet = (ri, bi, text) => patch((r) => ({
    ...r,
    experience: (r.experience || []).map((e, i) => i !== ri ? e : { ...e, bullets: (e.bullets || []).map((b, j) => j === bi ? text : b) }),
  }));
  const addBullet = (ri) => patch((r) => ({
    ...r,
    experience: (r.experience || []).map((e, i) => i !== ri ? e : { ...e, bullets: [...(e.bullets || []), ''] }),
  }));

  const openFilePicker = () => fileRef.current && fileRef.current.click();
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resume = resumeFromUpload(file, typeof reader.result === 'string' ? reader.result : '', resumes.length === 0);
      onUpload(resume);
      setSelectedId(resume.id);
      setRoleId(profileForResume(resume).id);
    };
    reader.readAsText(file);
  };

  const hiddenFile = <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.rtf" onChange={handleFile} style={{ display: 'none' }} />;

  if (!selected) {
    return (
      <div className="en-page">
        <header className="en-header"><h1 className="en-title">Enhance Resume</h1></header>
        <section className="card-widget en-empty">
          <div className="en-empty-ic"><Wand2 size={26} /></div>
          <h2 className="en-empty-title">Nothing to enhance yet</h2>
          <p className="en-empty-text">Upload a resume or build one, then come back for targeted improvements.</p>
          <div className="en-empty-actions">
            <button className="en-btn-primary" onClick={openFilePicker}><Upload size={15} /> Upload resume</button>
            <button className="en-btn-ghost" onClick={onOpenBuilder}><FilePlus size={15} /> Build one</button>
          </div>
        </section>
        {hiddenFile}
      </div>
    );
  }

  // ---- derived status per category ----
  const skills = selected.skills || [];
  const bullets = (selected.experience || []).flatMap((e) => e.bullets || []);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const hasSummary = (selected.summary || '').length >= 80;

  const status = {
    keywords: { ok: scan.missing.length === 0, badge: scan.missing.length ? `${scan.missing.length} missing` : 'Covered' },
    skills: { ok: skills.length >= 8, badge: `${skills.length} listed` },
    summary: { ok: hasSummary, badge: hasSummary ? 'Strong' : 'Needs work' },
    impact: { ok: bullets.length ? quantified / bullets.length >= 0.5 : false, badge: bullets.length ? `${quantified}/${bullets.length} quantified` : 'No bullets' },
  };
  const cats = CATS.map((c) => ({ ...c, ...status[c.key] }));
  const fixes = cats.filter((c) => !c.ok);
  const good = cats.filter((c) => c.ok);
  const activeKey = (activeCat && cats.some((c) => c.key === activeCat)) ? activeCat : (fixes[0] ? fixes[0].key : cats[0].key);
  const activeCatObj = cats.find((c) => c.key === activeKey);

  return (
    <div className="en-page">
      {hiddenFile}
      <div className="en-3">
        {/* ── Left: score + resume picker + issue nav ── */}
        <aside className="en-nav card-widget">
          <div className="en-picker">
            <div className="en-picker-row">
              <label className="en-mini-label" htmlFor="en-resume">Resume</label>
              <button type="button" className="en-upload-link" onClick={openFilePicker}><Upload size={12} /> Upload</button>
            </div>
            <select id="en-resume" className="en-select" value={selected.id} onChange={(e) => { setSelectedId(e.target.value); setActiveCat(null); }}>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.role}{r.isActive ? ' (Active)' : ''}</option>)}
            </select>
            <label className="en-mini-label" htmlFor="en-role" style={{ marginTop: 10 }}>Target role</label>
            <select id="en-role" className="en-select" value={roleId} onChange={(e) => { setRoleId(e.target.value); setActiveCat(null); }}>
              {ROLE_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          <div className="en-score">
            <Ring value={scan.score} />
            <div className="en-score-meta">
              <span className="en-score-title">{scan.matched.length}/{scan.detected.length} keywords</span>
              <span className="en-score-sub">vs {profile.label}</span>
            </div>
          </div>

          {fixes.length > 0 && (
            <div className="en-nav-group">
              <p className="en-nav-group-title warn">To improve · {fixes.length}</p>
              {fixes.map((c) => <NavItem key={c.key} cat={c} active={c.key === activeKey} onClick={() => setActiveCat(c.key)} />)}
            </div>
          )}
          {good.length > 0 && (
            <div className="en-nav-group">
              <p className="en-nav-group-title ok">Looking good · {good.length}</p>
              {good.map((c) => <NavItem key={c.key} cat={c} active={c.key === activeKey} onClick={() => setActiveCat(c.key)} />)}
            </div>
          )}
        </aside>

        {/* ── Middle: functional editor for the selected issue ── */}
        <main className="en-editor card-widget">
          <div className="en-editor-head">
            <div className="en-editor-ic"><activeCatObj.icon size={18} /></div>
            <div className="en-editor-headtext">
              <h2 className="en-editor-title">{EDITOR_COPY[activeKey].title}</h2>
              <p className="en-editor-desc">{EDITOR_COPY[activeKey].desc}</p>
            </div>
            <span className={`en-editor-badge ${activeCatObj.ok ? 'ok' : 'warn'}`}>
              {activeCatObj.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{activeCatObj.badge}
            </span>
          </div>

          <div className="en-editor-body">
            {activeKey === 'keywords' && (
              <>
                {scan.missing.length > 0 ? (
                  <>
                    <div className="en-callout">
                      <Sparkles size={15} />
                      <span>Adding the {scan.missing.length} keyword{scan.missing.length === 1 ? '' : 's'} below takes you from <strong>{scan.score}%</strong> to <strong>100%</strong> match.</span>
                    </div>
                    <div className="en-row-between">
                      <span className="en-subhead">Missing for {profile.label}</span>
                      <button className="en-btn-mini" onClick={() => scan.missing.forEach(addSkill)}><Sparkles size={13} /> Add all</button>
                    </div>
                    <div className="en-chips">
                      {scan.missing.map((kw) => (
                        <button key={kw} className="en-chip-add" onClick={() => addSkill(kw)}><Plus size={13} strokeWidth={3} /> {kw}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="en-ok-note"><CheckCircle2 size={16} /> Every {profile.label} keyword is covered. 🎉</div>
                )}
                <span className="en-subhead">In your resume ({scan.matched.length})</span>
                <div className="en-chips">
                  {scan.matched.map((kw) => <span key={kw} className="en-chip-have">{kw}</span>)}
                </div>
              </>
            )}

            {activeKey === 'skills' && (
              <>
                <span className="en-subhead">Your skills ({skills.length}) — tap × to remove</span>
                <div className="en-chips">
                  {skills.map((s) => (
                    <span key={s} className={`en-chip-edit${matchedSet.has(s.toLowerCase()) ? ' hit' : ''}`}>
                      {s}<button className="en-chip-x" aria-label={`Remove ${s}`} onClick={() => removeSkill(s)}><X size={12} strokeWidth={3} /></button>
                    </span>
                  ))}
                </div>
                <AddInline value={addInput} onChange={setAddInput} onAdd={(v) => { addSkill(v); setAddInput(''); }} placeholder="Add a skill (e.g. Terraform)" />
                {scan.missing.length > 0 && (
                  <>
                    <span className="en-subhead">Suggested for {profile.label}</span>
                    <div className="en-chips">
                      {scan.missing.map((kw) => <button key={kw} className="en-chip-add" onClick={() => addSkill(kw)}><Plus size={13} strokeWidth={3} /> {kw}</button>)}
                    </div>
                  </>
                )}
              </>
            )}

            {activeKey === 'summary' && (
              <>
                <textarea
                  className="en-textarea"
                  placeholder="Write a 1–2 line professional summary that frames your target role and strongest results."
                  value={selected.summary || ''}
                  onChange={(e) => setSummary(e.target.value)}
                />
                <div className="en-row-between">
                  <span className={`en-count${(selected.summary || '').length >= 80 ? ' ok' : ''}`}>{(selected.summary || '').length} chars{(selected.summary || '').length < 80 ? ' · aim for 80+' : ' ✓'}</span>
                  {(selected.summary || '').length === 0 && (
                    <button className="en-btn-mini" onClick={() => setSummary(SUMMARY_TEMPLATE)}><Lightbulb size={13} /> Insert template</button>
                  )}
                </div>
              </>
            )}

            {activeKey === 'impact' && (
              (selected.experience || []).length === 0 ? (
                <div className="en-ok-note warn"><AlertCircle size={16} /> No experience yet — add roles in the builder.</div>
              ) : (
                (selected.experience || []).map((exp, ri) => (
                  <div key={ri} className="en-exp">
                    <p className="en-exp-h">{exp.role} · <span>{exp.company}</span></p>
                    {(exp.bullets || []).map((b, bi) => {
                      const hasNum = /\d/.test(b);
                      return (
                        <div key={bi} className={`en-bullet${hasNum ? ' ok' : ''}`}>
                          <span className="en-bullet-dot" title={hasNum ? 'Has a metric' : 'Add a number'} />
                          <input className="en-bullet-input" value={b} onChange={(e) => setBullet(ri, bi, e.target.value)} placeholder="Describe an achievement with a number…" />
                        </div>
                      );
                    })}
                    <button className="en-btn-mini ghost" onClick={() => addBullet(ri)}><Plus size={13} /> Add bullet</button>
                  </div>
                ))
              )
            )}

            <div className="en-tip">
              <Lightbulb size={15} className="en-tip-ic" />
              <span>{EDITOR_TIP[activeKey]}</span>
            </div>
          </div>
        </main>

        {/* ── Right: live resume ── */}
        <aside className="en-resume">
          <section className="card-widget en-preview-card">
            <div className="en-preview-scroll">
              <ResumeDocument resume={selected} matchedSet={matchedSet} highlight={activeCatObj.section} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

const EDITOR_COPY = {
  keywords: { title: 'Keyword match', desc: 'Add the keywords this role expects that you genuinely have.' },
  skills: { title: 'Skills', desc: 'Curate a focused, role-relevant skills list.' },
  summary: { title: 'Professional summary', desc: 'A sharp 1–2 line intro lifts every recruiter scan.' },
  impact: { title: 'Quantified impact', desc: 'Turn duties into results — add numbers to your bullets.' },
};

const EDITOR_TIP = {
  keywords: 'ATS software ranks resumes largely on keyword overlap with the job description. Add the terms you genuinely have — phrased the way a posting would — and never keyword-stuff.',
  skills: 'Recruiters scan the skills section first. Keep it tight and role-relevant; 8–14 focused skills read better than a long, generic list.',
  summary: 'A crisp two-line summary at the very top frames everything that follows. Lead with your role, years of experience, and one standout result.',
  impact: 'Numbers make achievements believable — “cut API latency 40%” lands far harder than “improved performance.” Aim for a metric in most bullets.',
};

function NavItem({ cat, active, onClick }) {
  const Icon = cat.icon;
  return (
    <button className={`en-nav-item${active ? ' active' : ''} ${cat.ok ? 'ok' : 'warn'}`} onClick={onClick}>
      <span className="en-nav-ic"><Icon size={15} /></span>
      <span className="en-nav-label">{cat.label}</span>
      <span className="en-nav-badge">{cat.badge}</span>
      {cat.ok ? <CheckCircle2 size={15} className="en-nav-stat ok" /> : <ChevronRight size={15} className="en-nav-stat" />}
    </button>
  );
}

function AddInline({ value, onChange, onAdd, placeholder }) {
  return (
    <form className="en-add" onSubmit={(e) => { e.preventDefault(); onAdd(value); }}>
      <input className="en-add-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="submit" className="en-btn-mini" disabled={!value.trim()}><Plus size={14} /> Add</button>
    </form>
  );
}
