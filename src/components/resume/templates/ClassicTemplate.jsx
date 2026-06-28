import CustomSections from './CustomSections';
import SkillGroups from './SkillsSection';
import './css/ClassicTemplate.css';

// Classic — traditional, formal, ATS-safe. Centered serif header, single column,
// full-width rules under header and each section title. Authored at true A4 sizes
// (ResumePaper scales the whole page to fit). `data` is normalized; `matched` is a
// lowercased Set of skills to glow (add className "rmatch").
const EMPTY_SET = new Set();

export default function ClassicTemplate({ data, accent, matched }) {
  const m = matched || EMPTY_SET;
  const contact = [data.email, data.phone, data.location, data.link].filter(Boolean);

  return (
    <div className="tpl-classic" style={{ '--accent': accent }}>
      <header className="tplc-head">
        <h1 className="tplc-name">{data.name || 'Your Name'}</h1>
        <p className="tplc-role">
          {data.role || 'Your Job Title'}{data.target ? ` · ${data.target}` : ''}
        </p>
        {contact.length > 0 && (
          <p className="tplc-contact">
            {contact.map((c, i) => (
              <span key={i} className="tplc-contact-item">
                {i > 0 && <span className="tplc-sep">&middot;</span>}
                {c}
              </span>
            ))}
          </p>
        )}
      </header>

      {data.summary && (
        <section className="tplc-sec">
          <h2 className="tplc-h">Summary</h2>
          <p className="tplc-summary">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="tplc-sec">
          <h2 className="tplc-h">Experience</h2>
          {data.experience.map((e, i) => (
            <div className="tplc-entry" key={i}>
              <div className="tplc-entry-top">
                <span className="tplc-entry-role">{e.role}</span>
                <span className="tplc-entry-period">{e.period}</span>
              </div>
              <div className="tplc-entry-sub">
                <span className="tplc-entry-co">{e.company}</span>
                {e.location && <span className="tplc-entry-loc">{e.location}</span>}
              </div>
              {e.bullets.length > 0 && (
                <ul className="tplc-bullets">
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="tplc-sec">
          <h2 className="tplc-h">Projects</h2>
          {data.projects.map((p, i) => (
            <div className="tplc-entry" key={i}>
              <div className="tplc-entry-top">
                <span className="tplc-entry-role">{p.name}</span>
                {p.link && <span className="tplc-entry-period">{p.link}</span>}
              </div>
              {p.bullets.length > 0 && (
                <ul className="tplc-bullets">
                  {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="tplc-sec">
          <h2 className="tplc-h">Education</h2>
          {data.education.map((ed, i) => (
            <div className="tplc-entry" key={i}>
              <div className="tplc-entry-top">
                <span className="tplc-entry-role">{ed.degree || ed.school}</span>
                <span className="tplc-entry-period">{ed.period}</span>
              </div>
              {ed.degree && ed.school && (
                <div className="tplc-entry-sub"><span className="tplc-entry-co">{ed.school}</span></div>
              )}
            </div>
          ))}
        </section>
      )}

      {data.skillGroups ? (
        <section className="tplc-sec">
          <h2 className="tplc-h">Skills</h2>
          <SkillGroups groups={data.skillGroups} chipClass="tplc-skill" matched={m} />
        </section>
      ) : data.skills.length > 0 && (
        <section className="tplc-sec">
          <h2 className="tplc-h">Skills</h2>
          <p className="tplc-skills">
            {data.skills.map((s, i) => (
              <span key={s} className={`tplc-skill${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>
                {i > 0 && <span className="tplc-skill-sep">&middot;</span>}
                {s}
              </span>
            ))}
          </p>
        </section>
      )}

      <CustomSections sections={data.sections} cx="tplc" />
    </div>
  );
}
