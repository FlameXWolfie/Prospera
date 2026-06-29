import { ArrowUpRight } from 'lucide-react';
import { useReveal } from './useReveal';
import { ItemControls, AddButton, ContactEditor, EditableText } from '../inlineEdit';
import { emptyExperience, emptyProject, emptyEducation } from '../../../lib/portfolio/portfolioModel';
import './css/HorizonTemplate.css';

// Module scope (not render) so the React compiler is happy with the Date call.
const YEAR = new Date().getFullYear();

const href = (link) => {
  const l = (link || '').trim();
  if (!l) return undefined;
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
};

const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'YN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Horizon — a premium two-column personal site: a sticky left intro rail and a
// scrolling right content column. Light, editorial, restrained; one accent
// (--pf-accent), hairline rules, monospace section labels, gentle scroll-reveal.
// `T(path, fallback)` renders text (plain in view mode, inline-editable in edit
// mode); `edit` (truthy only in edit mode) carries add/removeAt/moveAt/set for
// inline structural edits.
export default function HorizonTemplate({ data, accent, animate, T, edit }) {
  const ref = useReveal();
  const exp = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const education = data.education || [];
  const nav = [
    (data.about || edit) && { id: 'pfh-about', label: 'About' },
    (exp.length > 0 || edit) && { id: 'pfh-exp', label: 'Experience' },
    (projects.length > 0 || edit) && { id: 'pfh-projects', label: 'Projects' },
    (skills.length > 0 || edit) && { id: 'pfh-skills', label: 'Skills' },
  ].filter(Boolean);

  return (
    <div ref={ref} className={`pf-horizon${animate ? ' pf-animate' : ''}`} style={{ '--pf-accent': accent }}>
      <div className="pfh-shell">
        <aside className="pfh-rail">
          <span className="pfh-accent-line" aria-hidden="true" />
          <div className="pfh-rail-inner">
            <div className="pfh-rail-top">
              <span className="pfh-mono pfh-monogram" aria-hidden="true">{initials(data.name)}</span>
              <h1 className="pfh-name">{T('name', 'Your Name')}</h1>
              <p className="pfh-headline">{T('headline', 'Your Title')}</p>
              {(data.tagline || edit) && <p className="pfh-tagline">{T('tagline', 'One sharp line about what you do and the value you bring.')}</p>}
              {(data.location || edit) && (
                <span className="pfh-location"><span className="pfh-dot" aria-hidden="true" />{T('location', 'City, Country')}</span>
              )}
            </div>

            {nav.length > 0 && (
              <nav className="pfh-nav" aria-label="Sections">
                {nav.map((n, i) => (
                  <a className="pfh-nav-link" href={`#${n.id}`} key={n.id}>
                    <span className="pfh-nav-dash" aria-hidden="true" />
                    <span className="pfh-mono pfh-nav-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="pfh-nav-label">{n.label}</span>
                  </a>
                ))}
              </nav>
            )}

            <div className="pfh-rail-foot">
              {edit ? (
                <ContactEditor data={data} T={T} edit={edit} />
              ) : (
                <>
                  {data.email && (
                    <a className="pfh-contact" href={`mailto:${data.email}`}>
                      {data.email}
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                  {data.phone && <span className="pfh-contact-line">{data.phone}</span>}
                  {(data.socials.length > 0 || data.website) && (
                    <div className="pfh-socials">
                      {data.socials.map((s, i) => (
                        <a key={i} href={href(s.url)} target="_blank" rel="noreferrer">{s.label}</a>
                      ))}
                      {data.website && <a href={href(data.website)} target="_blank" rel="noreferrer">Website</a>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="pfh-main">
          {(data.about || edit) && (
            <section className="pfh-sec" id="pfh-about" data-reveal>
              <span className="pfh-mono pfh-label">01 / About</span>
              <p className="pfh-about">{T('about', 'Write a few sentences on who you are, what you build, and what you care about.')}</p>
            </section>
          )}

          {(exp.length > 0 || edit) && (
            <section className="pfh-sec" id="pfh-exp" data-reveal>
              <span className="pfh-mono pfh-label">02 / Experience</span>
              <div className="pfh-list">
                {exp.map((e, i) => (
                  <div className={`pfh-exp${edit ? ' pf-item' : ''}`} key={e._id || i} data-reveal>
                    {edit && <ItemControls onUp={() => edit.moveAt('experience', i, -1)} onDown={() => edit.moveAt('experience', i, 1)} onRemove={() => edit.removeAt('experience', i)} canUp={i > 0} canDown={i < exp.length - 1} />}
                    <div className="pfh-exp-head">
                      <div className="pfh-exp-title">
                        <span className="pfh-exp-role">{edit ? T(`experience.${i}.role`, 'Role') : (e.role || e.company)}</span>
                        {edit
                          ? <span className="pfh-exp-co"> · {T(`experience.${i}.company`, 'Company')}</span>
                          : (e.role && e.company && <span className="pfh-exp-co"> · {e.company}</span>)}
                      </div>
                      {(e.period || edit) && <span className="pfh-mono pfh-period">{T(`experience.${i}.period`, '2021 — Present')}</span>}
                    </div>
                    {(e.location || edit) && <span className="pfh-exp-loc">{T(`experience.${i}.location`, 'City, Country')}</span>}
                    {((e.bullets || []).length > 0 || edit) && (
                      <ul className="pfh-bullets">
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
            <section className="pfh-sec" id="pfh-projects" data-reveal>
              <span className="pfh-mono pfh-label">03 / Projects</span>
              <div className="pfh-projects">
                {projects.map((p, i) => {
                  const link = href(p.link);
                  const Tag = (!edit && link) ? 'a' : 'div';
                  return (
                    <Tag
                      key={p._id || i}
                      className={`pfh-proj${(!edit && link) ? ' is-link' : ''}${edit ? ' pf-item' : ''}`}
                      {...((!edit && link) ? { href: link, target: '_blank', rel: 'noreferrer' } : {})}
                      data-reveal
                    >
                      {edit && <ItemControls onUp={() => edit.moveAt('projects', i, -1)} onDown={() => edit.moveAt('projects', i, 1)} onRemove={() => edit.removeAt('projects', i)} canUp={i > 0} canDown={i < projects.length - 1} />}
                      <div className="pfh-proj-main">
                        <div className="pfh-proj-top">
                          <span className="pfh-proj-name">{T(`projects.${i}.name`, 'Project name')}</span>
                          {!edit && link && <ArrowUpRight size={18} className="pfh-proj-arrow" />}
                        </div>
                        {((p.bullets || [])[0] || edit) && <p className="pfh-proj-desc">{T(`projects.${i}.bullets.0`, 'What it is and the impact you made.')}</p>}
                        {((p.bullets || []).length > 1 || edit) && (
                          <ul className="pfh-bullets">
                            {(p.bullets || []).slice(1).map((b, j) => (
                              <li key={j} className={edit ? 'pf-item-li' : undefined}>
                                {T(`projects.${i}.bullets.${j + 1}`, 'Add a supporting detail.')}
                                {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt(`projects.${i}.bullets`, j + 1)} aria-label="Remove line">×</button>}
                              </li>
                            ))}
                            {edit && <li className="pf-li-add"><AddButton onClick={() => edit.add(`projects.${i}.bullets`, '')} label="Add detail" /></li>}
                          </ul>
                        )}
                        {edit && <div className="pf-proj-linkedit"><span>Link</span>{T(`projects.${i}.link`, 'github.com/you/project')}</div>}
                        {edit ? (
                          <EditableText value={(p.tags || []).join(', ')} placeholder="Tags, comma separated" onCommit={(v) => edit.set(`projects.${i}.tags`, v.split(',').map((t) => t.trim()).filter(Boolean))} />
                        ) : (p.tags.length > 0 && (
                          <div className="pfh-tags">{p.tags.map((t, j) => <span key={j} className="pfh-tag">{t}</span>)}</div>
                        ))}
                      </div>
                    </Tag>
                  );
                })}
                {edit && <AddButton onClick={() => edit.add('projects', emptyProject())} label="Add project" />}
              </div>
            </section>
          )}

          {(skills.length > 0 || edit) && (
            <section className="pfh-sec" id="pfh-skills" data-reveal>
              <span className="pfh-mono pfh-label">04 / Skills</span>
              <div className="pfh-skills">
                {skills.map((s, i) => (
                  <span key={i} className={`pfh-skill${edit ? ' pf-skill-edit' : ''}`}>
                    {T(`skills.${i}`, 'Skill')}
                    {edit && <button type="button" className="pf-li-x" contentEditable={false} onClick={() => edit.removeAt('skills', i)} aria-label="Remove">×</button>}
                  </span>
                ))}
              </div>
              {edit && <AddButton onClick={() => edit.add('skills', '')} label="Add skill" />}
            </section>
          )}

          {(education.length > 0 || edit) && (
            <section className="pfh-sec" data-reveal>
              <span className="pfh-mono pfh-label">05 / Education</span>
              <div className="pfh-list">
                {education.map((e, i) => (
                  <div className={`pfh-edu${edit ? ' pf-item' : ''}`} key={e._id || i}>
                    {edit && <ItemControls onUp={() => edit.moveAt('education', i, -1)} onDown={() => edit.moveAt('education', i, 1)} onRemove={() => edit.removeAt('education', i)} canUp={i > 0} canDown={i < education.length - 1} />}
                    <div className="pfh-exp-title">
                      <span className="pfh-exp-role">{edit ? T(`education.${i}.degree`, 'Degree') : (e.degree || e.school)}</span>
                      {edit
                        ? <span className="pfh-exp-co"> · {T(`education.${i}.school`, 'School')}</span>
                        : (e.degree && e.school && <span className="pfh-exp-co"> · {e.school}</span>)}
                    </div>
                    {(e.period || edit) && <span className="pfh-mono pfh-period">{T(`education.${i}.period`, '2015 — 2019')}</span>}
                  </div>
                ))}
                {edit && <AddButton onClick={() => edit.add('education', emptyEducation())} label="Add education" />}
              </div>
            </section>
          )}

          <footer className="pfh-footer" data-reveal>
            <span className="pfh-mono pfh-label">Contact</span>
            <h2 className="pfh-foot-h">Let’s work together.</h2>
            {!edit && data.email && <a className="pfh-foot-mail" href={`mailto:${data.email}`}>{data.email}</a>}
            <span className="pfh-foot-credit">© {YEAR} {data.name || 'Your Name'}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
