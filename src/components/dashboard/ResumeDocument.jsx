import ResumePaper from '../resume/ResumePaper';
import { normalizeResume } from '../resume/templates';
import ModernTemplate from '../resume/templates/ModernTemplate';
import MinimalTemplate from '../resume/templates/MinimalTemplate';
import ClassicTemplate from '../resume/templates/ClassicTemplate';
import SidebarTemplate from '../resume/templates/SidebarTemplate';
import CompactTemplate from '../resume/templates/CompactTemplate';
import TimelineTemplate from '../resume/templates/TimelineTemplate';

// Renders a template by id with statically-referenced components (keeps the React
// compiler's static-components rule happy — no dynamic component variable).
function renderTemplate(id, props) {
  switch (id) {
    case 'minimal': return <MinimalTemplate {...props} />;
    case 'classic': return <ClassicTemplate {...props} />;
    case 'sidebar': return <SidebarTemplate {...props} />;
    case 'compact': return <CompactTemplate {...props} />;
    case 'timeline': return <TimelineTemplate {...props} />;
    case 'modern':
    default: return <ModernTemplate {...props} />;
  }
}

// Shared resume renderer: draws the chosen template on a real A4 page (via
// ResumePaper, which scales to fit) so previews read like a PDF, not an HTML card.
// `matchedSet` glows matched skills (ATS Scan / Enhance). `template`/`accent`
// override the resume's own saved values; both fall back to the template default.
const EMPTY = new Set();

export default function ResumeDocument({ resume = {}, matchedSet, template, accent }) {
  const tplId = template || resume.template || 'modern';
  const data = normalizeResume(resume);
  const ac = accent || resume.accent || '#4f46e5';

  return (
    <ResumePaper>
      {renderTemplate(tplId, { data, accent: ac, matched: matchedSet || EMPTY })}
    </ResumePaper>
  );
}
