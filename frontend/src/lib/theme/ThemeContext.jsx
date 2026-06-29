// Light/dark theme: the single source of truth for the app's color scheme.
//
// Resolution order: the user's saved choice (localStorage `prospera_theme`) wins;
// otherwise we follow the OS (`prefers-color-scheme`) and keep tracking it until
// they pick one. The actual flip is just a `data-theme` attribute on <html> — every
// surface that uses a `var(--token)` updates automatically (tokens defined in
// index.css). The initial value is set PRE-PAINT by the inline script in
// index.html (no flash); this provider then owns it.
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'prospera_theme';

const ThemeContext = createContext({ theme: 'light', isDark: false, toggle: () => {}, setTheme: () => {} });

// Read whatever the pre-paint inline script already put on <html>.
function readInitial() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  const el = document.documentElement;
  el.setAttribute('data-theme', theme);
  el.style.colorScheme = theme;
}

const persist = (theme) => { try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode */ } };

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial);

  // Mirror state → the DOM attribute (in case anything set it out of band).
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Track the OS preference, but only while the user has made NO explicit choice.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      let saved = null;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
      if (saved !== 'light' && saved !== 'dark') setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t) => {
    const next = t === 'dark' ? 'dark' : 'light';
    persist(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((cur) => {
      const next = cur === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', toggle, setTheme }), [theme, toggle, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
