import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';
import AuthShell from './AuthShell';

const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function SignupPage({ onSwitch, onBack }) {
  const { signup, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await signup(form);
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
      <h1 className="auth-title">Create an account</h1>
      <p className="auth-sub">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} disabled={busy}>Log in</button>
      </p>
      {error && <div className="auth-alert" role="alert">{error}</div>}

      <form className="auth-form" onSubmit={submit} noValidate>
        <label className={`auth-field${errors.name ? ' invalid' : ''}`}>
          <span className="auth-label">Full name</span>
          <span className="auth-input-wrap">
            <input
              className="auth-input"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </span>
          {errors.name && <span className="auth-err">{errors.name}</span>}
        </label>

        <label className={`auth-field${errors.email ? ' invalid' : ''}`}>
          <span className="auth-label">Email</span>
          <span className="auth-input-wrap">
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
          </span>
          {errors.email && <span className="auth-err">{errors.email}</span>}
        </label>

        <label className={`auth-field${errors.password ? ' invalid' : ''}`}>
          <span className="auth-label">Password</span>
          <span className="auth-input-wrap">
            <input
              className="auth-input has-eye"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
            />
            <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {errors.password ? <span className="auth-err">{errors.password}</span> : <span className="auth-hint">Use 8+ characters with a mix of letters and numbers.</span>}
        </label>

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? <Loader2 size={17} className="auth-spin" /> : 'Create account'}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="auth-divider"><span>Or register with</span></div>
          <div className="auth-social">
            <div className="auth-google">
              <GoogleLogin
                onSuccess={onGoogle}
                onError={() => setError('Google sign-in failed.')}
                text="signup_with"
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
