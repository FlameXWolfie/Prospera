import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ScanLine, Check, X, ArrowRight, ArrowLeft, FileText, Upload, FilePlus,
  CheckCircle2, AlertCircle, ChevronRight, Lightbulb, Mail, MapPin, Globe,
  RefreshCw, Download, Sparkles,
} from 'lucide-react';
import { scanResume, scanRole, extractSkills, ROLE_PROFILES, profileForResume } from '../lib/atsKeywords';
import { scoreColor } from '../lib/scoreColor';
import './css/AtsScanPage.css';

// Candidate identity for the preview — these are the signed-in user's resumes.
const CANDIDATE = { name: 'Alex Johnson', email: 'alex.johnson@mail.com', location: 'San Francisco, CA', linkedin: 'linkedin.com/in/alexjohnson' };

const ANALYZE_COUNT = 5;

/* ── helpers ──────────────────────────────────────────────────────────────── */

function roleFromFilename(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const cleaned = base.replace(/\b(resume|cv|final|v?\d+|copy)\b/gi, '').replace(/\s+/g, ' ').trim();
  const label = cleaned || base || 'Uploaded resume';
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

function resumeFromUpload(file, text, isFirst) {
  const skills = extractSkills(text);
  const summary = text.replace(/\s+/g, ' ').trim().slice(0, 280);
  return {
    id: String(Date.now()),
    role: roleFromFilename(file.name),
    target: '',
    score: Math.min(95, 55 + skills.length * 4),
    status: 'Draft - Pending Review',
    lastAppended: new Date().toISOString(),
    summary,
    experience: [],
    skills,
    isActive: isFirst,
    uploaded: true,
  };
}

function subScores(resume, result) {
  const skills = resume.skills || [];
  const exp = resume.experience || [];
  const bullets = exp.flatMap((e) => e.bullets || []);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  return {
    keywords: result.score,
    skills: Math.min(100, Math.round((skills.length / 10) * 100)),
    experience: Math.min(100, Math.round((Math.min(exp.length, 2) / 2 * 0.5 + Math.min(bullets.length, 6) / 6 * 0.5) * 100)),
    impact: bullets.length ? Math.round((quantified / bullets.length) * 100) : 0,
  };
}

// The issue list: each check maps to a resume section it highlights.
function buildChecks(resume, result, subs) {
  const skills = resume.skills || [];
  const exp = resume.experience || [];
  const bullets = exp.flatMap((e) => e.bullets || []);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const hasSummary = (resume.summary || '').length >= 80;
  return [
    {
      key: 'keywords', label: 'Keyword match', score: subs.keywords, ok: subs.keywords >= 70, section: 'skills',
      lines: [`${result.matched.length} of ${result.detected.length} target keywords appear in your resume.`],
      chips: { matched: result.matched, missing: result.missing },
      suggest: result.missing.length ? 'Weave the missing keywords you genuinely have into your skills or bullets.' : 'Great coverage — every target keyword is present.',
    },
    {
      key: 'skills', label: 'Skills depth', score: subs.skills, ok: subs.skills >= 70, section: 'skills',
      lines: [`${skills.length} skill${skills.length === 1 ? '' : 's'} listed in your resume.`],
      chips: null,
      suggest: skills.length < 6 ? 'Aim for at least 6 relevant, role-specific skills.' : null,
    },
    {
      key: 'experience', label: 'Experience', score: subs.experience, ok: subs.experience >= 70, section: 'experience',
      lines: [`${exp.length} role${exp.length === 1 ? '' : 's'} with ${bullets.length} bullet${bullets.length === 1 ? '' : 's'} total.`],
      chips: null,
      suggest: subs.experience < 70 ? 'Add more outcome-focused bullet points to each role.' : null,
    },
    {
      key: 'impact', label: 'Quantified impact', score: subs.impact, ok: subs.impact >= 40, section: 'experience',
      lines: [`${quantified} of ${bullets.length || 0} bullet${bullets.length === 1 ? '' : 's'} include numbers or metrics.`],
      chips: null,
      suggest: subs.impact < 40 ? 'Quantify achievements with numbers (%, $, time saved).' : null,
    },
    {
      key: 'summary', label: 'Professional summary', score: hasSummary ? 100 : 30, ok: hasSummary, section: 'summary',
      lines: [hasSummary ? 'A clear professional summary is present.' : 'No professional summary detected.'],
      chips: null,
      suggest: hasSummary ? null : 'Add a 1–2 line summary framing your target role.',
    },
  ];
}

function heroMessage(score) {
  if (score >= 85) return { title: 'Excellent match! 🎯', text: 'Your resume aligns strongly with this target. A few tweaks and you’re set.' };
  if (score >= 70) return { title: 'You’re on the right track! 🎉', text: 'Your resume matches well. Close a few gaps to boost your shortlist odds.' };
  if (score >= 50) return { title: 'A solid start 💪', text: 'You match on the basics — there’s clear room to strengthen alignment.' };
  return { title: 'Needs some work', text: 'There are meaningful gaps to close before this resume is ATS-ready.' };
}

function scoreLabel(score) {
  if (score >= 85) return 'Strong match';
  if (score >= 70) return 'Good match';
  if (score >= 50) return 'Fair match';
  return 'Low match';
}

/* ── presentational pieces ────────────────────────────────────────────────── */

function MatchRing({ value, size = 132, sublabel = 'MATCH' }) {
  const stroke = Math.round(size * 0.085);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(value);
  return (
    <div className="ats-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ats-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border-dark)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="ats-ring-text">
        <span className="ats-ring-num" style={{ color, fontSize: Math.round(size * 0.26) }}>{value}%</span>
        <span className="ats-ring-label">{sublabel}</span>
      </div>
    </div>
  );
}

function KeywordChips({ terms, variant }) {
  const Icon = variant === 'matched' ? Check : X;
  return (
    <div className="ats-chip-wrap">
      {terms.map((t) => (
        <span key={t} className={`ats-keyword ats-keyword-${variant}`}>
          <Icon size={12} strokeWidth={3} />{t}
        </span>
      ))}
    </div>
  );
}

function CheckDetail({ check }) {
  return (
    <div className="ats-detail">
      {check.lines.map((l, i) => <p key={i} className="ats-detail-line">{l}</p>)}
      {check.chips && (
        <div className="ats-detail-chips">
          {check.chips.matched.length > 0 && <KeywordChips terms={check.chips.matched} variant="matched" />}
          {check.chips.missing.length > 0 && <KeywordChips terms={check.chips.missing} variant="missing" />}
        </div>
      )}
      {check.suggest && <p className="ats-detail-suggest"><Lightbulb size={13} /> {check.suggest}</p>}
    </div>
  );
}

function CheckRow({ check, active, onSelect }) {
  return (
    <div className={`ats-checkrow${active ? ' active' : ''} ${check.ok ? 'ok' : 'warn'}`}>
      <button className="ats-checkrow-head" onClick={() => onSelect(check.key)} aria-expanded={active}>
        <span className="ats-checkrow-ic">{check.ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}</span>
        <span className="ats-checkrow-label">{check.label}</span>
        <span className="ats-checkrow-score">{check.score}%</span>
        <ChevronRight size={16} className="ats-checkrow-chev" />
      </button>
      {active && <CheckDetail check={check} />}
    </div>
  );
}

function ResumePreview({ resume, matchedSet, highlight }) {
  const exp = (resume.experience || []).slice(0, 3);
  const skills = resume.skills || [];
  const hl = (s) => `ats-doc-sec${highlight === s ? ' hl' : ''}`;
  return (
    <div className="ats-doc" role="img" aria-label={`Preview of ${resume.role} resume`}>
      <div className="ats-doc-head">
        <h3 className="ats-doc-name">{CANDIDATE.name}</h3>
        <p className="ats-doc-role">{resume.role}{resume.target ? ` · ${resume.target}` : ''}</p>
        <div className="ats-doc-contact">
          <span><Mail size={11} /> {CANDIDATE.email}</span>
          <span><MapPin size={11} /> {CANDIDATE.location}</span>
          <span><Globe size={11} /> {CANDIDATE.linkedin}</span>
        </div>
      </div>
      {resume.summary && (
        <section className={hl('summary')}>
          <h4 className="ats-doc-h">Summary</h4>
          <p className="ats-doc-text">{resume.summary}</p>
        </section>
      )}
      {exp.length > 0 && (
        <section className={hl('experience')}>
          <h4 className="ats-doc-h">Experience</h4>
          {exp.map((e, i) => (
            <div key={i} className="ats-doc-exp">
              <div className="ats-doc-exp-row">
                <span className="ats-doc-exp-role">{e.role}</span>
                <span className="ats-doc-exp-period">{e.period}</span>
              </div>
              <div className="ats-doc-exp-co">{e.company}</div>
              <ul className="ats-doc-bullets">
                {(e.bullets || []).slice(0, 3).map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {skills.length > 0 && (
        <section className={hl('skills')}>
          <h4 className="ats-doc-h">Skills</h4>
          <div className="ats-doc-skills">
            {skills.map((s) => (
              <span key={s} className={`ats-doc-skill${matchedSet.has(s.toLowerCase()) ? ' hit' : ''}`}>{s}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────────────────────── */

export default function AtsScanPage({ resumes, onNewResumeClick, onUpload, onEnhance }) {
  const active = resumes.find((r) => r.isActive) || resumes[0];
  const [phase, setPhase] = useState('setup');          // setup · analyzing · results
  const [step, setStep] = useState(1);                  // wizard step 1·2
  const [selectedId, setSelectedId] = useState(active ? active.id : '');
  const [roleId, setRoleId] = useState(() => profileForResume(active).id);
  const [targetMode, setTargetMode] = useState('role'); // role · jd
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [activeCheck, setActiveCheck] = useState(null);
  const [uploadNote, setUploadNote] = useState(null);
  const [scanError, setScanError] = useState('');
  const fileInputRef = useRef(null);

  const selected = resumes.find((r) => r.id === selectedId) || resumes[0];
  const profile = ROLE_PROFILES.find((p) => p.id === roleId) || ROLE_PROFILES[0];

  const wordCount = useMemo(
    () => (jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0),
    [jobDescription]
  );
  const matchedSet = useMemo(
    () => new Set((result ? result.matched : []).map((m) => m.toLowerCase())),
    [result]
  );
  const analyzeLabels = useMemo(() => [
    'Parsing your resume',
    'Extracting keywords',
    `Matching against ${result ? result.targetLabel : 'your target'}`,
    'Scoring each section',
    'Compiling your report',
  ], [result]);

  useEffect(() => {
    if (phase !== 'analyzing') return undefined;
    const tick = setInterval(() => setAnalyzeStep((s) => Math.min(s + 1, ANALYZE_COUNT - 1)), 380);
    const done = setTimeout(() => setPhase('results'), 380 * ANALYZE_COUNT + 320);
    return () => { clearInterval(tick); clearTimeout(done); };
  }, [phase]);

  const openFilePicker = () => fileInputRef.current && fileInputRef.current.click();

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const resume = resumeFromUpload(file, text, resumes.length === 0);
      onUpload(resume);
      setSelectedId(resume.id);
      setRoleId(profileForResume(resume).id);
      setUploadNote(
        resume.skills.length
          ? `Added “${resume.role}” — pulled ${resume.skills.length} skill${resume.skills.length === 1 ? '' : 's'} from your file.`
          : `Added “${resume.role}”. We couldn’t auto-detect skills — edit it in the builder.`
      );
    };
    reader.readAsText(file);
  };

  const runScan = () => {
    if (!selected) return;
    let res;
    if (targetMode === 'jd') {
      if (!jobDescription.trim()) return;
      res = scanResume(jobDescription, selected);
      if (res.score === null) {
        setScanError('No recognizable skills found in that posting. Paste the full requirements, or scan against a role instead.');
        return;
      }
      res = { ...res, mode: 'jd', against: 'this job posting', targetLabel: 'the job posting' };
    } else {
      res = { ...scanRole(profile.keywords, selected), mode: 'role', against: `the ${profile.label} role`, targetLabel: `the ${profile.label} role` };
    }
    setScanError('');
    setResult(res);
    setAnalyzeStep(0);
    setActiveCheck(null);
    setPhase('analyzing');
  };

  const scanAgain = () => { setPhase('setup'); setStep(2); };

  const hiddenFileInput = (
    <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.rtf" onChange={handleFile} style={{ display: 'none' }} />
  );

  /* ---- no resumes ---- */
  if (resumes.length === 0) {
    return (
      <div className="ats-page">
        <header className="ats-header">
          <h1 className="ats-title">ATS Scan</h1>
          <p className="ats-subtitle">See how a resume stacks up against a job — keyword by keyword.</p>
        </header>
        <section className="card-widget ats-no-resume">
          <div className="ats-empty-icon"><Upload size={26} /></div>
          <h2 className="ats-no-resume-title">Add a resume to get started</h2>
          <p className="ats-no-resume-text">
            Upload an existing resume and we&apos;ll pull the skills out of it automatically, or build a new one
            from scratch.
          </p>
          <div className="ats-no-resume-actions">
            <button className="ats-scan-btn" onClick={openFilePicker}><Upload size={16} /> Upload resume</button>
            <button className="ats-clear-btn" onClick={onNewResumeClick}><FilePlus size={15} /> Build one instead</button>
          </div>
          <p className="ats-no-resume-hint">Supports .txt, .pdf, .doc — read on your device, nothing is uploaded.</p>
        </section>
        {hiddenFileInput}
      </div>
    );
  }

  /* ---- ANALYZING ---- */
  if (phase === 'analyzing') {
    return (
      <div className="ats-page">
        <div className="ats-analyzing">
          <div className="ats-scan-orb"><ScanLine size={34} /></div>
          <h2 className="ats-analyzing-title">Analyzing your resume…</h2>
          <p className="ats-analyzing-sub">Matching <strong>{selected.role}</strong> against {result ? result.targetLabel : 'your target'}</p>
          <div className="ats-progress">
            <div className="ats-progress-fill" style={{ width: `${((analyzeStep + 1) / ANALYZE_COUNT) * 100}%` }} />
          </div>
          <ul className="ats-analyze-steps">
            {analyzeLabels.map((l, i) => (
              <li key={l} className={`ats-analyze-step${i < analyzeStep ? ' done' : i === analyzeStep ? ' active' : ''}`}>
                {i < analyzeStep ? <Check size={15} /> : i === analyzeStep ? <span className="ats-spin" /> : <span className="ats-pip" />}
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* ---- RESULTS (2-pane issue navigator) ---- */
  if (phase === 'results' && result) {
    const subs = subScores(selected, result);
    const msg = heroMessage(result.score);
    const checks = buildChecks(selected, result, subs);
    const needsWork = checks.filter((c) => !c.ok);
    const lookingGood = checks.filter((c) => c.ok);
    const activeKey = (activeCheck && checks.some((c) => c.key === activeCheck))
      ? activeCheck
      : (needsWork[0] ? needsWork[0].key : checks[0].key);
    const activeCheckObj = checks.find((c) => c.key === activeKey);

    return (
      <div className="ats-page ats-results">
        {hiddenFileInput}
        <div className="ats-results-layout">
          {/* Left: everything else — header, files, score, issue navigator, CTA */}
          <div className="ats-results-main">
            <section className="card-widget ats-scorecard">
              <div className="ats-nav-score">
                <MatchRing value={result.score} size={140} sublabel={scoreLabel(result.score).toUpperCase()} />
                <div className="ats-nav-score-meta">
                  <h2 className="ats-hero-title">{msg.title}</h2>
                  <p className="ats-hero-text">{msg.text}</p>
                </div>
              </div>
              <div className="ats-scorecard-foot">
                <span className="ats-scorecard-ctx">{selected.role} · vs {result.mode === 'jd' ? 'job posting' : `${profile.label} role`}</span>
                <div className="ats-scorecard-actions">
                  <button className="ats-ghost-btn" onClick={scanAgain}><RefreshCw size={15} /> Scan again</button>
                  <button className="ats-primary-btn" onClick={() => alert('PDF report export is coming soon.')}><Download size={15} /> Download report</button>
                </div>
              </div>
            </section>

            <section className="card-widget ats-nav">
              {needsWork.length > 0 && (
                <div className="ats-nav-group">
                  <p className="ats-nav-group-title warn">Needs work · {needsWork.length}</p>
                  {needsWork.map((c) => <CheckRow key={c.key} check={c} active={c.key === activeKey} onSelect={setActiveCheck} />)}
                </div>
              )}
              {lookingGood.length > 0 && (
                <div className="ats-nav-group">
                  <p className="ats-nav-group-title ok">Looking good · {lookingGood.length}</p>
                  {lookingGood.map((c) => <CheckRow key={c.key} check={c} active={c.key === activeKey} onSelect={setActiveCheck} />)}
                </div>
              )}
            </section>

            <div className="ats-improve">
              <div className="ats-improve-ic"><Sparkles size={20} /></div>
              <div className="ats-improve-body">
                <p className="ats-improve-t">Want to improve your score?</p>
                <p className="ats-improve-d">Get guided suggestions to weave in missing keywords and sharpen your bullets.</p>
              </div>
              <button className="ats-primary-btn" onClick={onEnhance || onNewResumeClick}><Sparkles size={15} /> Enhance my resume</button>
            </div>
          </div>

          {/* Right: resume preview owns the full height of this side */}
          <aside className="ats-results-resume">
            <section className="card-widget ats-preview-card">
              <div className="ats-preview-scroll">
                <ResumePreview resume={selected} matchedSet={matchedSet} highlight={activeCheckObj.section} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  /* ---- SETUP WIZARD ---- */
  return (
    <div className="ats-page">
      {hiddenFileInput}
      <header className="ats-header">
        <h1 className="ats-title">ATS Scan</h1>
        <p className="ats-subtitle">Two quick steps and we’ll show you exactly how your resume matches.</p>
      </header>

      <div className="ats-wizard">
        <div className="ats-stepper">
          <div className={`ats-stepper-item${step >= 1 ? ' on' : ''}`}><span className="ats-stepper-dot">1</span> Resume</div>
          <div className="ats-stepper-line" />
          <div className={`ats-stepper-item${step >= 2 ? ' on' : ''}`}><span className="ats-stepper-dot">2</span> Target</div>
        </div>

        {step === 1 && (
          <section className="card-widget ats-step">
            <h2 className="ats-step-title">Choose your resume</h2>
            <p className="ats-step-sub">Pick which resume to scan, or upload a new one.</p>
            <div className="ats-choice-list">
              {resumes.map((r) => (
                <button key={r.id} className={`ats-choice${selectedId === r.id ? ' sel' : ''}`} onClick={() => setSelectedId(r.id)}>
                  <div className="ats-choice-ic"><FileText size={18} /></div>
                  <div className="ats-choice-main">
                    <span className="ats-choice-title">{r.role}{r.isActive ? ' · Active' : ''}</span>
                    <span className="ats-choice-meta">ATS score {r.score} · {(r.skills || []).length} skills</span>
                  </div>
                  {selectedId === r.id ? <CheckCircle2 size={20} className="ats-choice-check" /> : <span className="ats-radio" />}
                </button>
              ))}
              <button className="ats-choice ats-choice-upload" onClick={openFilePicker}>
                <div className="ats-choice-ic"><Upload size={18} /></div>
                <div className="ats-choice-main"><span className="ats-choice-title">Upload a resume</span><span className="ats-choice-meta">.txt, .pdf, .doc — read on your device</span></div>
                <ArrowRight size={18} className="ats-choice-arrow" />
              </button>
            </div>
            {uploadNote && <div className="ats-upload-note">{uploadNote}</div>}
            <div className="ats-wizard-actions end">
              <button className="ats-scan-btn" onClick={() => setStep(2)} disabled={!selected}>Continue <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="card-widget ats-step">
            <h2 className="ats-step-title">What are you targeting?</h2>
            <p className="ats-step-sub">Scan against a role’s common keywords, or paste a specific job posting.</p>

            <div className="ats-segment">
              <button className={targetMode === 'role' ? 'active' : ''} onClick={() => { setTargetMode('role'); setScanError(''); }}>Target role</button>
              <button className={targetMode === 'jd' ? 'active' : ''} onClick={() => { setTargetMode('jd'); setScanError(''); }}>Specific posting</button>
            </div>

            {targetMode === 'role' ? (
              <div className="ats-role-grid">
                {ROLE_PROFILES.map((p) => (
                  <button key={p.id} className={`ats-role-card${roleId === p.id ? ' sel' : ''}`} onClick={() => setRoleId(p.id)}>
                    <span className="ats-role-name">{p.label}</span>
                    <span className="ats-role-kw">{p.keywords.slice(0, 3).join(' · ')}…</span>
                    {roleId === p.id && <Check size={15} className="ats-role-check" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="ats-jd-zone">
                <textarea
                  className="ats-textarea"
                  placeholder="Paste the full job posting here — responsibilities, requirements, qualifications…"
                  value={jobDescription}
                  onChange={(e) => { setJobDescription(e.target.value); setScanError(''); }}
                />
                <div className="ats-jd-meta">{wordCount} {wordCount === 1 ? 'word' : 'words'}</div>
              </div>
            )}
            {scanError && <p className="ats-error"><AlertCircle size={14} /> {scanError}</p>}

            <div className="ats-wizard-actions">
              <button className="ats-clear-btn" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button>
              <button className="ats-scan-btn" onClick={runScan} disabled={targetMode === 'jd' && !jobDescription.trim()}>
                <ScanLine size={16} /> Run ATS Scan
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
