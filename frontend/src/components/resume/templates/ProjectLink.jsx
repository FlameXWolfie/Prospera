import { ExternalLink, FileText, Package } from 'lucide-react';
import { absUrl, linkLabel } from '../../../lib/resume/resumeLinks';

// A project's link as a compact, clickable label ("Live", "GitHub", …) with an
// icon, derived from the URL — instead of showing the raw URL. Clickable in the
// live preview AND the exported PDF (the PDF is the rendered template). Styled by
// `.rp-projlink` (ResumePaper.css / printDoc.js). The label text carries the
// meaning; the icon is decoration (lucide 1.x dropped brand icons).
const ICONS = { npm: Package, Article: FileText };

export default function ProjectLink({ url, className = '' }) {
  if (!url) return null;
  const label = linkLabel(url);
  const Icon = ICONS[label] || ExternalLink;
  return (
    <a className={`rp-projlink ${className}`.trim()} href={absUrl(url)} target="_blank" rel="noreferrer">
      <Icon className="rp-projlink-ico" strokeWidth={2.2} />
      {label}
    </a>
  );
}
