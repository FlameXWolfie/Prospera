import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import CustomSections from './CustomSections';
import './css/ModernTemplate.css';

// Modern — left-aligned accent header, clean sans, single column. Authored at
// true A4 sizes (ResumePaper scales the whole page to fit). `data` is normalized;
// `matched` is a lowercased Set of skills to glow (add className "rmatch").
const EMPTY_SET = new Set();

export default function ModernTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [
    data.email && { icon: Mail, text: data.email },
    data.phone && { icon: Phone, text: data.phone },
    data.location && { icon: MapPin, text: data.location },
    data.link && { icon: Globe, text: data.link },
  ].filter(Boolean);

  return (
    <div className="tpl-modern" style={{ '--accent': accent }}>
      <header className="tplm-head">
        <h1 className="tplm-name">{data.name || 'Your Name'}</h1>
        <p className="tplm-role">{data.role || 'Your Job Title'}{data.target ? ` · ${data.target}` : ''}</p>
        {contact.length > 0 && (
          <div className="tplm-contact">
            {contact.map((c, i) => {
              const Icon = c.icon;
              return <span key={i}><Icon size={12} strokeWidth={2.2} /> {c.text}</span>;
            })}
          </div>
        )}
      </header>

      {data.summary && (
        <section className="tplm-sec">
          <h2 className="tplm-h">Summary</h2>
          <p className="tplm-summary">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="tplm-sec">
          <h2 className="tplm-h">Experience</h2>
          {data.experience.map((e, i) => (
            <div className="tplm-entry" key={i}>
              <div className="tplm-entry-top">
                <span className="tplm-entry-role">{e.role}</span>
                <span className="tplm-entry-period">{e.period}</span>
              </div>
              <div className="tplm-entry-sub">
                <span className="tplm-entry-co">{e.company}</span>
                {e.location && <span className="tplm-entry-loc">{e.location}</span>}
              </div>
              {e.bullets.length > 0 && (
                <ul className="tplm-bullets">
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="tplm-sec">
          <h2 className="tplm-h">Projects</h2>
          {data.projects.map((p, i) => (
            <div className="tplm-entry" key={i}>
              <div className="tplm-entry-top">
                <span className="tplm-entry-role">{p.name}</span>
                {p.link && <span className="tplm-entry-period">{p.link}</span>}
              </div>
              {p.bullets.length > 0 && (
                <ul className="tplm-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="tplm-sec">
          <h2 className="tplm-h">Education</h2>
          {data.education.map((ed, i) => (
            <div className="tplm-entry" key={i}>
              <div className="tplm-entry-top">
                <span className="tplm-entry-role">{ed.degree || ed.school}</span>
                <span className="tplm-entry-period">{ed.period}</span>
              </div>
              {ed.degree && ed.school && <div className="tplm-entry-sub"><span className="tplm-entry-co">{ed.school}</span></div>}
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="tplm-sec">
          <h2 className="tplm-h">Skills</h2>
          <div className="tplm-skills">
            {data.skills.map((s) => (
              <span key={s} className={`tplm-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
            ))}
          </div>
        </section>
      )}

      <CustomSections sections={data.sections} cx="tplm" />
    </div>
  );
}
