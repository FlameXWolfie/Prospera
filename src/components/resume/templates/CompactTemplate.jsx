import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import CustomSections from './CustomSections';
import SkillGroups from './SkillsSection';
import './css/CompactTemplate.css';

// Compact — full-width accent header, then a dense two-column body (skills +
// education left, experience + projects right). Authored at true A4 sizes
// (ResumePaper scales the whole page to fit). `data` is normalized; `matched`
// is a lowercased Set of skills to glow (add className "rmatch").
const EMPTY_SET = new Set();

export default function CompactTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [
    data.email && { icon: Mail, text: data.email },
    data.phone && { icon: Phone, text: data.phone },
    data.location && { icon: MapPin, text: data.location },
    data.link && { icon: Globe, text: data.link },
  ].filter(Boolean);

  const hasLeft = data.summary || data.skills.length > 0 || data.education.length > 0;
  const hasRight = data.experience.length > 0 || data.projects.length > 0 || data.sections.length > 0;

  return (
    <div className="tpl-compact" style={{ '--accent': accent }}>
      <header className="tplk-head">
        <div className="tplk-head-left">
          <h1 className="tplk-name">{data.name || 'Your Name'}</h1>
          <p className="tplk-role">{data.role || 'Your Job Title'}{data.target ? ` · ${data.target}` : ''}</p>
        </div>
        {contact.length > 0 && (
          <div className="tplk-contact">
            {contact.map((c, i) => {
              const Icon = c.icon;
              return <span key={i}><Icon size={11} strokeWidth={2.2} /> {c.text}</span>;
            })}
          </div>
        )}
      </header>

      {(hasLeft || hasRight) && (
        <div className="tplk-body">
          <div className="tplk-col">
            {data.summary && (
              <section className="tplk-sec">
                <h2 className="tplk-h">Profile</h2>
                <p className="tplk-summary">{data.summary}</p>
              </section>
            )}

            {data.skillGroups ? (
              <section className="tplk-sec">
                <h2 className="tplk-h">Skills</h2>
                <SkillGroups groups={data.skillGroups} chipClass="tplk-skill" matched={m} />
              </section>
            ) : data.skills.length > 0 && (
              <section className="tplk-sec">
                <h2 className="tplk-h">Skills</h2>
                <div className="tplk-skills">
                  {data.skills.map((s) => (
                    <span key={s} className={`tplk-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
                  ))}
                </div>
              </section>
            )}

            {data.education.length > 0 && (
              <section className="tplk-sec">
                <h2 className="tplk-h">Education</h2>
                {data.education.map((ed, i) => (
                  <div className="tplk-edu" key={i}>
                    <div className="tplk-edu-deg">{ed.degree || ed.school}</div>
                    {ed.degree && ed.school && <div className="tplk-edu-school">{ed.school}</div>}
                    {ed.period && <div className="tplk-edu-period">{ed.period}</div>}
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="tplk-col">
            {data.experience.length > 0 && (
              <section className="tplk-sec">
                <h2 className="tplk-h">Experience</h2>
                {data.experience.map((e, i) => (
                  <div className="tplk-entry" key={i}>
                    <div className="tplk-entry-top">
                      <span className="tplk-entry-role">{e.role}</span>
                      <span className="tplk-entry-period">{e.period}</span>
                    </div>
                    <div className="tplk-entry-sub">
                      <span className="tplk-entry-co">{e.company}</span>
                      {e.location && <span className="tplk-entry-loc">{e.location}</span>}
                    </div>
                    {e.bullets.length > 0 && (
                      <ul className="tplk-bullets">
                        {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            {data.projects.length > 0 && (
              <section className="tplk-sec">
                <h2 className="tplk-h">Projects</h2>
                {data.projects.map((p, i) => (
                  <div className="tplk-entry" key={i}>
                    <div className="tplk-entry-top">
                      <span className="tplk-entry-role">{p.name}</span>
                    </div>
                    {p.link && <div className="tplk-proj-link">{p.link}</div>}
                    {p.bullets.length > 0 && (
                      <ul className="tplk-bullets">
                        {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            <CustomSections sections={data.sections} cx="tplk" />
          </div>
        </div>
      )}
    </div>
  );
}
