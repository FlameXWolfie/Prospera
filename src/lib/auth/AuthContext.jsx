import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, tokenStore } from '../api';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Start as 'loading' only when there is a token to validate; otherwise we are
  // already a guest (avoids a synchronous setState inside the effect).
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'));

  // On load, restore the session by validating the stored token.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let alive = true;
    apiFetch('/auth/me')
      .then((data) => {
        if (!alive) return;
        setUser(data.user);
        setStatus('authed');
      })
      .catch((err) => {
        if (!alive) return;
        // Only a genuine auth rejection should discard the token. On a network
        // error (status 0) keep it so a later reload can re-validate the session.
        if (err && (err.status === 401 || err.status === 403)) tokenStore.clear();
        setStatus('guest');
      });
    return () => { alive = false; };
  }, []);

  const adopt = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const signup = useCallback(
    (payload) => apiFetch('/auth/signup', { method: 'POST', body: payload, auth: false }).then(adopt),
    [adopt],
  );
  const login = useCallback(
    (payload) => apiFetch('/auth/login', { method: 'POST', body: payload, auth: false }).then(adopt),
    [adopt],
  );
  const loginWithGoogle = useCallback(
    (credential) => apiFetch('/auth/google', { method: 'POST', body: { credential }, auth: false }).then(adopt),
    [adopt],
  );
  const logout = useCallback(() => {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  // Account management (all require an active session).
  const updateProfile = useCallback(
    (payload) => apiFetch('/auth/me', { method: 'PATCH', body: payload }).then((data) => {
      setUser(data.user);
      return data.user;
    }),
    [],
  );
  const changePassword = useCallback(
    (payload) => apiFetch('/auth/change-password', { method: 'POST', body: payload }).then((data) => {
      if (data.user) setUser(data.user);
      return data;
    }),
    [],
  );
  // Only hits the API (throws on a bad password). The caller navigates away from
  // /app FIRST, then calls logout() to clear the session — same order as the
  // logout button, so RequireAuth can't redirect to /login mid-flight.
  const deleteAccount = useCallback(
    (payload) => apiFetch('/auth/me', { method: 'DELETE', body: payload }),
    [],
  );

  const value = { user, status, signup, login, loginWithGoogle, logout, updateProfile, changePassword, deleteAccount };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
