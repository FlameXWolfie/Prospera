import './css/AccountPages.css';
import { useState } from 'react';
import { User, Mail, Calendar, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErr, setFieldErr] = useState('');
  const [formErr, setFormErr] = useState('');

  const initial = (user?.name || 'A').charAt(0).toUpperCase();
  const trimmed = name.trim();
  const dirty = trimmed !== (user?.name || '').trim();
  const canSave = dirty && trimmed.length > 0 && !saving;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setFieldErr('');
    setFormErr('');
    setSaved(false);
    try {
      await updateProfile({ name: trimmed });
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields?.name) setFieldErr(err.fields.name);
      else setFormErr(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="acc-page">
      <div className="acc-bar">
        <h1 className="acc-title">Profile</h1>
        <p className="acc-subtitle">Manage how your account appears across Prospera.</p>
      </div>

      <div className="acc-card acc-identity">
        {user?.avatar
          ? <img src={user.avatar} alt="" className="acc-id-avatar" referrerPolicy="no-referrer" />
          : <span className="acc-id-avatar acc-id-avatar-mono">{initial}</span>}
        <div className="acc-id-main">
          <div className="acc-id-name">{user?.name || 'Your name'}</div>
          <div className="acc-id-email">{user?.email}</div>
          <div className="acc-id-meta">
            <span className="acc-badge">{user?.provider === 'google' ? 'Google account' : 'Email account'}</span>
            <span><Calendar size={13} /> Member since {fmtDate(user?.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="acc-card">
        <div className="acc-card-head">
          <h2><User size={16} /> Display name</h2>
          <p>This is the name shown on your dashboard and used to prefill new resumes.</p>
        </div>
        <form className="acc-form" onSubmit={onSubmit}>
          {formErr && <div className="acc-formerr"><AlertCircle size={15} /><span>{formErr}</span></div>}
          <div className="acc-field">
            <label className="acc-label" htmlFor="acc-name">Name</label>
            <div className="acc-input-wrap">
              <input
                id="acc-name"
                className={`acc-input${fieldErr ? ' invalid' : ''}`}
                value={name}
                maxLength={80}
                onChange={(e) => { setName(e.target.value); setSaved(false); setFieldErr(''); }}
                placeholder="Your full name"
              />
            </div>
            {fieldErr && <span className="acc-err">{fieldErr}</span>}
          </div>
          <div className="acc-actions">
            <button type="submit" className="acc-btn acc-btn-primary" disabled={!canSave}>
              {saving ? <><Loader2 size={15} className="data-state-spin" /> Saving…</> : 'Save changes'}
            </button>
            {saved && !dirty && <span className="acc-saved"><Check size={15} /> Saved</span>}
          </div>
        </form>
      </div>

      <div className="acc-card">
        <div className="acc-card-head">
          <h2><Mail size={16} /> Email</h2>
          <p>Your email is used to sign in and can&apos;t be changed here.</p>
        </div>
        <div className="acc-field">
          <div className="acc-input-wrap">
            <input className="acc-input" value={user?.email || ''} disabled readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
