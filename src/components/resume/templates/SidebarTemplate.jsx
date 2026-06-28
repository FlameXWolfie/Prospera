import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import CustomSections from './CustomSections';
import './css/SidebarTemplate.css';

// Sidebar — two-column A4: a solid accent left rail (name, contact, skills,
// education) beside a white main column (summary, experience, projects).
// Authored at true A4 sizes (ResumePaper scales the whole page to fit).
// `data` is normalized; `matched` is a lowercased Set of skills to glow.
const EMPTY_SET = new Set();

export default function SidebarTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [
    data.email && { icon: Mail, text: data.email },
    data.phone && { icon: Phone, text: data.phone },
    data.location && { icon: MapPin, text: data.location },
    data.link && { icon: Globe, text: data.link },
  ].filter(Boolean);

  return (
    <div className="tpl-sidebar" style={{ '--accent': accent }}>
      <aside className="tpls-rail">
        <header className="tpls-head">
          <h1 className="tpls-name">{data.name || 'Your Name'}</h1>
          <p className="tpls-role">{data.role || 'Your Job Title'}</p>
          {data.target && <p className="tpls-target">{data.target}</p>}
        </header>

        {contact.length > 0 && (
          <section className="tpls-rail-sec">
            <h2 className="tpls-rail-h">Contact</h2>
            <ul className="tpls-contact">
              {contact.map((c, i) => {
                const Icon = c.icon;
                return (
                  <li key={i}>
                    <Icon size={13} strokeWidth={2.2} />
                    <span>{c.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {data.skills.length > 0 && (
          <section className="tpls-rail-sec">
            <h2 className="tpls-rail-h">Skills</h2>
            <div className="tpls-skills">
              {data.skills.map((s) => (
                <span key={s} className={`tpls-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section className="tpls-rail-sec">
            <h2 className="tpls-rail-h">Education</h2>
            {data.education.map((ed, i) => (
              <div className="tpls-edu" key={i}>
                <p className="tpls-edu-degree">{ed.degree || ed.school}</p>
                {ed.degree && ed.school && <p className="tpls-edu-school">{ed.school}</p>}
                {ed.period && <p className="tpls-edu-period">{ed.period}</p>}
              </div>
            ))}
          </section>
        )}
      </aside>

      <main className="tpls-main">
        {data.summary && (
          <section className="tpls-sec">
            <h2 className="tpls-h">Summary</h2>
            <p className="tpls-summary">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="tpls-sec">
            <h2 className="tpls-h">Experience</h2>
            {data.experience.map((e, i) => (
              <div className="tpls-entry" key={i}>
                <div className="tpls-entry-top">
                  <span className="tpls-entry-role">{e.role}</span>
                  <span className="tpls-entry-period">{e.period}</span>
                </div>
                <div className="tpls-entry-sub">
                  <span className="tpls-entry-co">{e.company}</span>
                  {e.location && <span className="tpls-entry-loc">{e.location}</span>}
                </div>
                {e.bullets.length > 0 && (
                  <ul className="tpls-bullets">
                    {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {data.projects.length > 0 && (
          <section className="tpls-sec">
            <h2 className="tpls-h">Projects</h2>
            {data.projects.map((p, i) => (
              <div className="tpls-entry" key={i}>
                <div className="tpls-entry-top">
                  <span className="tpls-entry-role">{p.name}</span>
                  {p.link && <span className="tpls-entry-period">{p.link}</span>}
                </div>
                {p.bullets.length > 0 && (
                  <ul className="tpls-bullets">
                    {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        <CustomSections sections={data.sections} cx="tpls" />
      </main>
    </div>
  );
}
