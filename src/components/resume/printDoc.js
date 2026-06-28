// Builds a self-contained, print-ready HTML document for the chosen résumé
// template — the SAME React templates the on-screen editor renders, serialized to
// static HTML together with their (inlined) CSS. The server (headless Chrome,
// server/src/services/htmlPdf.js) turns this into the downloaded PDF, so the PDF
// is pixel-identical to the live preview, with real clickable links and clean A4
// pagination. One render engine for both editor and export — no LaTeX mismatch.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getTemplateComponent, normalizeResume } from './templates';

// Template CSS as strings (Vite `?inline` → processed CSS, NOT injected). Every
// class name is template-prefixed, so concatenating all templates' CSS is safe:
// only the rules for the rendered template match anything in the markup.
import modernCss from './templates/css/ModernTemplate.css?inline';
import minimalCss from './templates/css/MinimalTemplate.css?inline';
import classicCss from './templates/css/ClassicTemplate.css?inline';
import sidebarCss from './templates/css/SidebarTemplate.css?inline';
import compactCss from './templates/css/CompactTemplate.css?inline';
import timelineCss from './templates/css/TimelineTemplate.css?inline';
import skillsCss from './templates/css/SkillsSection.css?inline';

const TEMPLATE_CSS = [
  modernCss, minimalCss, classicCss, sidebarCss, compactCss, timelineCss, skillsCss,
].join('\n');

// Inter is the app's UI font (loaded via Google Fonts), so the PDF matches the
// editor exactly. Templates also use Georgia/Times — system serif, no web font
// needed. If the render host is offline the text falls back to system fonts.
const FONT_LINKS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap">';

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #fff; color: #111827;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow-wrap: anywhere; word-break: break-word;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  a { color: inherit; text-decoration: none; }
  /* Long dates / links / locations wrap instead of clipping (mirrors ResumePaper). */
  [class*="period"], [class*="link"], [class*="-loc"] {
    white-space: normal !important; overflow-wrap: anywhere;
  }
  /* Project links → compact accent-coloured clickable label ("Live"/"GitHub"/…). */
  a.rp-projlink {
    display: inline-flex; align-items: center; gap: 4px;
    color: var(--accent); font-weight: 600; text-decoration: none;
    font-size: 11.5px; white-space: nowrap;
  }
  .rp-projlink-ico { width: 1em; height: 1em; flex-shrink: 0; }`;

// Paged-media rules. Chrome's page.pdf() emulates the print media type, so these
// drive pagination of the real A4 document.
const PRINT_CSS = `
  @media print {
    html, body { margin: 0; padding: 0; }
    /* Keep a single experience / project / education entry intact across a break. */
    [class$="-entry"], [class$="-edu"] { break-inside: avoid; }
    /* A section heading stays with the content that follows it. */
    h1, h2, h3 { break-after: avoid; }
    p, li { orphans: 2; widows: 2; }
    /* Two-column Sidebar: the accent rail is fixed so it repeats on EVERY page
       (fixed elements paint per printed page) — the colored column never vanishes
       on page 2+ — while the main column flows normally down the pages. */
    .tpl-sidebar { display: block !important; }
    .tpl-sidebar .tpls-rail { position: fixed; top: 0; left: 0; bottom: 0; width: 34%; }
    .tpl-sidebar .tpls-main { margin-left: 34%; }
  }`;

const EMPTY = new Set();

// `content` is a resume content object (e.g. from resumeContentFromDraft) — it
// carries the structured fields plus `template` and `accent`.
export function buildResumePrintHtml(content = {}) {
  const tpl = content.template || 'modern';
  const Template = getTemplateComponent(tpl);
  const data = normalizeResume(content);
  const accent = content.accent || '#4f46e5';

  // Layout controls (must match the on-screen paged preview in ResumePaper):
  //  fontScale → render the template at width 794/s + CSS `zoom: s` (re-paginates
  //  in Chrome's page.pdf), so a smaller scale fits more per page.
  //  pageMargin → @page vertical margin on EVERY page (consistent top margin),
  //  plus the side-padding multiplier (--rt-mgx). Full-bleed templates → no
  //  vertical margin so the colored column still reaches the page edge.
  const s = content.fontScale > 0 ? content.fontScale : 1;
  const mg = content.pageMargin > 0 ? content.pageMargin : 1;
  const effW = Math.round(794 / s);
  const marginV = tpl === 'sidebar' ? 0 : Math.round(50 * mg);
  const layoutCss = `
    body { zoom: ${s}; --rt-w: ${effW}px; --rt-mgx: ${mg}; }
    @page { size: A4; margin: ${marginV}px 0; }
    /* per-page vertical margin comes from @page → drop the template's own */
    [class^="tpl-"] { padding-top: 0 !important; padding-bottom: 0 !important; }
  `;

  const markup = renderToStaticMarkup(createElement(Template, { data, accent, matched: EMPTY }));
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    FONT_LINKS +
    `<style>${BASE_CSS}${TEMPLATE_CSS}${PRINT_CSS}${layoutCss}</style>` +
    `</head><body>${markup}</body></html>`
  );
}
