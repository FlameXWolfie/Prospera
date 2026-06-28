import CustomSections from './CustomSections';
import './css/MinimalTemplate.css';

// Minimal — editorial and spare: centered serif name, single column, hairline
// rules, lots of whitespace, accent used only on the role line. Authored at true
// A4 sizes (ResumePaper scales the whole page to fit). `data` is normalized;
// `matched` is a lowercased Set of skills to glow (add className "rmatch").
const EMPTY_SET = new Set();

export default function MinimalTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [data.email, data.phone, data.location, data.link].filter(Boolean);

  return (
    <div className="tpl-minimal" style={{ '--accent': accent }}>
      <header className="tplmin-head">
        <h1 className="tplmin-name">{data.name || 'Your Name'}</h1>
        <p className="tplmin-role">
          {data.role || 'Your Job Title'}
          {data.target && <span className="tplmin-target"> &middot; {data.target}</span>}
        </p>
        {contact.length > 0 && (
          <p className="tplmin-contact">
            {contact.map((t, i) => (
              <span key={i} className="tplmin-citem">
                {i > 0 && <span className="tplmin-dot">&middot;</span>}
                {t}
              </span>
            ))}
          </p>
        )}
      </header>

      {data.summary && (
        <section className="tplmin-sec">
          <h2 className="tplmin-h">Summary</h2>
          <p className="tplmin-summary">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="tplmin-sec">
          <h2 className="tplmin-h">Experience</h2>
          {data.experience.map((e, i) => (
            <div className="tplmin-entry" key={i}>
              <div className="tplmin-row">
                <span className="tplmin-title">{e.role}</span>
                <span className="tplmin-period">{e.period}</span>
              </div>
              <div className="tplmin-row tplmin-sub">
                <span className="tplmin-co">{e.company}</span>
                {e.location && <span className="tplmin-loc">{e.location}</span>}
              </div>
              {e.bullets.length > 0 && (
                <ul className="tplmin-bullets">
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="tplmin-sec">
          <h2 className="tplmin-h">Projects</h2>
          {data.projects.map((p, i) => (
            <div className="tplmin-entry" key={i}>
              <div className="tplmin-row">
                <span className="tplmin-title">{p.name}</span>
                {p.link && <span className="tplmin-plink">{p.link}</span>}
              </div>
              {p.bullets.length > 0 && (
                <ul className="tplmin-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="tplmin-sec">
          <h2 className="tplmin-h">Education</h2>
          {data.education.map((ed, i) => (
            <div className="tplmin-entry" key={i}>
              <div className="tplmin-row">
                <span className="tplmin-title">{ed.degree || ed.school}</span>
                <span className="tplmin-period">{ed.period}</span>
              </div>
              {ed.degree && ed.school && (
                <div className="tplmin-row tplmin-sub"><span className="tplmin-co">{ed.school}</span></div>
              )}
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="tplmin-sec">
          <h2 className="tplmin-h">Skills</h2>
          <div className="tplmin-skills">
            {data.skills.map((s) => (
              <span key={s} className={`tplmin-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
            ))}
          </div>
        </section>
      )}

      <CustomSections sections={data.sections} cx="tplmin" />
    </div>
  );
}
