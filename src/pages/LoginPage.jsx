import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';
import AuthShell from './AuthShell';

const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage({ onSwitch, onBack }) {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);
    try {
      await login(form); // success flips AuthProvider → App renders the dashboard
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setBusy(false);
    }
  };

  const onGoogle = async (cred) => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle(cred.credential);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Google sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <AuthShell onBack={onBack} busy={busy}>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-sub">Sign in to continue to Prospera.</p>
      {error && <div className="auth-alert" role="alert">{error}</div>}

      <form className="auth-form" onSubmit={submit} noValidate>
        <label className={`auth-field${errors.email ? ' invalid' : ''}`}>
          <span className="auth-label">Email</span>
          <span className="auth-input-wrap">
            <Mail size={16} className="auth-input-ic" />
            <input className="auth-input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
          </span>
          {errors.email && <span className="auth-err">{errors.email}</span>}
        </label>

        <label className={`auth-field${errors.password ? ' invalid' : ''}`}>
          <span className="auth-label">Password</span>
          <span className="auth-input-wrap">
            <Lock size={16} className="auth-input-ic" />
            <input className="auth-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </span>
          {errors.password && <span className="auth-err">{errors.password}</span>}
        </label>

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? <Loader2 size={18} className="auth-spin" /> : 'Sign in'}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="auth-divider"><span>or</span></div>
          <div className="auth-google">
            <GoogleLogin onSuccess={onGoogle} onError={() => setError('Google sign-in failed.')} text="signin_with" width="360" />
          </div>
        </>
      )}

      <p className="auth-switch">New to Prospera? <button type="button" onClick={onSwitch} disabled={busy}>Create an account</button></p>
    </AuthShell>
  );
}
