import './css/SkillsSection.css';

// Renders CATEGORISED skills (Languages: C++, Python · Frameworks: React, …) for
// any template. The chips themselves reuse the template's own chip class
// (`chipClass`, e.g. "tplm-skill") so they match each layout; only the grouped
// layout + category label use shared `rskill-*` classes (one small CSS file, the
// CustomSections precedent). A group with an empty category renders its chips with
// no label. `matched` is a lowercased Set of skills to glow (className "rmatch").
//
// Templates use this ONLY when skills are grouped; a flat skill list keeps each
// template's existing chip markup (so there's zero visual change for flat resumes).
const EMPTY_SET = new Set();

export default function SkillGroups({ groups = [], chipClass = '', matched }) {
  const m = matched || EMPTY_SET;
  if (!groups.length) return null;
  return (
    <div className="rskill-groups">
      {groups.map((g, gi) => (
        <div className="rskill-group" key={gi}>
          {g.category && <span className="rskill-cat">{g.category}</span>}
          <span className="rskill-items">
            {g.items.map((s, si) => (
              <span key={si} className={`${chipClass}${m.has(s.toLowerCase()) ? ' rmatch' : ''}`}>{s}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
