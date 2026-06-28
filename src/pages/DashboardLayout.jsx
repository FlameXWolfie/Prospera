import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PanelLeftOpen, Loader2, AlertCircle, X } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import LibraryPage from './LibraryPage';
import AtsScanPage from './AtsScanPage';
import BuildResumePage from './BuildResumePage';
import ApplicationsPage from './ApplicationsPage';
import DashboardHome from './DashboardHome';
import ComingSoon from './ComingSoon';
import { useAuth } from '../lib/auth/AuthContext';
import { emptyDraft, resumeContentFromDraft, draftFromResume } from '../lib/resume/resumeDraft';
import { ApiError } from '../lib/api';
import { listResumes, createResume, updateResume, activateResume, deleteResume, recordResumeScan } from '../lib/resume/resumesApi';
import { listApplications, createApplication, updateApplication, deleteApplication } from '../lib/applications/applicationsApi';

// Server-managed fields the client must never send back on create/update.
const stripServerFields = (obj) => {
  const clone = { ...obj };
  delete clone.id;
  delete clone.lastAppended;
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
};

// The in-progress builder draft survives reloads (localStorage), so reopening
// /app/build after a refresh keeps your work — not just the route.
const BUILD_DRAFT_KEY = 'prospera_build_draft';
const loadBuildDraft = () => {
  try {
    const s = localStorage.getItem(BUILD_DRAFT_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore corrupt/blocked storage */ }
  return emptyDraft();
};

// App shell for the signed-in experience. Owns the shared resume/application
// state + data loading, renders the sidebar, and routes each section.
export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const go = (tab) => navigate(`/app/${tab}`);
  // Open a specific saved resume in the Studio (load it into the draft, THEN
  // navigate) — so "Enhance my resume" / "Open in builder" carry the selection
  // across instead of dropping you on a blank/other resume.
  const goStudioWith = (id) => {
    const r = resumes.find((x) => x.id === id);
    if (r) setBuildDraft(draftFromResume(r));
    go('studio');
  };
  // Navigate away from /app FIRST, then clear the session — otherwise the
  // RequireAuth guard redirects to /login before our navigate('/') lands.
  const handleLogout = () => { navigate('/'); logout(); };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dataStatus, setDataStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [buildDraft, setBuildDraft] = useState(loadBuildDraft);

  useEffect(() => {
    try { localStorage.setItem(BUILD_DRAFT_KEY, JSON.stringify(buildDraft)); } catch { /* ignore */ }
  }, [buildDraft]);

  // Auto-save edits made to an EXISTING resume opened in the Studio (the draft
  // carries `sourceId`). Debounced via the cleanup; state updates happen only in
  // the async resolve, never synchronously in the effect body (keeps the
  // react-compiler "no setState in effect" rule happy). The editor mutates the
  // draft with functional updates, so rapid edits ("Add all") can't clobber.
  useEffect(() => {
    const id = buildDraft && buildDraft.sourceId;
    if (!id) return undefined;
    const t = setTimeout(() => {
      updateResume(id, stripServerFields(resumeContentFromDraft(buildDraft)))
        .then((res) => { if (res) setResumes((prev) => prev.map((r) => (r.id === id ? res.resume : r))); })
        .catch((err) => setActionError(err instanceof ApiError ? err.message : 'Could not save your changes. Please try again.'));
    }, 500);
    return () => clearTimeout(t);
  }, [buildDraft]);

  const loadData = async () => {
    setDataStatus('loading');
    setLoadError('');
    try {
      const [r, a] = await Promise.all([listResumes(), listApplications()]);
      setResumes(r.resumes);
      setApplications(a.applications);
      setDataStatus('ready');
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load your workspace.');
      setDataStatus('error');
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [r, a] = await Promise.all([listResumes(), listApplications()]);
        if (!active) return;
        setResumes(r.resumes);
        setApplications(a.applications);
        setDataStatus('ready');
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your workspace.');
        setDataStatus('error');
      }
    })();
    return () => { active = false; };
  }, []);

  const runMutation = async (apiCall, { optimistic, rollback } = {}) => {
    if (optimistic) optimistic();
    try {
      return await apiCall();
    } catch (err) {
      if (rollback) rollback();
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      return null;
    }
  };

  // ── Resume handlers ────────────────────────────────────────────────────────
  const handleCloneResume = async (id) => {
    const src = resumes.find((r) => r.id === id);
    if (!src) return;
    const payload = { ...stripServerFields(src), role: `${src.role} (Copy)`, status: 'Draft - Pending Review', isActive: false };
    const res = await runMutation(() => createResume(payload));
    if (res) setResumes((prev) => [res.resume, ...prev]);
  };

  const handleDeleteResume = async (id) => {
    const snap = resumes;
    await runMutation(() => deleteResume(id), {
      optimistic: () => setResumes((prev) => prev.filter((r) => r.id !== id)),
      rollback: () => setResumes(snap),
    });
  };

  // Returns the saved resume so uploaders can select it by its real server id
  // (and stash the original PDF under that id) instead of the temp client id.
  const handleUploadResume = async (resume) => {
    const res = await runMutation(() => createResume(stripServerFields(resume)));
    if (res) {
      setResumes((prev) => [res.resume, ...prev]);
      return res.resume;
    }
    return null;
  };


  // Create a resume from a new Studio draft. Returns the saved resume so the Studio
  // can adopt its server id as `sourceId` (further edits then autosave in place
  // instead of creating duplicates).
  const handleSaveBuiltResume = async (resume) => {
    const res = await runMutation(() => createResume(stripServerFields(resume)));
    if (res) {
      setResumes((prev) => [res.resume, ...prev]);
      return res.resume;
    }
    return null;
  };

  // Persist a real ATS scan result so the score becomes "real" everywhere (Library,
  // dashboard). Fire-and-forget with an optimistic update — the scan UI already has
  // the result, so a failed save just means the badge stays "Not scanned".
  const handleRecordScan = async (id, { score, scanTarget }) => {
    if (!resumes.some((r) => r.id === id)) return;
    const res = await runMutation(() => recordResumeScan(id, { score, scanTarget }), {
      optimistic: () => setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, score, scanTarget, scannedAt: new Date().toISOString() } : r))),
    });
    if (res) setResumes((prev) => prev.map((r) => (r.id === id ? res.resume : r)));
  };

  const handleSetActive = async (id) => {
    const snap = resumes;
    const res = await runMutation(() => activateResume(id), {
      optimistic: () => setResumes((prev) => prev.map((r) => ({ ...r, isActive: r.id === id }))),
      rollback: () => setResumes(snap),
    });
    if (res) setResumes(res.resumes);
  };

  // ── Application handlers ───────────────────────────────────────────────────
  const handleSaveApplication = async (app) => {
    const exists = app.id && applications.some((a) => a.id === app.id);
    if (exists) {
      const snap = applications;
      const res = await runMutation(() => updateApplication(app.id, stripServerFields(app)), {
        optimistic: () => setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...app } : a))),
        rollback: () => setApplications(snap),
      });
      if (res) setApplications((prev) => prev.map((a) => (a.id === app.id ? res.application : a)));
    } else {
      const res = await runMutation(() => createApplication(stripServerFields(app)));
      if (res) setApplications((prev) => [res.application, ...prev]);
    }
  };

  const handleMoveApplication = async (id, stage) => {
    const current = applications.find((a) => a.id === id);
    if (!current || current.stage === stage) return;
    const snap = applications;
    const res = await runMutation(() => updateApplication(id, { stage }), {
      optimistic: () => setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a))),
      rollback: () => setApplications(snap),
    });
    if (res) setApplications((prev) => prev.map((a) => (a.id === id ? res.application : a)));
  };

  const handleDeleteApplication = async (id) => {
    const snap = applications;
    await runMutation(() => deleteApplication(id), {
      optimistic: () => setApplications((prev) => prev.filter((a) => a.id !== id)),
      rollback: () => setApplications(snap),
    });
  };

  const main = () => {
    if (dataStatus === 'loading') {
      return (
        <div className="data-state" role="status" aria-live="polite">
          <Loader2 size={26} className="data-state-spin" />
          <p>Loading your workspace…</p>
        </div>
      );
    }
    if (dataStatus === 'error') {
      return (
        <div className="data-state">
          <AlertCircle size={26} color="#b91c1c" />
          <p>{loadError}</p>
          <button type="button" className="new-resume-btn" onClick={loadData}>Try again</button>
        </div>
      );
    }
    return (
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome resumes={resumes} applications={applications} onNavigate={go} />} />
        <Route path="ats" element={<AtsScanPage resumes={resumes} onNewResumeClick={() => go('studio')} onUpload={handleUploadResume} onEnhance={goStudioWith} onScanned={handleRecordScan} />} />
        <Route path="studio" element={<BuildResumePage draft={buildDraft} onChange={setBuildDraft} onSaveResume={handleSaveBuiltResume} onNavigate={go} resumes={resumes} />} />
        {/* Build + Enhance merged into the Studio — keep the old paths working. */}
        <Route path="build" element={<Navigate to="/app/studio" replace />} />
        <Route path="enhance" element={<Navigate to="/app/studio" replace />} />
        <Route path="library" element={<LibraryPage resumes={resumes} onNewResumeClick={() => go('studio')} onClone={handleCloneResume} onDelete={handleDeleteResume} onSetActive={handleSetActive} onScan={() => go('ats')} onEditInStudio={goStudioWith} />} />
        <Route path="applications" element={<ApplicationsPage applications={applications} resumes={resumes} onSave={handleSaveApplication} onMove={handleMoveApplication} onDelete={handleDeleteApplication} />} />
        <Route path="interview" element={<ComingSoon name="Interview Prep" onHome={() => go('dashboard')} />} />
        <Route path="portfolio" element={<ComingSoon name="Portfolio" onHome={() => go('dashboard')} />} />
        <Route path="profile" element={<ComingSoon name="Profile" onHome={() => go('dashboard')} />} />
        <Route path="settings" element={<ComingSoon name="Settings" onHome={() => go('dashboard')} />} />
        <Route path="resources" element={<ComingSoon name="Resources" onHome={() => go('dashboard')} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    );
  };

  return (
    <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onLogout={handleLogout}
      />

      {sidebarCollapsed && (
        <button type="button" className="sidebar-reopen-btn" aria-label="Open sidebar" onClick={() => setSidebarCollapsed(false)}>
          <PanelLeftOpen size={20} />
        </button>
      )}

      <main className="main-content">
        {actionError && (
          <div className="action-error" role="alert">
            <AlertCircle size={16} />
            <span>{actionError}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setActionError('')}><X size={15} /></button>
          </div>
        )}
        {main()}
      </main>
    </div>
  );
}
