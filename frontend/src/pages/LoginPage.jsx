import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth/AuthContext';
import { ApiError } from '../lib/api';
import AuthShell from './AuthShell';

const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage({ onSwitch, onBack }) {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);

    try {
      await login(form);
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
      setError(requestError instanceof ApiError ? requestError.message : 'Google sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <AuthShell mode="login" onBack={onBack} onSwitch={onSwitch} busy={busy}>
      {error && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={15} strokeWidth={1.9} />
          <span>{error}</span>
        </div>
      )}

      {googleEnabled && (
        <>
          <div className="auth-google">
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() => setError('Google sign-in failed.')}
              text="continue_with"
              theme="outline"
              shape="rectangular"
              size="large"
              width="380"
            />
          </div>
          <div className="auth-divider"><span>or</span></div>
        </>
      )}

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className={`auth-field${errors.email ? ' has-error' : ''}`}>
          <label htmlFor="login-email">Email address</label>
          <div className="auth-control">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <span className="auth-field-error" id="login-email-error">
              {errors.email}
            </span>
          )}
        </div>

        <div className={`auth-field${errors.password ? ' has-error' : ''}`}>
          <label htmlFor="login-password">Password</label>
          <div className="auth-control">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
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
          {errors.password && (
            <span className="auth-field-error" id="login-password-error">
              {errors.password}
            </span>
          )}
        </div>

        <button className="auth-primary-action" type="submit" disabled={busy}>
          {busy ? <Loader2 size={18} className="auth-spinner" /> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
