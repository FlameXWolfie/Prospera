import { ArrowUpRight } from 'lucide-react';
import { useReveal } from './useReveal';
import { onSectionNavClick } from './sectionNav';
import { ItemControls, AddButton, ContactEditor, EditableText } from '../inlineEdit';
import { emptyExperience, emptyProject, emptyEducation } from '../../../lib/portfolio/portfolioModel';
import './css/MosaicTemplate.css';

// Module scope (not render) so the React compiler is happy with the Date call.
const YEAR = new Date().getFullYear();

const href = (link) => {
  const l = (link || '').trim();
  if (!l) return undefined;
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
};

// Mosaic — minimal light personal site. `T(path, fallback)` renders text (plain in
// view mode, inline-editable in edit mode); `edit` (truthy only in edit mode)
// carries add/removeAt/moveAt/set for inline structural edits.
export default function MosaicTemplate({ data, accent, animate, T, edit }) {
  const ref = useReveal();
  const exp = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const education = data.education || [];
  return (
    <div ref={ref} className={`pf-mosaic${animate ? ' pf-animate' : ''}`} style={{ '--pf-accent': accent }} onClick={onSectionNavClick}>
      <header className="pfm-topbar">
        <span className="pfm-brand">{T('name', 'Your Name')}</span>
        <nav className="pfm-nav">
          {exp.length > 0 && <a href="#pfm-work">Work</a>}
          {projects.length > 0 && <a href="#pfm-projects">Projects</a>}
          {(data.about || edit) && <a href="#pfm-about">About</a>}
          {data.email && <a className="pfm-nav-cta" href={`mailto:${data.email}`}>Contact</a>}
        </nav>
      </header>

      <section className="pfm-hero">
        <svg className="pfm-hero-grid" aria-hidden="true" width="100%" height="100%">
          <defs>
            <pattern id="pfmDots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pfmDots)" />
        </svg>
        <span className="pfm-hero-orb" aria-hidden="true" />
        <div className="pfm-hero-inner" data-reveal>
          {(data.location || edit) && <span className="pfm-eyebrow"><span className="pfm-dot" />{T('location', 'City, Country')}</span>}
          <h1 className="pfm-name">{T('name', 'Your Name')}</h1>
          <p className="pfm-headline">{T('headline', 'Your Title')}</p>
          {(data.tagline || edit) && <p className="pfm-tagline">{T('tagline', 'One sharp line about what you do and the value you bring.')}</p>}
          <div className="pfm-cta-row">
            {data.email && <a className="pfm-btn" href={`mailto:${data.email}`}>Get in touch <ArrowUpRight size={16} /></a>}
            {!edit && data.socials.map((s, i) => (
              <a key={i} className="pfm-btn ghost" href={href(s.url)} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </div>
        </div>
      </section>

      {(data.about || edit) && (
        <section className="pfm-sec" id="pfm-about" data-reveal>
          <h2 className="pfm-h"><span className="pfm-h-num">01</span> About</h2>
          <p className="pfm-about">{T('about', 'Write a few sentences on who you are, what you build, and what you care about.')}</p>
        </section>
      )}

      {(exp.length > 0 || edit) && (
        <section className="pfm-sec" id="pfm-work" data-reveal>
          <h2 className="pfm-h"><span className="pfm-h-num">02</span> Experience</h2>
          <div className="pfm-timeline">
            {exp.map((e, i) => (
              <div className={`pfm-exp${edit ? ' pf-item' : ''}`} key={e._id || i} data-reveal>
                {edit && <ItemControls onUp={() => edit.moveAt('experience', i, -1)} onDown={() => edit.moveAt('experience', i, 1)} onRemove={() => edit.removeAt('experience', i)} canUp={i > 0} canDown={i < exp.length - 1} />}
                <div className="pfm-exp-head">
                  <div className="pfm-exp-title">
                    <span className="pfm-exp-role">{T(`experience.${i}.role`, 'Role')}</span>
                    {edit
                      ? <span className="pfm-exp-co"> · {T(`experience.${i}.company`, 'Company')}</span>
                      : (e.company && <span className="pfm-exp-co"> · {e.company}</span>)}
                  </div>
                  {(e.period || edit) && <span className="pfm-exp-period">{T(`experience.${i}.period`, '2021 — Present')}</span>}
                </div>
                {((e.bullets || []).length > 0 || edit) && (
                  <ul className="pfm-bullets">
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
        <section className="pfm-sec" id="pfm-projects" data-reveal>
          <h2 className="pfm-h"><span className="pfm-h-num">03</span> Selected Projects</h2>
          <div className="pfm-projects">
            {projects.map((p, i) => {
              const link = href(p.link);
              const Tag = (!edit && link) ? 'a' : 'div';
              return (
                <Tag key={p._id || i} className={`pfm-proj${edit ? ' pf-item' : ''}`} {...((!edit && link) ? { href: link, target: '_blank', rel: 'noreferrer' } : {})} data-reveal>
                  {edit && <ItemControls onUp={() => edit.moveAt('projects', i, -1)} onDown={() => edit.moveAt('projects', i, 1)} onRemove={() => edit.removeAt('projects', i)} canUp={i > 0} canDown={i < projects.length - 1} />}
                  <div className="pfm-proj-top">
                    <span className="pfm-proj-name">{T(`projects.${i}.name`, 'Project name')}</span>
                    {!edit && link && <ArrowUpRight size={17} className="pfm-proj-arrow" />}
                  </div>
                  {((p.bullets || [])[0] || edit) && <p className="pfm-proj-desc">{T(`projects.${i}.bullets.0`, 'What it is and the impact you made.')}</p>}
                  {edit && <div className="pf-proj-linkedit"><span>Link</span>{T(`projects.${i}.link`, 'github.com/you/project')}</div>}
                  {edit ? (
                    <EditableText value={(p.tags || []).join(', ')} placeholder="Tags, comma separated" onCommit={(v) => edit.set(`projects.${i}.tags`, v.split(',').map((t) => t.trim()).filter(Boolean))} />
                  ) : (p.tags.length > 0 && (
                    <div className="pfm-tags">{p.tags.map((t, j) => <span key={j} className="pfm-tag">{t}</span>)}</div>
                  ))}
                </Tag>
              );
            })}
            {edit && <AddButton onClick={() => edit.add('projects', emptyProject())} label="Add project" />}
          </div>
        </section>
      )}

      {(skills.length > 0 || edit) && (
        <section className="pfm-sec" data-reveal>
          <h2 className="pfm-h"><span className="pfm-h-num">04</span> Skills &amp; Tools</h2>
          <div className="pfm-skills">
            {skills.map((s, i) => (
              <span key={i} className={`pfm-skill${edit ? ' pf-skill-edit' : ''}`}>
                {T(`skills.${i}`, 'Skill')}
                {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt('skills', i)} aria-label="Remove">×</button>}
              </span>
            ))}
          </div>
          {edit && <AddButton onClick={() => edit.add('skills', '')} label="Add skill" />}
        </section>
      )}

      {(education.length > 0 || edit) && (
        <section className="pfm-sec" data-reveal>
          <h2 className="pfm-h"><span className="pfm-h-num">05</span> Education</h2>
          {education.map((e, i) => (
            <div className={`pfm-edu${edit ? ' pf-item' : ''}`} key={e._id || i}>
              {edit && <ItemControls onUp={() => edit.moveAt('education', i, -1)} onDown={() => edit.moveAt('education', i, 1)} onRemove={() => edit.removeAt('education', i)} canUp={i > 0} canDown={i < education.length - 1} />}
              <div className="pfm-exp-title">
                <span className="pfm-exp-role">{T(`education.${i}.degree`, 'Degree')}</span>
                {edit
                  ? <span className="pfm-exp-co"> · {T(`education.${i}.school`, 'School')}</span>
                  : (e.degree && e.school && <span className="pfm-exp-co"> · {e.school}</span>)}
              </div>
              {(e.period || edit) && <span className="pfm-exp-period">{T(`education.${i}.period`, '2015 — 2019')}</span>}
            </div>
          ))}
          {edit && <AddButton onClick={() => edit.add('education', emptyEducation())} label="Add education" />}
        </section>
      )}

      <footer className="pfm-footer" data-reveal>
        <h2 className="pfm-foot-h">Let’s build something good.</h2>
        {edit ? (
          <ContactEditor data={data} T={T} edit={edit} />
        ) : (
          <>
            {data.email && <a className="pfm-foot-mail" href={`mailto:${data.email}`}>{data.email}</a>}
            <div className="pfm-foot-socials">
              {data.socials.map((s, i) => <a key={i} href={href(s.url)} target="_blank" rel="noreferrer">{s.label}</a>)}
              {data.website && <a href={href(data.website)} target="_blank" rel="noreferrer">Website</a>}
            </div>
          </>
        )}
        <span className="pfm-foot-credit">© {YEAR} {data.name || 'Your Name'}</span>
      </footer>
    </div>
  );
}
