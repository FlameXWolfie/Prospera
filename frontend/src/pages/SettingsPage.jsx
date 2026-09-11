import './css/AccountPages.css';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Palette, Bell, Lock, Link2, ShieldCheck, Trash2,
  Sun, Moon, Check, AlertCircle, Loader2, Eye, EyeOff, LogOut,
  AlertTriangle, KeyRound, Fingerprint, Mail, Calendar,
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { useTheme } from '../lib/theme/ThemeContext';
import { ApiError } from '../lib/api';

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

// Rail sections. `group` rows are non-clickable headers.
const SECTIONS = [
  { group: 'General' },
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { group: 'Security & account' },
  { id: 'security', name: 'Password', icon: Lock },
  { id: 'connected', name: 'Connected accounts', icon: Link2 },
  { id: 'account', name: 'Account', icon: ShieldCheck },
  { id: 'danger', name: 'Delete account', icon: Trash2, danger: true },
];
const SECTION_IDS = SECTIONS.filter((s) => s.id).map((s) => s.id);

// Notification preferences live on the device (no backend yet) but really persist.
const NOTIF_KEY = 'prospera_notif_prefs';
const NOTIF_DEFS = [
  { id: 'product', t: 'Product updates', d: 'New features, improvements, and announcements.' },
  { id: 'reminders', t: 'Application reminders', d: 'Nudges about follow-ups and upcoming interviews.' },
  { id: 'tips', t: 'Resume tips', d: 'Occasional advice to improve your resume and ATS score.' },
  { id: 'security', t: 'Security alerts', d: 'Important notices about your account’s security.' },
];
const loadNotif = () => {
  const base = Object.fromEntries(NOTIF_DEFS.map((n) => [n.id, true]));
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
    return { ...base, ...saved };
  } catch { return base; }
};

