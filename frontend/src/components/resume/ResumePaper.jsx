import { useRef, useState, useEffect } from 'react';
import './css/ResumePaper.css';

// Renders its children on a real A4 page (794×1123px @96dpi) and scales the whole
// page down to fit the available width — so the preview reads like a zoomed PDF,
// not an HTML card.
//
// `paged` (Studio editor): split the content into real A4 SHEETS with gaps — like
// the PDF viewer — so the user sees the page count + where pages break BEFORE
// downloading. Breaks are snapped to element boundaries (an entry is never cut),
// mirroring the exported PDF.
//
// Layout controls (from the resume's saved settings, applied here AND in the
// exported PDF so they match):
//   fontScale — scales the whole document. We render the template at width
//     794/fontScale and scale-to-fit, so a smaller scale fits more per page (the
//     PDF achieves the same with CSS `zoom`). 1 = template default.
//   marginV  — vertical page margin in real (PDF) px, applied to EVERY page (fixes
//     continuation pages butting against the top edge). 0 for full-bleed templates.
//   marginX  — horizontal margin multiplier (scales the template's side padding).
const A4_W = 794;
const A4_H = 1123;
const GAP = 28; // gap between page sheets (unscaled px)

const HEAD_SEL = '[class$="-h"],[class$="-rail-h"]';
const ATOM_SEL = [
  '[class$="-head"]', '[class$="-entry"]', '[class$="-edu"]', '[class$="-tl-entry"]',
  '[class$="-h"]', '[class$="-rail-h"]', '[class$="-summary"]', '[class$="-skills"]',
  '.rskill-group',
].join(',');

// Greedy pagination: fill each page (up to `pageH`) until the next atomic block
// would overflow, then start a new page at that block's top. Returns
// [{ offset, height }] (unscaled px). Mirrors the PDF: blocks aren't split
// (break-inside:avoid) and a heading is kept with the block it introduces
// (break-after:avoid).
function computePages(root, pageH) {
  const total = root.scrollHeight || root.offsetHeight || pageH;
  const rootTop = root.getBoundingClientRect().top;
  const blocks = [...root.querySelectorAll(ATOM_SEL)]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - rootTop, bottom: r.bottom - rootTop, head: el.matches(HEAD_SEL) };
    })
    .sort((a, b) => a.top - b.top);

  const starts = [0];
  let pageStart = 0;
  let pageBottom = pageH;
  let prev = null;
  for (const b of blocks) {
    if (b.bottom <= pageBottom + 0.5) { prev = b; continue; }
    if (b.top > pageStart + 0.5) {
      const start = prev && prev.head && prev.top > pageStart + 0.5 && prev.bottom <= b.top + 0.5
        ? prev.top
        : b.top;
      pageStart = start;
      starts.push(pageStart);
      pageBottom = pageStart + pageH;
    }
    while (b.bottom > pageBottom + 0.5) { // block taller than a full page (rare)
      pageStart = pageBottom;
      starts.push(pageStart);
      pageBottom += pageH;
    }
    prev = b;
  }
  return starts.map((offset, i) => {
    const next = i + 1 < starts.length ? starts[i + 1] : total;
    return { offset, height: Math.min(pageH, Math.max(0, next - offset)) };
  });
}

export default function ResumePaper({
  children, className = '', paged = false, onPageCount,
  fontScale = 1, marginV = 0, marginX = 1,
}) {
  const hostRef = useRef(null);
  const pageRef = useRef(null); // non-paged single page (measured directly)
  const measureRef = useRef(null); // paged: hidden full-size copy used to measure breaks
  const [scale, setScale] = useState(0.5);
  const [pageH, setPageH] = useState(A4_H); // non-paged content height
  const [pages, setPages] = useState([{ offset: 0, height: A4_H }]); // paged slices

  const s = fontScale > 0 ? fontScale : 1;
  const effW = Math.round(A4_W / s); // template render width (scaled-to-fit below)
  const effH = Math.round(A4_H / s);
  const mEff = Math.round(marginV / s); // vertical page margin in this logical space
  const usable = Math.max(120, effH - 2 * mEff);
  // CSS vars the templates consume: render width + horizontal-margin multiplier.
  const vars = { '--rt-w': `${effW}px`, '--rt-mgx': marginX };

  // Scale the document to fit the host width.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      if (w > 0) setScale(w / effW);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, [effW]);

  // Measure content: paged → page slices off the hidden measurer; else → height.
  useEffect(() => {
    const el = paged ? measureRef.current : pageRef.current;
    if (!el) return undefined;
    const measure = () => {
      if (paged) {
        const p = computePages(el, usable);
        setPages(p);
        if (onPageCount) onPageCount(p.length);
      } else {
        setPageH(el.offsetHeight);
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paged, onPageCount, usable]);

  if (paged) {
    const totalH = pages.length * effH + (pages.length - 1) * GAP;
    return (
      <div className={`rp-host rp-host-paged ${className}`} ref={hostRef} style={{ ...vars, height: Math.round(totalH * scale) }}>
        {/* Hidden copy at true render width — drives the break measurement. */}
        <div className="rp-measure" ref={measureRef} style={{ width: effW }}>{children}</div>
        <div className="rp-stack" style={{ transform: `scale(${scale})`, width: effW }}>
          {pages.map((pg, i) => (
            <div
              className="rp-sheet"
              key={i}
              style={{ width: effW, height: effH, paddingTop: mEff, paddingBottom: mEff, marginBottom: i < pages.length - 1 ? GAP : 0 }}
            >
              <div className="rp-sheet-clip" style={{ height: pg.height }}>
                <div className="rp-sheet-shift" style={{ transform: `translateY(${-pg.offset}px)`, width: effW }}>{children}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rp-host ${className}`} ref={hostRef} style={{ ...vars, height: Math.round(pageH * scale) }}>
      <div className="rp-page" ref={pageRef} style={{ transform: `scale(${scale})`, width: effW }}>
        {children}
      </div>
    </div>
  );
}
