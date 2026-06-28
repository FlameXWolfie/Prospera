import { useRef, useState, useEffect } from 'react';
import './css/ResumePaper.css';

// Renders its children on a real A4 page (794×1123px @96dpi) and scales the whole
// page down to fit the available width — so the preview reads like a zoomed PDF,
// not an HTML card. Typography inside templates is authored at true document
// sizes (e.g. 10–11pt body) and scaled uniformly.
const A4_W = 794;
const A4_H = 1123;

export default function ResumePaper({ children, className = '' }) {
  const hostRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [pageH, setPageH] = useState(A4_H);

  useEffect(() => {
    const host = hostRef.current;
    const page = pageRef.current;
    if (!host || !page) return undefined;
    const measure = () => {
      const w = host.clientWidth;
      if (w > 0) setScale(w / A4_W);
      setPageH(page.offsetHeight);
    };
    // ResizeObserver fires once asynchronously after observe(), so we never call
    // measure() synchronously here (keeps react-compiler / set-state-in-effect happy).
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`rp-host ${className}`} ref={hostRef} style={{ height: Math.round(pageH * scale) }}>
      <div
        className="rp-page"
        ref={pageRef}
        style={{ transform: `scale(${scale})`, width: A4_W }}
      >
        {children}
      </div>
    </div>
  );
}
