import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme/ThemeContext';

// Light/dark switch. Icon-only by default; pass showLabel for an icon+text pill
// (used in the landing header). Styling lives in index.css (.theme-toggle).
export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`theme-toggle${showLabel ? ' with-label' : ''}${className ? ` ${className}` : ''}`}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {showLabel && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
