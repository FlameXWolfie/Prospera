import { ArrowUpRight } from 'lucide-react';
import { useReveal } from './useReveal';
import { onSectionNavClick } from './sectionNav';
import { ItemControls, AddButton, ContactEditor, EditableText } from '../inlineEdit';
import { emptyExperience, emptyProject, emptyEducation } from '../../../lib/portfolio/portfolioModel';
import './css/AuroraTemplate.css';

// Module scope (not render) so the React compiler is happy with the Date call.
const YEAR = new Date().getFullYear();

const href = (link) => {
  const l = (link || '').trim();
  if (!l) return undefined;
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
};

// Aurora — minimal light personal site. `T(path, fallback)` renders text (plain in
// view mode, inline-editable in edit mode); `edit` (truthy only in edit mode)
// carries add/removeAt/moveAt/set for inline structural edits.
export default function AuroraTemplate({ data, accent, animate, T, edit }) {
  const ref = useReveal();
  const exp = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const education = data.education || [];
  return (
    <div ref={ref} className={`pf-aurora${animate ? ' pf-animate' : ''}`} style={{ '--pf-accent': accent }} onClick={onSectionNavClick}>
      <header className="pfa-topbar">
        <span className="pfa-brand">{T('name', 'Your Name')}</span>
        <nav className="pfa-nav">
          {exp.length > 0 && <a href="#pfa-work">Work</a>}
          {projects.length > 0 && <a href="#pfa-projects">Projects</a>}
          {(data.about || edit) && <a href="#pfa-about">About</a>}
          {data.email && <a className="pfa-nav-cta" href={`mailto:${data.email}`}>Contact</a>}
        </nav>
      </header>

      <section className="pfa-hero">
        <svg className="pfa-hero-grid" aria-hidden="true" width="100%" height="100%">
          <defs>
            <pattern id="pfaDots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pfaDots)" />
        </svg>
        <span className="pfa-hero-orb" aria-hidden="true" />
        <div className="pfa-hero-inner" data-reveal>
          {(data.location || edit) && <span className="pfa-eyebrow"><span className="pfa-dot" />{T('location', 'City, Country')}</span>}
          <h1 className="pfa-name">{T('name', 'Your Name')}</h1>
          <p className="pfa-headline">{T('headline', 'Your Title')}</p>
          {(data.tagline || edit) && <p className="pfa-tagline">{T('tagline', 'One sharp line about what you do and the value you bring.')}</p>}
          <div className="pfa-cta-row">
            {data.email && <a className="pfa-btn" href={`mailto:${data.email}`}>Get in touch <ArrowUpRight size={16} /></a>}
            {!edit && data.socials.map((s, i) => (
              <a key={i} className="pfa-btn ghost" href={href(s.url)} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </div>
        </div>
      </section>

      {(data.about || edit) && (
        <section className="pfa-sec" id="pfa-about" data-reveal>
          <h2 className="pfa-h"><span className="pfa-h-num">01</span> About</h2>
          <p className="pfa-about">{T('about', 'Write a few sentences on who you are, what you build, and what you care about.')}</p>
        </section>
      )}

      {(exp.length > 0 || edit) && (
        <section className="pfa-sec" id="pfa-work" data-reveal>
          <h2 className="pfa-h"><span className="pfa-h-num">02</span> Experience</h2>
          <div className="pfa-timeline">
            {exp.map((e, i) => (
              <div className={`pfa-exp${edit ? ' pf-item' : ''}`} key={e._id || i} data-reveal>
                {edit && <ItemControls onUp={() => edit.moveAt('experience', i, -1)} onDown={() => edit.moveAt('experience', i, 1)} onRemove={() => edit.removeAt('experience', i)} canUp={i > 0} canDown={i < exp.length - 1} />}
                <div className="pfa-exp-head">
                  <div className="pfa-exp-title">
                    <span className="pfa-exp-role">{T(`experience.${i}.role`, 'Role')}</span>
                    {edit
                      ? <span className="pfa-exp-co"> · {T(`experience.${i}.company`, 'Company')}</span>
                      : (e.company && <span className="pfa-exp-co"> · {e.company}</span>)}
                  </div>
                  {(e.period || edit) && <span className="pfa-exp-period">{T(`experience.${i}.period`, '2021 — Present')}</span>}
                </div>
                {((e.bullets || []).length > 0 || edit) && (
                  <ul className="pfa-bullets">
                    {(e.bullets || []).map((b, j) => (
                      <li key={j} className={edit ? 'pf-item-li' : undefined}>
                        {T(`experience.${i}.bullets.${j}`, 'Describe an outcome, ideally with a number.')}
                        {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt(`experience.${i}.bullets`, j)} aria-label="Remove line">×</button>}
                      </li>
                    ))}
                    {edit && <li className="pf-li-add"><AddButton onClick={() => edit.add(`experience.${i}.bullets`, '')} label="Add highlight" /></li>}
                  </ul>
                )}
              </div>
            ))}
            {edit && <AddButton onClick={() => edit.add('experience', emptyExperience())} label="Add role" />}
          </div>
        </section>
      )}

      {(projects.length > 0 || edit) && (
        <section className="pfa-sec" id="pfa-projects" data-reveal>
          <h2 className="pfa-h"><span className="pfa-h-num">03</span> Selected Projects</h2>
          <div className="pfa-projects">
            {projects.map((p, i) => {
              const link = href(p.link);
              const Tag = (!edit && link) ? 'a' : 'div';
              return (
                <Tag key={p._id || i} className={`pfa-proj${edit ? ' pf-item' : ''}`} {...((!edit && link) ? { href: link, target: '_blank', rel: 'noreferrer' } : {})} data-reveal>
                  {edit && <ItemControls onUp={() => edit.moveAt('projects', i, -1)} onDown={() => edit.moveAt('projects', i, 1)} onRemove={() => edit.removeAt('projects', i)} canUp={i > 0} canDown={i < projects.length - 1} />}
                  <div className="pfa-proj-top">
                    <span className="pfa-proj-name">{T(`projects.${i}.name`, 'Project name')}</span>
                    {!edit && link && <ArrowUpRight size={17} className="pfa-proj-arrow" />}
                  </div>
                  {((p.bullets || [])[0] || edit) && <p className="pfa-proj-desc">{T(`projects.${i}.bullets.0`, 'What it is and the impact you made.')}</p>}
                  {edit && <div className="pf-proj-linkedit"><span>Link</span>{T(`projects.${i}.link`, 'github.com/you/project')}</div>}
                  {edit ? (
                    <EditableText value={(p.tags || []).join(', ')} placeholder="Tags, comma separated" onCommit={(v) => edit.set(`projects.${i}.tags`, v.split(',').map((t) => t.trim()).filter(Boolean))} />
                  ) : (p.tags.length > 0 && (
                    <div className="pfa-tags">{p.tags.map((t, j) => <span key={j} className="pfa-tag">{t}</span>)}</div>
                  ))}
                </Tag>
              );
            })}
            {edit && <AddButton onClick={() => edit.add('projects', emptyProject())} label="Add project" />}
          </div>
        </section>
      )}

      {(skills.length > 0 || edit) && (
        <section className="pfa-sec" data-reveal>
          <h2 className="pfa-h"><span className="pfa-h-num">04</span> Skills &amp; Tools</h2>
          <div className="pfa-skills">
            {skills.map((s, i) => (
              <span key={i} className={`pfa-skill${edit ? ' pf-skill-edit' : ''}`}>
                {T(`skills.${i}`, 'Skill')}
                {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt('skills', i)} aria-label="Remove">×</button>}
              </span>
            ))}
          </div>
          {edit && <AddButton onClick={() => edit.add('skills', '')} label="Add skill" />}
        </section>
      )}

      {(education.length > 0 || edit) && (
        <section className="pfa-sec" data-reveal>
          <h2 className="pfa-h"><span className="pfa-h-num">05</span> Education</h2>
          {education.map((e, i) => (
            <div className={`pfa-edu${edit ? ' pf-item' : ''}`} key={e._id || i}>
              {edit && <ItemControls onUp={() => edit.moveAt('education', i, -1)} onDown={() => edit.moveAt('education', i, 1)} onRemove={() => edit.removeAt('education', i)} canUp={i > 0} canDown={i < education.length - 1} />}
              <div className="pfa-exp-title">
                <span className="pfa-exp-role">{T(`education.${i}.degree`, 'Degree')}</span>
                {edit
                  ? <span className="pfa-exp-co"> · {T(`education.${i}.school`, 'School')}</span>
                  : (e.degree && e.school && <span className="pfa-exp-co"> · {e.school}</span>)}
              </div>
              {(e.period || edit) && <span className="pfa-exp-period">{T(`education.${i}.period`, '2015 — 2019')}</span>}
            </div>
          ))}
          {edit && <AddButton onClick={() => edit.add('education', emptyEducation())} label="Add education" />}
        </section>
      )}

      <footer className="pfa-footer" data-reveal>
        <h2 className="pfa-foot-h">Let’s build something good.</h2>
        {edit ? (
          <ContactEditor data={data} T={T} edit={edit} />
        ) : (
          <>
            {data.email && <a className="pfa-foot-mail" href={`mailto:${data.email}`}>{data.email}</a>}
            <div className="pfa-foot-socials">
              {data.socials.map((s, i) => <a key={i} href={href(s.url)} target="_blank" rel="noreferrer">{s.label}</a>)}
              {data.website && <a href={href(data.website)} target="_blank" rel="noreferrer">Website</a>}
            </div>
          </>
        )}
        <span className="pfa-foot-credit">© {YEAR} {data.name || 'Your Name'}</span>
      </footer>
    </div>
  );
}
