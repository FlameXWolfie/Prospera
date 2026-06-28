// Portfolio template metadata (the picker reads this). The actual JSX render
// switch lives in PortfolioDocument.jsx (static component refs keep the React
// compiler happy), mirroring the resume templates setup.
export const PORTFOLIO_TEMPLATES = [
  { id: 'aurora', name: 'Aurora', blurb: 'Minimal light · airy whitespace · one accent' },
  { id: 'horizon', name: 'Horizon', blurb: 'Two-column · sticky intro rail · mono labels' },
  { id: 'folio', name: 'Folio', blurb: 'Project-forward · big type · editorial grid' },
];

export const PORTFOLIO_ACCENTS = ['#f97316', '#4f46e5', '#0ea5e9', '#10b981', '#e11d48', '#8b5cf6', '#0f172a'];

export function getPortfolioTemplateMeta(id) {
  return PORTFOLIO_TEMPLATES.find((t) => t.id === id) || PORTFOLIO_TEMPLATES[0];
}
