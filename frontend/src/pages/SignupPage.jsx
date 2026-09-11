import { useState, useMemo } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';
import AuthShell from './AuthShell';

const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Mirrors the server rule (8+ chars, letters and numbers) and rewards length.
function scorePassword(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(value) && /\d/.test(value)) score += 1;
  if (value.length >= 12 || /[^a-zA-Z0-9]/.test(value)) score += 1;
  return score;
}

const STRENGTH = [
  { label: '', className: '' },
  { label: 'Weak', className: 'on-weak' },
  { label: 'Fair', className: 'on-fair' },
  { label: 'Strong', className: 'on-strong' },
];

export default function SignupPage({ onSwitch, onBack }) {
  const { signup, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const score = useMemo(() => scorePassword(form.password), [form.password]);
  const strength = STRENGTH[score];

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
      {error && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={15} strokeWidth={1.9} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className={`auth-field${errors.name ? ' invalid' : ''}`}>
          <label className="auth-label" htmlFor="signup-name">Full name</label>
          <span className="auth-input-wrap">
            <span className="auth-input-ic"><User size={16} strokeWidth={1.75} /></span>
            <input
              id="signup-name"
              className="auth-input"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ananya Raghunathan"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'signup-name-err' : undefined}
            />
          </span>
          {errors.name && (
            <span className="auth-err" id="signup-name-err">
              <AlertCircle size={12} strokeWidth={2} />{errors.name}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.email ? ' invalid' : ''}`}>
          <label className="auth-label" htmlFor="signup-email">Email</label>
          <span className="auth-input-wrap">
            <span className="auth-input-ic"><Mail size={16} strokeWidth={1.75} /></span>
            <input
              id="signup-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'signup-email-err' : undefined}
            />
          </span>
          {errors.email && (
            <span className="auth-err" id="signup-email-err">
              <AlertCircle size={12} strokeWidth={2} />{errors.email}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.password ? ' invalid' : ''}`}>
          <label className="auth-label" htmlFor="signup-password">Password</label>
          <span className="auth-input-wrap">
            <span className="auth-input-ic"><Lock size={16} strokeWidth={1.75} /></span>
            <input
              id="signup-password"
              className="auth-input has-eye"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
              aria-describedby="signup-password-help"
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

          {form.password && !errors.password && (
            <div className="auth-strength">
              <div className="auth-strength-bars" aria-hidden="true">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`auth-strength-bar${score >= step ? ` ${strength.className}` : ''}`}
                  />
                ))}
              </div>
              <span className="auth-strength-text" id="signup-password-help" aria-live="polite">
                Password strength: <b>{strength.label}</b>
              </span>
            </div>
          )}

          {errors.password ? (
            <span className="auth-err" id="signup-password-err">
              <AlertCircle size={12} strokeWidth={2} />{errors.password}
            </span>
          ) : (
            !form.password && (
              <span className="auth-hint" id="signup-password-help">
                Use 8+ characters with a mix of letters and numbers.
              </span>
            )
          )}
        </div>

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? (
            <Loader2 size={17} className="auth-spin" />
          ) : (
            <>Create account <ArrowRight size={16} className="auth-submit-arrow" strokeWidth={2} /></>
          )}
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
