import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './lib/auth/AuthContext';
import AuthSplash from './components/AuthSplash';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './pages/DashboardLayout';

// Gate the app behind a valid session; bounce guests to login.
function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <AuthSplash />;
  if (status !== 'authed') return <Navigate to="/login" replace />;
  return children;
}

// Auth screens: an already-signed-in user is sent to the app.
function GuestOnly({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <AuthSplash />;
  if (status === 'authed') return <Navigate to="/dashboard" replace />;
  return children;
}

// Keep old bookmarks working while exposing clean workspace URLs.
function LegacyAppRedirect() {
  const { pathname, search, hash } = useLocation();
  const section = pathname.replace(/^\/app\/?/, '');
  const destination = section ? `/${section}` : '/dashboard';
  return <Navigate to={`${destination}${search}${hash}`} replace />;
}

// Thin route wrappers keep the existing page prop contracts (onBack/onSwitch/etc.)
// while sourcing navigation from the router.
function LandingRoute() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const isAuthed = status === 'authed';
  // Signed-in visitors should enter the app, not the guest signup/login funnels.
  return (
    <LandingPage
      isAuthed={isAuthed}
      onEnterApp={() => navigate(isAuthed ? '/dashboard' : '/signup')}
      onLogin={() => navigate(isAuthed ? '/dashboard' : '/login')}
    />
  );
}
function LoginRoute() {
  const navigate = useNavigate();
  return <LoginPage onSwitch={() => navigate('/signup')} onBack={() => navigate('/')} />;
}
function SignupRoute() {
  const navigate = useNavigate();
  return <SignupPage onSwitch={() => navigate('/login')} onBack={() => navigate('/')} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<GuestOnly><LoginRoute /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><SignupRoute /></GuestOnly>} />
      <Route path="/app/*" element={<LegacyAppRedirect />} />
      <Route path="/*" element={<RequireAuth><DashboardLayout /></RequireAuth>} />
    </Routes>
  );
}
