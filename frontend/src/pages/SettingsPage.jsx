import './css/AccountPages.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Lock, Shield, Check, AlertCircle, Loader2,
  Eye, EyeOff, LogOut, Trash2, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { useTheme } from '../lib/theme/ThemeContext';
import { ApiError } from '../lib/api';

export default function SettingsPage() {
  const { user, changePassword, deleteAccount, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const hasPassword = !!user?.hasPassword;

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
    setPwErrs(errs);
    setPwFormErr('');
    setPwDone(false);
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

  const closeDelete = () => {
    setDelOpen(false);
    setDelConfirmText(''); setDelPassword(''); setDelErr('');
  };

  const submitDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDelErr('');
    try {
      await deleteAccount(hasPassword ? { password: delPassword } : {});
    } catch (err) {
      setDelErr(err instanceof ApiError ? err.message : 'Could not delete your account.');
      setDeleting(false);
      return;
    }
    // Server confirmed the delete. Clear the local token, then HARD-navigate to
    // the public landing page. A full reload (vs. SPA navigate) sidesteps the
    // RequireAuth guard race that would otherwise bounce a just-cleared session
    // to /login. Fitting for a terminal, one-way action.
    logout();
    window.location.assign('/');
  };

  const handleSignOut = () => { navigate('/'); logout(); };

  return (
    <div className="acc-page">
      <div className="acc-bar">
        <h1 className="acc-title">Settings</h1>
        <p className="acc-subtitle">Preferences, security, and your account.</p>
      </div>

      {/* Appearance */}
      <div className="acc-card">
        <div className="acc-card-head">
          <h2><Sun size={16} /> Appearance</h2>
          <p>Choose how Prospera looks. This is saved to this device.</p>
        </div>
        <div className="acc-theme" role="group" aria-label="Theme">
          <button type="button" className={`acc-theme-opt${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
            <Sun size={20} /> Light
          </button>
          <button type="button" className={`acc-theme-opt${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
            <Moon size={20} /> Dark
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="acc-card">
        <div className="acc-card-head">
          <h2><Lock size={16} /> {hasPassword ? 'Change password' : 'Set a password'}</h2>
          <p>
            {hasPassword
              ? 'Update the password you use to sign in.'
              : 'You signed up with Google. Add a password so you can also sign in with your email.'}
          </p>
        </div>
        <form className="acc-form" onSubmit={submitPassword}>
          {pwFormErr && <div className="acc-formerr"><AlertCircle size={15} /><span>{pwFormErr}</span></div>}
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
          <div className="acc-actions">
            <button type="submit" className="acc-btn acc-btn-primary" disabled={pwSaving}>
              {pwSaving ? <><Loader2 size={15} className="data-state-spin" /> Saving…</> : (hasPassword ? 'Update password' : 'Set password')}
            </button>
            {pwDone && <span className="acc-saved"><Check size={15} /> Password updated</span>}
          </div>
        </form>
      </div>

      {/* Session */}
      <div className="acc-card">
        <div className="acc-row">
          <div className="acc-row-text">
            <h2><Shield size={16} /> Sign out</h2>
            <p>Sign out of Prospera on this device.</p>
          </div>
          <button type="button" className="acc-btn acc-btn-ghost" onClick={handleSignOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="acc-card acc-card-danger">
        <div className="acc-row">
          <div className="acc-row-text">
            <h2><Trash2 size={16} /> Delete account</h2>
            <p>Permanently delete your account and all your resumes, applications, and portfolio. This cannot be undone.</p>
          </div>
          <button type="button" className="acc-btn acc-btn-danger" onClick={() => setDelOpen(true)}>
            Delete account
          </button>
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
