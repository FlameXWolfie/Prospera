import { useEffect, useRef } from 'react';

// Scroll-reveal: attach the returned ref to a template wrapper that has the
// `pf-animate` class; every descendant marked [data-reveal] fades/slides in when
// it scrolls into view (IntersectionObserver). Without `pf-animate` the reveal CSS
// doesn't apply, so the builder's static preview shows everything immediately.
// A fallback timer guarantees nothing stays hidden in a scaled/!IO environment.
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !root.classList.contains('pf-animate')) return undefined;
    const els = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!els.length) return undefined;
    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('pf-in'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
      els.forEach((el) => io.observe(el));
    } else {
      els.forEach((el) => el.classList.add('pf-in'));
    }
    // Safety net: reveal anything still hidden after a beat (covers odd scroll roots).
    const t = setTimeout(() => els.forEach((el) => el.classList.add('pf-in')), 2200);
    return () => { if (io) io.disconnect(); clearTimeout(t); };
  }, []);
  return ref;
}
