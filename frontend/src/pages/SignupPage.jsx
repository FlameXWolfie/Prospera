import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';
import AuthShell from './AuthShell';

const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getPasswordScore(value) {
  if (!value) return 0;

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(value) && /\d/.test(value)) score += 1;
  if (value.length >= 12) score += 1;
  if (/[^a-zA-Z0-9]/.test(value)) score += 1;
  return score;
}

const STRENGTH_LABELS = ['Start typing', 'Needs work', 'Good', 'Strong', 'Excellent'];

export default function SignupPage({ onSwitch, onBack }) {
  const { signup, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const passwordScore = useMemo(() => getPasswordScore(form.password), [form.password]);
  const passwordIsValid = form.password.length >= 8 && /[a-zA-Z]/.test(form.password) && /\d/.test(form.password);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);

    try {
      await signup(form);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong.');
      if (requestError instanceof ApiError && requestError.fields) setErrors(requestError.fields);
      setBusy(false);
    }
  };

  const onGoogle = async (credentialResponse) => {
    setError('');
    setBusy(true);

    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Google sign-up failed.');
      setBusy(false);
    }
  };

  return (
    <AuthShell mode="signup" onBack={onBack} onSwitch={onSwitch} busy={busy}>
      {error && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={16} strokeWidth={1.9} />
          <span>{error}</span>
        </div>
      )}

      {googleEnabled && (
        <>
          <div className="auth-google">
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() => setError('Google sign-up failed.')}
              text="signup_with"
              theme="outline"
              shape="rectangular"
              size="large"
              width="400"
            />
          </div>
          <div className="auth-divider"><span>or use email</span></div>
        </>
      )}

      <form className="auth-form auth-form-signup" onSubmit={submit} noValidate>
        <div className={`auth-field${errors.name ? ' has-error' : ''}`}>
          <label htmlFor="signup-name">Full name</label>
          <div className="auth-control">
            <UserRound className="auth-control-icon" size={18} strokeWidth={1.7} />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'signup-name-error' : undefined}
            />
          </div>
          {errors.name && (
            <span className="auth-field-error" id="signup-name-error">
              <AlertCircle size={12} /> {errors.name}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.email ? ' has-error' : ''}`}>
          <label htmlFor="signup-email">Email address</label>
          <div className="auth-control">
            <Mail className="auth-control-icon" size={18} strokeWidth={1.7} />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <span className="auth-field-error" id="signup-email-error">
              <AlertCircle size={12} /> {errors.email}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.password ? ' has-error' : ''}`}>
          <div className="auth-label-row">
            <label htmlFor="signup-password">Password</label>
            {form.password && (
              <span className={`auth-strength-label strength-${passwordScore}`} aria-live="polite">
                {STRENGTH_LABELS[passwordScore]}
              </span>
            )}
          </div>
          <div className="auth-control">
            <LockKeyhole className="auth-control-icon" size={18} strokeWidth={1.7} />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Create a secure password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-help'}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {form.password && !errors.password && (
            <div className={`auth-strength strength-${passwordScore}`} id="signup-password-help">
              <div className="auth-strength-track" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span key={step} className={passwordScore >= step ? 'is-filled' : ''} />
                ))}
              </div>
              <span className={passwordIsValid ? 'is-valid' : ''}>
                {passwordIsValid && <Check size={12} strokeWidth={2.4} />}
                8+ characters with letters and numbers
              </span>
            </div>
          )}

          {!form.password && !errors.password && (
            <span className="auth-field-hint" id="signup-password-help">
              Use 8+ characters with letters and numbers.
            </span>
          )}

          {errors.password && (
            <span className="auth-field-error" id="signup-password-error">
              <AlertCircle size={12} /> {errors.password}
            </span>
          )}
        </div>

        <button className="auth-primary-action" type="submit" disabled={busy}>
          <span>{busy ? 'Creating workspace' : 'Create my workspace'}</span>
          {busy ? (
            <Loader2 size={18} className="auth-spinner" />
          ) : (
            <ArrowRight size={18} className="auth-action-arrow" />
          )}
        </button>
      </form>
    </AuthShell>
  );
}
