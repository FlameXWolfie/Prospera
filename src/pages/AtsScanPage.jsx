import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ScanLine, Check, X, ArrowRight, ArrowLeft, FileText, Upload, FilePlus,
  CheckCircle2, AlertCircle, ChevronRight, Lightbulb, RefreshCw, Download, Sparkles,
} from 'lucide-react';
import { scanResume, scanRoleProfile, ROLE_PROFILES, profileForResume } from '../lib/resume/atsKeywords';
import { resumeFromParsed } from '../lib/resume/resumeUpload';
import { importResumeFields, readSourceFile } from '../lib/resume/resumeFile';
import { cachePdfDataUri } from '../lib/resume/pdfCache';
import { scoreColor } from '../lib/resume/scoreColor';
import { aiAtsScan, aiStatus } from '../lib/ai';
import ResumePreview from '../components/dashboard/ResumePreview';
import FirstRun, { AtsVisual } from '../components/dashboard/FirstRun';
import './css/AtsScanPage.css';

const ANALYZE_COUNT = 5;

/* ── helpers ──────────────────────────────────────────────────────────────── */

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

// When Mistral returns a full analysis, build the report rows from IT — it judges
// stack equivalence (Go/Node/Java all count for backend) instead of a fixed list.
// Maps each AI section to the same shape buildChecks produces; the Keyword row
// carries AI's matched/missing chips.
function aiChecks(ai) {
  const matched = Array.isArray(ai.matchedKeywords) ? ai.matchedKeywords : [];
  const missing = Array.isArray(ai.missingKeywords) ? ai.missingKeywords : [];
  return (ai.sections || [])
    .filter((s) => s && s.label)
    .map((s) => {
      const score = typeof s.score === 'number' ? Math.max(0, Math.min(100, Math.round(s.score))) : 0;
      const key = String(s.label).toLowerCase();
      const isKw = key.includes('keyword');
      return {
        key,
        label: s.label,
        score,
        ok: typeof s.ok === 'boolean' ? s.ok : score >= 70,
        lines: isKw ? [`${matched.length} matched · ${missing.length} missing for this target.`] : [],
        chips: isKw ? { matched, missing } : null,
        suggest: s.advice || null,
      };
    });
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

/* ── main ─────────────────────────────────────────────────────────────────── */

export default function AtsScanPage({ resumes, onNewResumeClick, onUpload, onEnhance, onScanned }) {
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
  const [uploading, setUploading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    aiStatus().then((d) => { if (active) setAiEnabled(Boolean(d && d.enabled)); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const selected = resumes.find((r) => r.id === selectedId) || resumes[0];
  const profile = ROLE_PROFILES.find((p) => p.id === roleId) || ROLE_PROFILES[0];

  const wordCount = useMemo(
    () => (jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0),
    [jobDescription]
  );
  const matchedSet = useMemo(() => {
    const ai = result && result.ai;
    const terms = ai && Array.isArray(ai.matchedKeywords) && ai.matchedKeywords.length
      ? ai.matchedKeywords
      : (result ? result.matched : []);
    return new Set(terms.map((m) => String(m).toLowerCase()));
  }, [result]);
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

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadNote(aiEnabled ? 'Reading your resume with AI…' : 'Reading your resume…');
    try {
      const parsed = await importResumeFields(file, { aiEnabled });
      const source = await readSourceFile(file);
      const resume = resumeFromParsed(file, parsed, resumes.length === 0, source);
      // Await the save so we select by the real server id (and key the cached PDF
      // to it) — otherwise the temp client id never matches the reconciled list.
      const saved = await onUpload(resume);
      if (!saved) { setUploadNote('Could not save that resume — please try again.'); return; }
      if (source.fileData) cachePdfDataUri(saved.id, `data:${source.fileType};base64,${source.fileData}`);
      setSelectedId(saved.id);
      setRoleId(profileForResume(saved).id);
      setUploadNote(
        saved.skills.length
          ? `Added “${saved.role}” — pulled ${saved.skills.length} skill${saved.skills.length === 1 ? '' : 's'} from your file.`
          : `Added “${saved.role}”. Add the details in the builder.`,
      );
      // An uploaded resume is obviously the one to scan — skip re-picking and jump
      // straight to choosing a target.
      setStep(2);
    } catch {
      setUploadNote('Could not read that file. Try another PDF, or build one from scratch.');
    } finally {
      setUploading(false);
    }
  };

  const runScan = async () => {
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
      res = { ...scanRoleProfile(profile, selected), mode: 'role', against: `the ${profile.label} role`, targetLabel: `the ${profile.label} role` };
    }
    setScanError('');
    setResult(res);
    setAnalyzeStep(0);
    setActiveCheck(null);
    setPhase('analyzing');

    // Persist the real scan result so this resume's ATS score becomes "real"
    // everywhere it's shown (Library, dashboard). The deterministic score lands
    // immediately; if AI refines it below, we record that final score instead.
    const rid = selected.id;
    const scanTarget = targetMode === 'jd' ? 'a job posting' : profile.label;
    onScanned?.(rid, { score: res.score, scanTarget });

    // Enrich with Mistral when available; the deterministic result stands otherwise.
    if (!aiEnabled) return;
    setAiPending(true);
    try {
      const payload = { resume: selected, role: profile.label };
      if (targetMode === 'jd') payload.jobDescription = jobDescription;
      const { result: ai } = await aiAtsScan(payload);
      if (ai && typeof ai.score === 'number') {
        setResult((cur) => (cur ? { ...cur, ai } : cur));
        onScanned?.(rid, { score: ai.score, scanTarget });
      }
    } catch {
      /* AI failed — keep the deterministic result */
    } finally {
      setAiPending(false);
    }
  };

  const scanAgain = () => { setPhase('setup'); setStep(2); };

  const hiddenFileInput = (
    <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.rtf" onChange={handleFile} style={{ display: 'none' }} />
  );

  /* ---- no resumes ---- */
  if (resumes.length === 0) {
    return (
      <div className="ats-page">
        {hiddenFileInput}
        <FirstRun
          eyebrow={<><ScanLine size={13} /> ATS Scanner</>}
          title="See your resume the way a recruiter's software does"
          subtitle="Scan any resume against a target role or a real job posting and get a keyword-by-keyword match score, with fixes that actually move the needle."
          actions={(
            <>
              <button className="fr-btn fr-btn-primary" onClick={openFilePicker} disabled={uploading}>
                {uploading ? <><span className="ats-spin" /> Reading your resume…</> : <><Upload size={16} /> Upload resume</>}
              </button>
              <button className="fr-btn fr-btn-ghost" onClick={onNewResumeClick} disabled={uploading}><FilePlus size={16} /> Build one instead</button>
            </>
          )}
          hint={uploadNote || 'Supports .txt, .pdf, .doc — read on your device, nothing is uploaded.'}
          steps={[
            { icon: FileText, title: 'Pick a resume', text: 'Upload an existing file or choose one from your library.' },
            { icon: ScanLine, title: 'Set a target', text: 'Match against a role profile or paste a specific job posting.' },
            { icon: CheckCircle2, title: 'Get your report', text: 'A section-by-section score with the exact gaps to close.' },
          ]}
          visual={<AtsVisual />}
        />
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
    const aiData = result.ai;
    const displayScore = aiData && typeof aiData.score === 'number' ? aiData.score : result.score;
    const msg = heroMessage(displayScore);
    // Prefer Mistral's section breakdown (it understands stack equivalence); fall
    // back to the deterministic category checks when AI is off/returned no sections.
    const checks = (aiData && Array.isArray(aiData.sections) && aiData.sections.length)
      ? aiChecks(aiData)
      : buildChecks(selected, result, subs);
    const needsWork = checks.filter((c) => !c.ok);
    const lookingGood = checks.filter((c) => c.ok);
    const activeKey = (activeCheck && checks.some((c) => c.key === activeCheck))
      ? activeCheck
      : (needsWork[0] ? needsWork[0].key : checks[0].key);

    return (
      <div className="ats-page ats-results">
        {hiddenFileInput}
        <div className="ats-results-layout">
          {/* Left: everything else — header, files, score, issue navigator, CTA */}
          <div className="ats-results-main">
            <section className="card-widget ats-scorecard">
              <div className="ats-nav-score">
                <MatchRing value={displayScore} size={140} sublabel={scoreLabel(displayScore).toUpperCase()} />
                <div className="ats-nav-score-meta">
                  <h2 className="ats-hero-title">{aiData?.verdict || msg.title}</h2>
                  <p className="ats-hero-text">{msg.text}</p>
                  {aiData && <span className="ats-ai-badge"><Sparkles size={12} /> AI-powered analysis</span>}
                  {aiEnabled && aiPending && !aiData && <span className="ats-ai-badge pending"><span className="ats-spin" /> Refining with AI…</span>}
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

            {aiData?.suggestions?.length > 0 && (
              <section className="card-widget ats-ai-suggest">
                <p className="ats-ai-suggest-h"><Sparkles size={15} /> AI suggestions</p>
                <ul className="ats-ai-suggest-list">
                  {aiData.suggestions.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </section>
            )}

            <div className="ats-improve">
              <div className="ats-improve-ic"><Sparkles size={20} /></div>
              <div className="ats-improve-body">
                <p className="ats-improve-t">Want to improve your score?</p>
                <p className="ats-improve-d">Get guided suggestions to weave in missing keywords and sharpen your bullets.</p>
              </div>
              <button className="ats-primary-btn" onClick={() => (selected ? onEnhance(selected.id) : onNewResumeClick())}><Sparkles size={15} /> Enhance my resume</button>
            </div>
          </div>

          {/* Right: resume preview owns the full height of this side */}
          <aside className="ats-results-resume">
            <section className="card-widget ats-preview-card">
              <div className="ats-preview-scroll">
                <ResumePreview resume={selected} matchedSet={matchedSet} />
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
                    <span className="ats-choice-meta">
                      {(r.skills || []).length} skill{(r.skills || []).length === 1 ? '' : 's'}
                      {(r.experience || []).length ? ` · ${r.experience.length} role${r.experience.length === 1 ? '' : 's'}` : ''}
                      {r.hasFile ? ' · PDF' : ''}
                    </span>
                  </div>
                  {selectedId === r.id ? <CheckCircle2 size={20} className="ats-choice-check" /> : <span className="ats-radio" />}
                </button>
              ))}
              <button className="ats-choice ats-choice-upload" onClick={openFilePicker} disabled={uploading}>
                <div className="ats-choice-ic">{uploading ? <span className="ats-spin" /> : <Upload size={18} />}</div>
                <div className="ats-choice-main"><span className="ats-choice-title">{uploading ? 'Reading your resume…' : 'Upload a resume'}</span><span className="ats-choice-meta">.txt, .pdf, .doc — read on your device</span></div>
                {!uploading && <ArrowRight size={18} className="ats-choice-arrow" />}
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
                    <span className="ats-role-kw">{p.categories.slice(0, 3).map((c) => c.label).join(' · ')}…</span>
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
