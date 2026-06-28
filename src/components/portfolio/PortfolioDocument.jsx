import AuroraTemplate from './templates/AuroraTemplate';
import HorizonTemplate from './templates/HorizonTemplate';
import FolioTemplate from './templates/FolioTemplate';
import { normalizePortfolio, ensurePortfolioShape } from '../../lib/portfolio/portfolioModel';
import { getPath, setPath, updatePath, moveInArr } from '../../lib/portfolio/path';
import { EditableText } from './inlineEdit';
import './templates/css/shared.css';

// Static switch (no dynamic component variable) — React-compiler friendly.
// Templates always receive a `T(path, fallback)` text renderer + an `edit` object:
//  • view mode  → T returns a plain string, edit is null (no controls)
//  • edit mode  → T returns an inline contentEditable, edit has add/remove/move/set
function renderTpl(id, props) {
  switch (id) {
    case 'horizon': return <HorizonTemplate {...props} />;
    case 'folio': return <FolioTemplate {...props} />;
    case 'aurora':
    default: return <AuroraTemplate {...props} />;
  }
}

export default function PortfolioDocument({ portfolio = {}, template, accent, animate = false, editable = false, onChange }) {
  const id = template || portfolio.template || 'aurora';
  const ac = accent || portfolio.accent || '#f97316';

  if (editable && onChange) {
    // Render the RAW draft (unfiltered) so empty items stay editable.
    const data = ensurePortfolioShape(portfolio);
    const T = (path, fallback) => (
      <EditableText
        value={getPath(data, path)}
        placeholder={fallback || ''}
        onCommit={(v) => onChange((d) => setPath(d, path, v))}
        multiline={path === 'about' || /\.bullets\./.test(path)}
      />
    );
    const edit = {
      set: (path, value) => onChange((d) => setPath(d, path, value)),
      add: (field, item) => onChange((d) => setPath(d, field, [...(getPath(d, field) || []), item])),
      removeAt: (path, i) => onChange((d) => updatePath(d, path, (a) => a.filter((_, j) => j !== i))),
      moveAt: (path, i, dir) => onChange((d) => updatePath(d, path, (a) => moveInArr(a, i, dir))),
    };
    return renderTpl(id, { data, accent: ac, animate: false, T, edit });
  }

  const data = normalizePortfolio(portfolio);
  const T = (path, fallback) => { const v = getPath(data, path); return v || fallback || ''; };
  return renderTpl(id, { data, accent: ac, animate, T, edit: null });
}
