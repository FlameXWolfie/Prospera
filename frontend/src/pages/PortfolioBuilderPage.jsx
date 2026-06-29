import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, LayoutGrid, Eye, Download, CheckCircle2, X, ArrowLeft, FileText,
} from 'lucide-react';
import { PORTFOLIO_TEMPLATES, PORTFOLIO_ACCENTS, getPortfolioTemplateMeta } from '../components/portfolio/templates';
import { hasPortfolioContent, portfolioFromResume, portfolioDraft } from '../lib/portfolio/portfolioModel';
import { SAMPLE_RESUME } from '../lib/resume/resumeSample';
import PortfolioDocument from '../components/portfolio/PortfolioDocument';
import './css/PortfolioBuilderPage.css';

// A polished demo portfolio (from the shared sample resume) for gallery thumbnails
// and as a "start from sample" base.
const SAMPLE_PORTFOLIO = portfolioFromResume(SAMPLE_RESUME);

// Renders a portfolio at desktop width, scaled to fit its container (gallery
// thumbnails). Measuring runs in rAF / ResizeObserver callbacks, never in the
// effect body (react-compiler friendly).
function ScaledPreview({ children, width = 1180 }) {
  const hostRef = useRef(null);
  const pageRef = useRef(null);
  const [dims, setDims] = useState({ scale: 0.3, height: 360 });
  useEffect(() => {
    const host = hostRef.current;
    const page = pageRef.current;
    if (!host || !page) return undefined;
    const measure = () => {
      const w = host.clientWidth;
      const scale = w / width;
      setDims({ scale, height: page.scrollHeight * scale });
    };
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    ro.observe(page);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [children, width]);
  return (
    <div className="pfb-scale-host" ref={hostRef} style={{ height: dims.height }}>
      <div className="pfb-scale-page" ref={pageRef} style={{ width, transform: `scale(${dims.scale})` }}>
        {children}
      </div>
    </div>
  );
}

export default function PortfolioBuilderPage({ draft, onChange, resumes = [], saved, onPrefill }) {
  const d = draft || {};
  const contentful = hasPortfolioContent(d);
  // New users (no saved portfolio) start in the template gallery; returning users
  // (saved portfolio) drop straight into the editor.
  const [picking, setPicking] = useState(!saved);
  const [previewOpen, setPreviewOpen] = useState(false);

  const tplMeta = getPortfolioTemplateMeta(d.template);
  const galleryData = contentful ? d : SAMPLE_PORTFOLIO;

  const chooseTemplate = (id) => { onChange((p) => ({ ...p, template: id })); setPicking(false); };
  const loadSample = () => { onChange(() => portfolioDraft(SAMPLE_PORTFOLIO)); setPicking(false); };
  const handleExport = () => { setPreviewOpen(true); setTimeout(() => window.print(), 350); };

  // ── Gallery: pick a template (previewed with your content, or sample) ──
  if (picking) {
    return (
      <div className="pfb-page">
        <div className="pfb-gallery-head">
          <div>
            {saved && <button type="button" className="pfb-back" onClick={() => setPicking(false)}><ArrowLeft size={15} /> Back to editor</button>}
            <h1 className="pfb-gallery-title">Choose a template</h1>
            <p className="pfb-gallery-sub">Pick a layout, then edit everything directly on the page. Your content carries across templates.</p>
          </div>
          <div className="pfb-gallery-actions">
            {resumes.length > 0 && (
              <select className="pfb-select" aria-label="Fill from a resume" value="__" onChange={(e) => { if (e.target.value !== '__') { onPrefill(e.target.value); setPicking(false); } }}>
                <option value="__">Fill from a resume…</option>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.role || 'Resume'}</option>)}
              </select>
            )}
            {!contentful && <button type="button" className="pfb-btn ghost" onClick={loadSample}><Sparkles size={15} /> Start from sample</button>}
          </div>
        </div>
        <div className="pfb-gallery-grid">
          {PORTFOLIO_TEMPLATES.map((t) => (
            <div className={`pfb-gallery-card${d.template === t.id ? ' current' : ''}`} key={t.id}>
              <button type="button" className="pfb-gallery-thumb" onClick={() => chooseTemplate(t.id)} aria-label={`Use ${t.name}`}>
                <div className="pfb-gallery-thumb-inner">
                  <ScaledPreview><PortfolioDocument portfolio={galleryData} template={t.id} accent={d.accent} animate={false} /></ScaledPreview>
                </div>
              </button>
              <div className="pfb-gallery-meta">
                <div>
                  <span className="pfb-gallery-name">{t.name}</span>
                  <span className="pfb-gallery-blurb">{t.blurb}</span>
                </div>
                <button type="button" className="pfb-btn" onClick={() => chooseTemplate(t.id)}>Use</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Editor: edit the live portfolio directly ──
  return (
    <div className="pfb-page">
      <div className="pfb-toolbar">
        <div className="pfb-toolbar-left">
          <h1 className="pfb-title">Portfolio</h1>
          <span className="pfb-status">{saved ? <><CheckCircle2 size={13} /> Saved · autosaves</> : <>Draft</>}</span>
          <button type="button" className="pfb-tpl-toggle" onClick={() => setPicking(true)}>
            <LayoutGrid size={14} /> {tplMeta.name} · Change
          </button>
        </div>
        <div className="pfb-toolbar-right">
          <div className="pfb-accents">
            {PORTFOLIO_ACCENTS.map((c) => (
              <button key={c} type="button" className={`pfb-accent${d.accent === c ? ' active' : ''}`} style={{ background: c }} onClick={() => onChange((p) => ({ ...p, accent: c }))} aria-label={`Accent ${c}`} />
            ))}
          </div>
          {resumes.length > 0 && (
            <select className="pfb-select" aria-label="Fill from a resume" value="__" onChange={(e) => { if (e.target.value !== '__') onPrefill(e.target.value); }}>
              <option value="__">Fill from a resume…</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.role || 'Resume'}</option>)}
            </select>
          )}
          {!contentful && <button type="button" className="pfb-btn ghost" onClick={loadSample}><Sparkles size={15} /> Sample</button>}
          <button type="button" className="pfb-btn ghost" onClick={() => setPreviewOpen(true)}><Eye size={15} /> Preview</button>
          <button type="button" className="pfb-btn ghost" onClick={handleExport}><Download size={15} /> Export</button>
        </div>
      </div>

      <p className="pfb-edit-hint"><FileText size={13} /> Click any text to edit it. Hover a role, project or skill to reorder or remove it.</p>

      <div className="pfb-stage">
        <PortfolioDocument portfolio={d} template={d.template} accent={d.accent} editable onChange={onChange} />
      </div>

      {previewOpen && (
        <div className="pfb-fullscreen">
          <div className="pfb-fullscreen-bar">
            <span>{tplMeta.name} · preview</span>
            <div className="pfb-fullscreen-actions">
              <button type="button" className="pfb-mini" onClick={() => window.print()}><Download size={13} /> Export PDF</button>
              <button type="button" className="pfb-mini ghost" onClick={() => setPreviewOpen(false)}><X size={14} /> Close</button>
            </div>
          </div>
          <div className="pfb-fullscreen-scroll" id="pfb-print-area">
            <PortfolioDocument portfolio={contentful ? d : SAMPLE_PORTFOLIO} template={d.template} accent={d.accent} animate />
          </div>
        </div>
      )}
    </div>
  );
}
