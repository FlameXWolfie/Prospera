import { Mail, MapPin, Globe } from 'lucide-react';
import './css/ResumeDocument.css';

// Candidate identity for the preview — these are the signed-in user's resumes.
const CANDIDATE = { name: 'Alex Johnson', email: 'alex.johnson@mail.com', location: 'San Francisco, CA', linkedin: 'linkedin.com/in/alexjohnson' };

// A document-style preview of a resume. Shared by ATS Scan and Enhance Resume.
// `matchedSet` (lowercased skill set) glows matched skills; `highlight`
// ('summary' | 'experience' | 'skills') tints the active section.
export default function ResumeDocument({ resume, matchedSet, highlight }) {
  const exp = (resume.experience || []).slice(0, 3);
  const skills = resume.skills || [];
  const matched = matchedSet || new Set();
  const hl = (s) => `rd-sec${highlight === s ? ' hl' : ''}`;
  return (
    <div className="rd-doc" role="img" aria-label={`Preview of ${resume.role} resume`}>
      <div className="rd-head">
        <h3 className="rd-name">{CANDIDATE.name}</h3>
        <p className="rd-role">{resume.role}{resume.target ? ` · ${resume.target}` : ''}</p>
        <div className="rd-contact">
          <span><Mail size={11} /> {CANDIDATE.email}</span>
          <span><MapPin size={11} /> {CANDIDATE.location}</span>
          <span><Globe size={11} /> {CANDIDATE.linkedin}</span>
        </div>
      </div>

      {resume.summary && (
        <section className={hl('summary')}>
          <h4 className="rd-h">Summary</h4>
          <p className="rd-text">{resume.summary}</p>
        </section>
      )}

      {exp.length > 0 && (
        <section className={hl('experience')}>
          <h4 className="rd-h">Experience</h4>
          {exp.map((e, i) => (
            <div key={i} className="rd-exp">
              <div className="rd-exp-row">
                <span className="rd-exp-role">{e.role}</span>
                <span className="rd-exp-period">{e.period}</span>
              </div>
              <div className="rd-exp-co">{e.company}</div>
              <ul className="rd-bullets">
                {(e.bullets || []).slice(0, 3).map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className={hl('skills')}>
          <h4 className="rd-h">Skills</h4>
          <div className="rd-skills">
            {skills.map((s) => (
              <span key={s} className={`rd-skill${matched.has(s.toLowerCase()) ? ' hit' : ''}`}>{s}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