export default function SettingsPage() {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const hasPassword = !!user?.hasPassword;
  const isGoogle = user?.provider === 'google';
  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  const raw = params.get('section');
  const section = SECTION_IDS.includes(raw) ? raw : 'profile';
  const goSection = (id) => setParams(id === 'profile' ? {} : { section: id });

  // ── Profile (display name) ────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameFieldErr, setNameFieldErr] = useState('');
  const [nameFormErr, setNameFormErr] = useState('');
  const trimmed = name.trim();
  const nameDirty = trimmed !== (user?.name || '').trim();
  const canSaveName = nameDirty && trimmed.length > 0 && !savingName;

  const submitName = async (e) => {
    e.preventDefault();
    if (!canSaveName) return;
    setSavingName(true); setNameFieldErr(''); setNameFormErr(''); setNameSaved(false);
    try {
      await updateProfile({ name: trimmed });
      setNameSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields?.name) setNameFieldErr(err.fields.name);
      else setNameFormErr(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSavingName(false);
    }
  };

  // ── Notifications ──────────────────────────────────────────────────────────────
  const [notif, setNotif] = useState(loadNotif);
  const toggleNotif = (id) => {
    setNotif((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  // ── Password ────────────────────────────────────────────────────────────────
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwErrs, setPwErrs] = useState({});
  const [pwFormErr, setPwFormErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  const submitPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (hasPassword && !current) errs.currentPassword = 'Enter your current password.';
    if (next.length < 8) errs.newPassword = 'Password must be at least 8 characters.';
    if (confirm !== next) errs.confirm = 'Passwords do not match.';
    setPwErrs(errs); setPwFormErr(''); setPwDone(false);
    if (Object.keys(errs).length) return;
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
      setPwDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setPwErrs(err.fields);
      else setPwFormErr(err instanceof ApiError ? err.message : 'Could not update your password.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────────
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirmText, setDelConfirmText] = useState('');
  const [delPassword, setDelPassword] = useState('');
  const [delErr, setDelErr] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canDelete = delConfirmText.trim().toLowerCase() === (user?.email || '').toLowerCase()
    && (!hasPassword || delPassword.length > 0)
    && !deleting;

  const closeDelete = () => { setDelOpen(false); setDelConfirmText(''); setDelPassword(''); setDelErr(''); };

  const submitDelete = async () => {
    if (!canDelete) return;
    setDeleting(true); setDelErr('');
    try {
      await deleteAccount(hasPassword ? { password: delPassword } : {});
    } catch (err) {
      setDelErr(err instanceof ApiError ? err.message : 'Could not delete your account.');
      setDeleting(false);
      return;
    }
    // Server confirmed the delete. Clear the local token, then HARD-navigate to the
    // public landing page. A full reload (vs. SPA navigate) sidesteps the RequireAuth
    // guard race that would otherwise bounce a just-cleared session to /login.
    logout();
    window.location.assign('/');
  };

  const handleSignOut = () => { navigate('/'); logout(); };

  return (
    <div className="acc-page">
      <header className="acc-bar">
        <h1 className="acc-title">Settings</h1>
        <p className="acc-subtitle">Manage your profile, preferences, and account.</p>
      </header>

      {/* Identity hero — always visible, ties the hub together */}
      <section className="acc-hero">
        <div className="acc-hero-cover" />
        <div className="acc-hero-body">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="acc-hero-avatar" referrerPolicy="no-referrer" />
            : <span className="acc-hero-avatar acc-hero-avatar-mono">{initial}</span>}
          <div className="acc-hero-info">
            <div className="acc-hero-name">{user?.name || 'Your name'}</div>
            <div className="acc-hero-email">{user?.email}</div>
          </div>
          <div className="acc-hero-tags">
            <span className="acc-badge acc-badge-accent">
              <Fingerprint size={13} /> {isGoogle ? 'Google account' : 'Email account'}
            </span>
            <span className="acc-badge"><Calendar size={13} /> Joined {fmtDate(user?.createdAt)}</span>
          </div>
        </div>
      </section>

      <div className="acc-shell">
        {/* Section rail */}
        <nav className="acc-rail" aria-label="Settings sections">
          {SECTIONS.map((s) => {
            if (s.group) return <div key={s.group} className="acc-rail-group">{s.group}</div>;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                className={`acc-rail-item${s.danger ? ' danger' : ''}${section === s.id ? ' active' : ''}`}
                onClick={() => goSection(s.id)}
                aria-current={section === s.id ? 'page' : undefined}
              >
                <Icon size={17} /> <span>{s.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Section content (keyed so it re-animates on switch) */}
        <div className="acc-content" key={section}>
          {section === 'profile' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><User size={18} /></span>
                <div className="acc-head-text">
                  <h2>Personal information</h2>
                  <p>Your display name is shown on your dashboard and used to prefill new resumes.</p>
                </div>
              </div>
              <form onSubmit={submitName}>
                {nameFormErr && <div className="acc-formerr"><AlertCircle size={15} /><span>{nameFormErr}</span></div>}
                <div className="acc-form">
                  <div className="acc-field-grid">
                    <div className="acc-field">
                      <label className="acc-label" htmlFor="acc-name">Display name</label>
                      <div className="acc-input-wrap">
                        <input
                          id="acc-name"
                          className={`acc-input${nameFieldErr ? ' invalid' : ''}`}
                          value={name}
                          maxLength={80}
                          onChange={(e) => { setName(e.target.value); setNameSaved(false); setNameFieldErr(''); }}
                          placeholder="Your full name"
                        />
                      </div>
                      {nameFieldErr && <span className="acc-err">{nameFieldErr}</span>}
                    </div>
                    <div className="acc-field">
                      <label className="acc-label" htmlFor="acc-email">Email address</label>
                      <div className="acc-input-wrap">
                        <input id="acc-email" className="acc-input" value={user?.email || ''} disabled readOnly />
                      </div>
                      <span className="acc-hint">Used to sign in — can&apos;t be changed here.</span>
                    </div>
                  </div>
                </div>
                <div className="acc-foot-bar">
                  <span className="acc-foot-hint">Changes are saved to your account.</span>
                  <div className="acc-foot-actions">
                    {nameSaved && !nameDirty && <span className="acc-saved"><Check size={15} /> Saved</span>}
                    <button type="submit" className="acc-btn acc-btn-primary" disabled={!canSaveName}>
                      {savingName ? <><Loader2 size={15} className="data-state-spin" /> Saving…</> : 'Save changes'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {section === 'appearance' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><Palette size={18} /></span>
                <div className="acc-head-text">
                  <h2>Appearance</h2>
                  <p>Choose how DraftMe looks. This preference is saved to this device.</p>
                </div>
              </div>
              <div className="acc-theme" role="group" aria-label="Theme">
                <button type="button" className={`acc-theme-opt${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
                  <span className="acc-theme-preview tp-light">
                    <span className="tp-bar" /><span className="tp-line w1" /><span className="tp-line w2" />
                  </span>
                  <span className="acc-theme-foot">
                    <Sun size={16} /> Light {theme === 'light' && <Check className="acc-theme-check" size={15} />}
                  </span>
                </button>
                <button type="button" className={`acc-theme-opt${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
                  <span className="acc-theme-preview tp-dark">
                    <span className="tp-bar" /><span className="tp-line w1" /><span className="tp-line w2" />
                  </span>
                  <span className="acc-theme-foot">
                    <Moon size={16} /> Dark {theme === 'dark' && <Check className="acc-theme-check" size={15} />}
                  </span>
                </button>
              </div>
            </section>
          )}

          {section === 'notifications' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><Bell size={18} /></span>
                <div className="acc-head-text">
                  <h2>Notifications</h2>
                  <p>Choose what DraftMe can email you about. Saved on this device.</p>
                </div>
              </div>
              <div className="acc-toggle-list">
                {NOTIF_DEFS.map((n) => (
                  <div className="acc-toggle-row" key={n.id}>
                    <div className="acc-toggle-text">
                      <div className="t">{n.t}</div>
                      <div className="d">{n.d}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!notif[n.id]}
                      aria-label={n.t}
                      className={`acc-switch${notif[n.id] ? ' on' : ''}`}
                      onClick={() => toggleNotif(n.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {section === 'security' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><Lock size={18} /></span>
                <div className="acc-head-text">
                  <h2>{hasPassword ? 'Change password' : 'Set a password'}</h2>
                  <p>
                    {hasPassword
                      ? 'Update the password you use to sign in.'
                      : 'You signed up with Google. Add a password so you can also sign in with your email.'}
                  </p>
                </div>
              </div>
              <form onSubmit={submitPassword}>
                {pwFormErr && <div className="acc-formerr"><AlertCircle size={15} /><span>{pwFormErr}</span></div>}
                <div className="acc-form">
                  {hasPassword && (
                    <div className="acc-field">
                      <label className="acc-label" htmlFor="acc-cur">Current password</label>
                      <div className="acc-input-wrap">
                        <input
                          id="acc-cur" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                          className={`acc-input acc-input-pw${pwErrs.currentPassword ? ' invalid' : ''}`}
                          value={current} onChange={(e) => { setCurrent(e.target.value); setPwDone(false); }}
                        />
                      </div>
                      {pwErrs.currentPassword && <span className="acc-err">{pwErrs.currentPassword}</span>}
                    </div>
                  )}
                  <div className="acc-field-grid">
                    <div className="acc-field">
                      <label className="acc-label" htmlFor="acc-new">New password</label>
                      <div className="acc-input-wrap">
                        <input
                          id="acc-new" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                          className={`acc-input acc-input-pw${pwErrs.newPassword ? ' invalid' : ''}`}
                          value={next} onChange={(e) => { setNext(e.target.value); setPwDone(false); }}
                        />
                        <button type="button" className="acc-eye" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide passwords' : 'Show passwords'}>
                          {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {pwErrs.newPassword ? <span className="acc-err">{pwErrs.newPassword}</span> : <span className="acc-hint">At least 8 characters.</span>}
                    </div>
                    <div className="acc-field">
                      <label className="acc-label" htmlFor="acc-confirm">Confirm new password</label>
                      <div className="acc-input-wrap">
                        <input
                          id="acc-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                          className={`acc-input acc-input-pw${pwErrs.confirm ? ' invalid' : ''}`}
                          value={confirm} onChange={(e) => { setConfirm(e.target.value); setPwDone(false); }}
                        />
                      </div>
                      {pwErrs.confirm && <span className="acc-err">{pwErrs.confirm}</span>}
                    </div>
                  </div>
                </div>
                <div className="acc-foot-bar">
                  <span className="acc-foot-hint">You&apos;ll stay signed in on this device.</span>
                  <div className="acc-foot-actions">
                    {pwDone && <span className="acc-saved"><Check size={15} /> Updated</span>}
                    <button type="submit" className="acc-btn acc-btn-primary" disabled={pwSaving}>
                      {pwSaving ? <><Loader2 size={15} className="data-state-spin" /> Saving…</> : (hasPassword ? 'Update password' : 'Set password')}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {section === 'connected' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><Link2 size={18} /></span>
                <div className="acc-head-text">
                  <h2>Connected accounts</h2>
                  <p>The sign-in methods linked to your DraftMe account.</p>
                </div>
              </div>
              <div className="acc-conn-list">
                <div className="acc-conn-row">
                  <span className="acc-conn-ic" aria-hidden="true">G</span>
                  <div className="acc-conn-main">
                    <div className="t">Google</div>
                    <div className="d">{isGoogle ? user?.email : 'Sign in with Google to link it to this account.'}</div>
                  </div>
                  <span className={`acc-pill ${isGoogle ? 'ok' : 'muted'}`}>{isGoogle ? 'Connected' : 'Not connected'}</span>
                </div>
                <div className="acc-conn-row">
                  <span className="acc-conn-ic" aria-hidden="true"><KeyRound size={18} /></span>
                  <div className="acc-conn-main">
                    <div className="t">Email &amp; password</div>
                    <div className="d">{hasPassword ? 'Sign in with your email and password.' : 'Add a password to enable email sign-in.'}</div>
                  </div>
                  {hasPassword
                    ? <span className="acc-pill ok">Enabled</span>
                    : <button type="button" className="acc-btn acc-btn-ghost" onClick={() => goSection('security')}>Set password</button>}
                </div>
              </div>
            </section>
          )}

          {section === 'account' && (
            <section className="acc-card">
              <div className="acc-card-head">
                <span className="acc-head-icon"><ShieldCheck size={18} /></span>
                <div className="acc-head-text">
                  <h2>Account</h2>
                  <p>Details about the account you&apos;re signed in to.</p>
                </div>
              </div>
              <div className="acc-sum-list">
                <div className="acc-sum-row">
                  <span className="acc-sum-label"><Mail size={15} /> Signed in as</span>
                  <span className="acc-sum-value">{user?.email}</span>
                </div>
                <div className="acc-sum-row">
                  <span className="acc-sum-label"><Fingerprint size={15} /> Sign-in method</span>
                  <span className="acc-sum-value">{isGoogle ? 'Google' : 'Email & password'}</span>
                </div>
                <div className="acc-sum-row">
                  <span className="acc-sum-label"><KeyRound size={15} /> Password</span>
                  <span className="acc-sum-value">
                    <span className={`acc-pill ${hasPassword ? 'ok' : 'muted'}`}>{hasPassword ? 'Enabled' : 'Not set'}</span>
                  </span>
                </div>
                <div className="acc-sum-row">
                  <span className="acc-sum-label"><Calendar size={15} /> Member since</span>
                  <span className="acc-sum-value">{fmtDate(user?.createdAt)}</span>
                </div>
              </div>
              <div className="acc-foot-bar">
                <span className="acc-foot-hint">End your session on this device.</span>
                <button type="button" className="acc-btn acc-btn-ghost" onClick={handleSignOut}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </section>
          )}

          {section === 'danger' && (
            <section className="acc-card acc-card-danger">
              <div className="acc-card-head">
                <span className="acc-head-icon"><Trash2 size={18} /></span>
                <div className="acc-head-text">
                  <h2>Delete account</h2>
                  <p>Permanently delete your account and everything in it.</p>
                </div>
              </div>
              <div className="acc-danger-row">
                <p>This removes your resumes, applications, and portfolio. This cannot be undone.</p>
                <button type="button" className="acc-btn acc-btn-danger" onClick={() => setDelOpen(true)}>
                  Delete account
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {delOpen && (
        <div className="acc-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="acc-del-title" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDelete(); }}>
          <div className="acc-modal">
            <div className="acc-modal-icon"><AlertTriangle size={22} /></div>
            <h3 id="acc-del-title">Delete your account?</h3>
            <p>
              This permanently removes your account and everything in it — resumes, applications, and your portfolio.
              To confirm, type your email <b>{user?.email}</b> below.
            </p>
            {delErr && <div className="acc-formerr"><AlertCircle size={15} /><span>{delErr}</span></div>}
            <div className="acc-form">
              <div className="acc-field">
                <label className="acc-label" htmlFor="acc-del-email">Email</label>
                <div className="acc-input-wrap">
                  <input id="acc-del-email" className="acc-input" value={delConfirmText} onChange={(e) => setDelConfirmText(e.target.value)} placeholder={user?.email} autoComplete="off" />
                </div>
              </div>
              {hasPassword && (
                <div className="acc-field">
                  <label className="acc-label" htmlFor="acc-del-pw">Password</label>
                  <div className="acc-input-wrap">
                    <input id="acc-del-pw" type="password" className="acc-input" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} autoComplete="current-password" />
                  </div>
                </div>
              )}
            </div>
            <div className="acc-modal-actions">
              <button type="button" className="acc-btn acc-btn-ghost" onClick={closeDelete} disabled={deleting}>Cancel</button>
              <button type="button" className="acc-btn acc-btn-danger" onClick={submitDelete} disabled={!canDelete}>
                {deleting ? <><Loader2 size={15} className="data-state-spin" /> Deleting…</> : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
