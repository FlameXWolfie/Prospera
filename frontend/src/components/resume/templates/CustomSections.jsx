// Renders arbitrary resume sections (Achievements, Certifications, Awards,
// Publications, Languages, …) using a template's OWN prefix classes, so any
// layout stays consistent and no new CSS is needed. `cx` is the template's class
// prefix (e.g. "tplm"); entries reuse the same heading/meta/bullets markup as
// Experience/Projects. Returns null (renders nothing) when there are no sections.
export default function CustomSections({ sections = [], cx }) {
  if (!sections.length) return null;
  return sections.map((s, si) => (
    <section className={`${cx}-sec`} key={si}>
      <h2 className={`${cx}-h`}>{s.title}</h2>
      {s.entries.map((e, ei) => (
        <div className={`${cx}-entry`} key={ei}>
          {(e.heading || e.meta) && (
            <div className={`${cx}-entry-top`}>
              {e.heading && <span className={`${cx}-entry-role`}>{e.heading}</span>}
              {e.meta && <span className={`${cx}-entry-period`}>{e.meta}</span>}
            </div>
          )}
          {e.bullets.length > 0 && (
            <ul className={`${cx}-bullets`}>
              {e.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          )}
        </div>
      ))}
    </section>
  ));
}
