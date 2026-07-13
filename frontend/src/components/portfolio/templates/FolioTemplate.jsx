import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useReveal } from './useReveal';
import { onSectionNavClick } from './sectionNav';
import { ItemControls, AddButton, ContactEditor, EditableText } from '../inlineEdit';
import { emptyExperience, emptyProject, emptyEducation } from '../../../lib/portfolio/portfolioModel';
import './css/FolioTemplate.css';

// Module scope (not render) so the React compiler is happy with the Date call.
const YEAR = new Date().getFullYear();

const href = (link) => {
  const l = (link || '').trim();
  if (!l) return undefined;
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
};

const pad = (n) => String(n).padStart(2, '0');

// Folio — wide, bold, editorial. Project-first: a very large display name,
// then Selected Work as the centerpiece grid, then experience as an editorial
// list, about, skills, education, and a strong closing contact. Light theme,
// neutrals + one accent (--pf-accent). No emoji, restrained, scroll-reveal.
// `T(path, fallback)` renders text (plain in view mode, inline-editable in edit
// mode); `edit` (truthy only in edit mode) carries add/removeAt/moveAt/set for
// inline structural edits.
export default function FolioTemplate({ data, accent, animate, T, edit }) {
  const ref = useReveal();
  const exp = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const education = data.education || [];
  const links = [
    ...data.socials.map((s) => ({ label: s.label, url: href(s.url) })),
    ...(data.website ? [{ label: 'Website', url: href(data.website) }] : []),
  ].filter((l) => l.url);

  return (
    <div ref={ref} className={`pf-folio${animate ? ' pf-animate' : ''}`} style={{ '--pf-accent': accent }} onClick={onSectionNavClick}>
      {/* Hero */}
      <header className="pff-hero">
        <svg className="pff-hero-grid" aria-hidden="true" width="100%" height="100%">
          <defs>
            <pattern id="pffGrid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pffGrid)" />
        </svg>
        <div className="pff-hero-inner" data-reveal>
          <div className="pff-hero-top">
            <span className="pff-eyebrow">
              <span className="pff-dot" aria-hidden="true" />
              {edit
                ? <>Based in {T('location', 'City, Country')}</>
                : (data.location ? `Based in ${data.location}` : 'Available for work')}
            </span>
            {data.email && (
              <a className="pff-hero-mail" href={`mailto:${data.email}`}>{data.email}</a>
            )}
          </div>
          <h1 className="pff-name">
            {T('name', 'Your Name')}
            <svg className="pff-underline" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 16 C 140 4, 300 4, 598 14" fill="none" stroke="var(--pf-accent)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </h1>
          {(data.headline || edit) && <p className="pff-headline">{T('headline', 'Your Title')}</p>}
          {(data.tagline || edit) && <p className="pff-tagline">{T('tagline', 'One sharp line about what you do and the value you bring.')}</p>}
          {(data.email || links.length > 0) && (
            <div className="pff-hero-links">
              {data.email && (
                <a className="pff-link-cta" href={`mailto:${data.email}`}>
                  Get in touch <ArrowUpRight size={16} />
                </a>
              )}
              {!edit && links.map((l, i) => (
                <a key={i} className="pff-link" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="pff-main">
        {/* Selected Work — the centerpiece, first */}
        {(projects.length > 0 || edit) && (
          <section className="pff-sec" id="pff-work" data-reveal>
            <div className="pff-sec-head">
              <span className="pff-sec-index" aria-hidden="true">{pad(1)}</span>
              <h2 className="pff-sec-title">Selected Work</h2>
              <span className="pff-sec-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="pff-projects">
              {projects.map((p, i) => {
                const link = href(p.link);
                const Tag = (!edit && link) ? 'a' : 'div';
                const rest = (p.bullets || []).slice(1);
                return (
                  <Tag
                    key={p._id || i}
                    className={`pff-proj${edit ? ' pf-item' : ''}`}
                    {...((!edit && link) ? { href: link, target: '_blank', rel: 'noreferrer' } : {})}
                    data-reveal
                  >
                    {edit && <ItemControls onUp={() => edit.moveAt('projects', i, -1)} onDown={() => edit.moveAt('projects', i, 1)} onRemove={() => edit.removeAt('projects', i)} canUp={i > 0} canDown={i < projects.length - 1} />}
                    <span className="pff-proj-num" aria-hidden="true">{pad(i + 1)}</span>
                    <div className="pff-proj-head">
                      <h3 className="pff-proj-name">{T(`projects.${i}.name`, 'Project name')}</h3>
                      <span className="pff-proj-arrow" aria-hidden="true"><ArrowRight size={20} /></span>
                    </div>
                    {((p.bullets || [])[0] || edit) && <p className="pff-proj-desc">{T(`projects.${i}.bullets.0`, 'What it is and the impact you made.')}</p>}
                    {(rest.length > 0 || edit) && (
                      <ul className="pff-proj-bullets">
                        {rest.map((b, j) => (
                          <li key={j} className={edit ? 'pf-item-li' : undefined}>
                            {T(`projects.${i}.bullets.${j + 1}`, 'A supporting detail or result.')}
                            {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt(`projects.${i}.bullets`, j + 1)} aria-label="Remove line">×</button>}
                          </li>
                        ))}
                        {edit && <li className="pf-li-add"><AddButton onClick={() => edit.add(`projects.${i}.bullets`, '')} label="Add line" /></li>}
                      </ul>
                    )}
                    {edit && <div className="pf-proj-linkedit"><span>Link</span>{T(`projects.${i}.link`, 'github.com/you/project')}</div>}
                    {edit ? (
                      <EditableText value={(p.tags || []).join(', ')} placeholder="Tags, comma separated" onCommit={(v) => edit.set(`projects.${i}.tags`, v.split(',').map((t) => t.trim()).filter(Boolean))} />
                    ) : (p.tags.length > 0 && (
                      <div className="pff-tags">{p.tags.map((t, j) => <span key={j} className="pff-tag">{t}</span>)}</div>
                    ))}
                  </Tag>
                );
              })}
              {edit && <AddButton onClick={() => edit.add('projects', emptyProject())} label="Add project" />}
            </div>
          </section>
        )}

        {/* Experience — editorial list */}
        {(exp.length > 0 || edit) && (
          <section className="pff-sec" id="pff-exp" data-reveal>
            <div className="pff-sec-head">
              <span className="pff-sec-index" aria-hidden="true">{pad(2)}</span>
              <h2 className="pff-sec-title">Experience</h2>
            </div>
            <div className="pff-exp-list">
              {exp.map((e, i) => (
                <div className={`pff-exp${edit ? ' pf-item' : ''}`} key={e._id || i} data-reveal>
                  {edit && <ItemControls onUp={() => edit.moveAt('experience', i, -1)} onDown={() => edit.moveAt('experience', i, 1)} onRemove={() => edit.removeAt('experience', i)} canUp={i > 0} canDown={i < exp.length - 1} />}
                  <div className="pff-exp-meta">
                    {(e.period || edit) && <span className="pff-exp-period">{T(`experience.${i}.period`, '2021 — Present')}</span>}
                    {(e.location || edit) && <span className="pff-exp-loc">{T(`experience.${i}.location`, 'City, Country')}</span>}
                  </div>
                  <div className="pff-exp-body">
                    <h3 className="pff-exp-role">{T(`experience.${i}.role`, 'Role')}</h3>
                    {edit
                      ? <span className="pff-exp-co">{T(`experience.${i}.company`, 'Company')}</span>
                      : (e.role && e.company && <span className="pff-exp-co">{e.company}</span>)}
                    {((e.bullets || []).length > 0 || edit) && (
                      <ul className="pff-bullets">
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
                </div>
              ))}
              {edit && <AddButton onClick={() => edit.add('experience', emptyExperience())} label="Add role" />}
            </div>
          </section>
        )}

        {/* About — large statement */}
        {(data.about || edit) && (
          <section className="pff-sec" id="pff-about" data-reveal>
            <div className="pff-sec-head">
              <span className="pff-sec-index" aria-hidden="true">{pad(3)}</span>
              <h2 className="pff-sec-title">About</h2>
            </div>
            <p className="pff-about">{T('about', 'Write a few sentences on who you are, what you build, and what you care about.')}</p>
          </section>
        )}

        {/* Skills — refined tag cluster */}
        {(skills.length > 0 || edit) && (
          <section className="pff-sec" data-reveal>
            <div className="pff-sec-head">
              <span className="pff-sec-index" aria-hidden="true">{pad(4)}</span>
              <h2 className="pff-sec-title">Capabilities</h2>
            </div>
            <div className="pff-skills">
              {skills.map((s, i) => (
                <span key={i} className={`pff-skill${edit ? ' pf-skill-edit' : ''}`}>
                  {T(`skills.${i}`, 'Skill')}
                  {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt('skills', i)} aria-label="Remove">×</button>}
                </span>
              ))}
            </div>
            {edit && <AddButton onClick={() => edit.add('skills', '')} label="Add skill" />}
          </section>
        )}

        {/* Education — compact */}
        {(education.length > 0 || edit) && (
          <section className="pff-sec" data-reveal>
            <div className="pff-sec-head">
              <span className="pff-sec-index" aria-hidden="true">{pad(5)}</span>
              <h2 className="pff-sec-title">Education</h2>
            </div>
            <div className="pff-edu-list">
              {education.map((e, i) => (
                <div className={`pff-edu${edit ? ' pf-item' : ''}`} key={e._id || i}>
                  {edit && <ItemControls onUp={() => edit.moveAt('education', i, -1)} onDown={() => edit.moveAt('education', i, 1)} onRemove={() => edit.removeAt('education', i)} canUp={i > 0} canDown={i < education.length - 1} />}
                  <div className="pff-edu-main">
                    <h3 className="pff-edu-deg">{T(`education.${i}.degree`, 'Degree')}</h3>
                    {edit
                      ? <span className="pff-edu-school">{T(`education.${i}.school`, 'School')}</span>
                      : (e.degree && e.school && <span className="pff-edu-school">{e.school}</span>)}
                  </div>
                  {(e.period || edit) && <span className="pff-edu-period">{T(`education.${i}.period`, '2015 — 2019')}</span>}
                </div>
              ))}
              {edit && <AddButton onClick={() => edit.add('education', emptyEducation())} label="Add education" />}
            </div>
          </section>
        )}
      </main>

      {/* Closing contact */}
      <footer className="pff-contact" id="pff-contact" data-reveal>
        <span className="pff-contact-label">{data.email ? 'Get in touch' : 'Thanks for visiting'}</span>
        <h2 className="pff-contact-h">Let&rsquo;s talk.</h2>
        {edit ? (
          <ContactEditor data={data} T={T} edit={edit} />
        ) : (
          <>
            {data.email && (
              <a className="pff-contact-mail" href={`mailto:${data.email}`}>
                {data.email} <ArrowUpRight size={28} />
              </a>
            )}
            <div className="pff-contact-row">
              {data.phone && <span className="pff-contact-item">{data.phone}</span>}
              {links.map((l, i) => (
                <a key={i} className="pff-contact-item" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
            </div>
          </>
        )}
        <span className="pff-credit">&copy; {YEAR} {data.name || 'Your Name'}</span>
      </footer>
    </div>
  );
}
