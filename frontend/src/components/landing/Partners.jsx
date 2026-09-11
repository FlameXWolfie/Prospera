import { Link2, Route, ShieldCheck } from 'lucide-react';
import './css/Partners.css';

const principles = [
  { icon: Link2, title: 'Context stays attached', detail: 'Role, draft, notes, and follow-up' },
  { icon: Route, title: 'The next step stays visible', detail: 'From saved role to final conversation' },
  { icon: ShieldCheck, title: 'You stay in control', detail: 'AI supports the edit, not your voice' },
];

export default function Partners() {
  return (
    <section className="principles-section" aria-label="DraftMe product principles">
      <p className="principles-statement">One workspace, not another pile of tabs.</p>
      <div className="principles-list">
        {principles.map(({ icon: Icon, title, detail }) => (
          <div className="principle-item" key={title}>
            <Icon size={17} strokeWidth={1.7} />
            <span><strong>{title}</strong><small>{detail}</small></span>
          </div>
        ))}
      </div>
    </section>
  );
}
