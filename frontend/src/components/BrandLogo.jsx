import { useId } from 'react';
import './BrandLogo.css';

export default function BrandLogo({ size = 38, className = '', showWordmark = true }) {
  const gradientId = useId();

  return (
    <span
      className={`brand-logo${className ? ` ${className}` : ''}`}
      style={{ '--brand-mark-size': `${size}px` }}
    >
      <svg
        className="brand-logo-mark"
        viewBox="0 0 48 48"
        role={showWordmark ? undefined : 'img'}
        aria-label={showWordmark ? undefined : 'DraftMe'}
        aria-hidden={showWordmark ? 'true' : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="5" y1="4" x2="43" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4338CA" />
            <stop offset="1" stopColor="#7065FF" />
          </linearGradient>
        </defs>
        <path fill={`url(#${gradientId})`} d="M6 4h19.2L42 20.8V27c0 9.4-7.6 17-17 17H6V4Z" />
        <path fill="#fff" fillOpacity=".96" d="M25.2 4 42 20.8H30.2a5 5 0 0 1-5-5V4Z" />
        <path fill="#fff" d="m12.1 35.9 3.2-8.3 12.9-12.9 5.1 5.1-12.9 12.9-8.3 3.2Zm5.2-6.7-1.1 2.7 2.7-1.1 10.7-10.7-1.6-1.6-10.7 10.7Z" />
      </svg>
      {showWordmark && <span className="brand-logo-word">DraftMe</span>}
    </span>
  );
}
