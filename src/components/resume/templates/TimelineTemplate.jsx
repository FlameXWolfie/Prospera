import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import CustomSections from './CustomSections';
import './css/TimelineTemplate.css';

// Timeline — single column with a left-aligned accent header and an Experience
// section rendered as a vertical timeline (continuous accent-toned rail with a
// filled accent dot at each entry). Authored at true A4 sizes (ResumePaper scales
// the whole page to fit). `data` is normalized; `matched` is a lowercased Set of
// skills to glow (add className "rmatch").
const EMPTY_SET = new Set();

export default function TimelineTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [
    data.email && { icon: Mail, text: data.email },
    data.phone && { icon: Phone, text: data.phone },
    data.location && { icon: MapPin, text: data.location },
    data.link && { icon: Globe, text: data.link },
  ].filter(Boolean);

  return (
    <div className="tpl-timeline" style={{ '--accent': accent }}>
      <header className="tplt-head">
        <h1 className="tplt-name">{data.name || 'Your Name'}</h1>
        <p className="tplt-role">{data.role || 'Your Job Title'}{data.target ? ` · ${data.target}` : ''}</p>
        {contact.length > 0 && (
          <div className="tplt-contact">
            {contact.map((c, i) => {
              const Icon = c.icon;
              return (
                <span className="tplt-contact-item" key={i}>
                  <Icon size={12} strokeWidth={2.2} /> {c.text}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {data.summary && (
        <section className="tplt-sec">
          <h2 className="tplt-h">Summary</h2>
          <p className="tplt-summary">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="tplt-sec">
          <h2 className="tplt-h">Experience</h2>
          <div className="tplt-tl">
            {data.experience.map((e, i) => (
              <div className="tplt-tl-entry" key={i}>
                <div className="tplt-tl-top">
                  <span className="tplt-tl-role">{e.role}</span>
                  <span className="tplt-tl-period">{e.period}</span>
                </div>
                <div className="tplt-tl-sub">
                  <span className="tplt-tl-co">{e.company}</span>
                  {e.location && <span className="tplt-tl-loc">{e.location}</span>}
                </div>
                {e.bullets.length > 0 && (
                  <ul className="tplt-bullets">
                    {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="tplt-sec">
          <h2 className="tplt-h">Projects</h2>
          {data.projects.map((p, i) => (
            <div className="tplt-entry" key={i}>
              <div className="tplt-entry-top">
                <span className="tplt-entry-role">{p.name}</span>
                {p.link && <span className="tplt-entry-period">{p.link}</span>}
              </div>
              {p.bullets.length > 0 && (
                <ul className="tplt-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="tplt-sec">
          <h2 className="tplt-h">Education</h2>
          {data.education.map((ed, i) => (
            <div className="tplt-entry" key={i}>
              <div className="tplt-entry-top">
                <span className="tplt-entry-role">{ed.degree || ed.school}</span>
                <span className="tplt-entry-period">{ed.period}</span>
              </div>
              {ed.degree && ed.school && (
                <div className="tplt-entry-sub"><span className="tplt-entry-co">{ed.school}</span></div>
              )}
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="tplt-sec">
          <h2 className="tplt-h">Skills</h2>
          <div className="tplt-skills">
            {data.skills.map((s) => (
              <span key={s} className={`tplt-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
            ))}
          </div>
        </section>
      )}

      <CustomSections sections={data.sections} cx="tplt" />
    </div>
  );
}
