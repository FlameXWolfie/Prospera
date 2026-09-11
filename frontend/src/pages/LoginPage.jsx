import { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
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
      await login(form);
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
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">
        New to DraftMe?{' '}
        <button type="button" onClick={onSwitch} disabled={busy}>Create an account</button>
      </p>
      {error && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={15} strokeWidth={1.9} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className={`auth-field${errors.email ? ' invalid' : ''}`}>
          <label className="auth-label" htmlFor="login-email">Email</label>
          <span className="auth-input-wrap">
            <span className="auth-input-ic"><Mail size={16} strokeWidth={1.75} /></span>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-err' : undefined}
            />
          </span>
          {errors.email && (
            <span className="auth-err" id="login-email-err">
              <AlertCircle size={12} strokeWidth={2} />{errors.email}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.password ? ' invalid' : ''}`}>
          <label className="auth-label" htmlFor="login-password">Password</label>
          <span className="auth-input-wrap">
            <span className="auth-input-ic"><Lock size={16} strokeWidth={1.75} /></span>
            <input
              id="login-password"
              className="auth-input has-eye"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-err' : undefined}
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {errors.password && (
            <span className="auth-err" id="login-password-err">
              <AlertCircle size={12} strokeWidth={2} />{errors.password}
            </span>
          )}
        </div>

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? (
            <Loader2 size={17} className="auth-spin" />
          ) : (
            <>Sign in <ArrowRight size={16} className="auth-submit-arrow" strokeWidth={2} /></>
          )}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="auth-divider"><span>Or continue with</span></div>
          <div className="auth-social">
            <div className="auth-google">
              <GoogleLogin
                onSuccess={onGoogle}
                onError={() => setError('Google sign-in failed.')}
                text="continue_with"
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="352"
              />
            </div>
          </div>
        </>
      )}
    </AuthShell>
  );
}
