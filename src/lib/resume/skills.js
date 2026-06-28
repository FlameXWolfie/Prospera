// Single source of truth for the SHAPE of a resume's skills.
//
// Skills are POLYMORPHIC: the stored/wire array holds either a bare string
// (a loose skill) OR a group `{ category, items: [string] }` (e.g. Languages:
// [C++, Python]). This lets a resume keep its real skill grouping — like Resume
// Worded / JSON Resume — instead of flattening everything into one chip soup or,
// worse, duplicating a "TECHNICAL SKILLS" block into a generic custom section.
//
// Every consumer goes through one of these helpers so the rest of the app never
// has to branch on the shape:
//   • flattenSkills  → string[]            (ATS keyword matching, counts, search)
//   • toSkillGroups  → [{category,items}]  (canonical groups for editing/render)
//   • fromSkillGroups→ wire array          (save: flat when no categories exist)
//   • normalizeSkillsForRender             ({flat, groups, grouped}) for templates
//   • foldSkillSectionsIntoSkills(parsed)  the deterministic de-dup safety net
//
// All pure (no Date/random) — safe to call from render/useMemo.

export const isSkillGroup = (x) =>
  Boolean(x) && typeof x === 'object' && !Array.isArray(x) && Array.isArray(x.items);

const cleanStr = (s) => (typeof s === 'string' ? s.trim() : '');

// Split "C++, Python | React" into ["C++", "Python", "React"]. Splits on commas /
// semicolons / pipes / bullets / newlines only — NOT slashes or parens, so
// "CI/CD", "TCP/IP" and "C++ (OOP)" survive as single skills.
export function splitSkillList(s) {
  return String(s || '')
    .split(/[,;|•·•\n\r]+/)
    .map((x) => x.replace(/^[\s•\-*•]+/, '').trim())
    .filter(Boolean)
    .slice(0, 60);
}

// Flat list of every skill, in order — for keyword matching, counts, search.
export function flattenSkills(skills) {
  const out = [];
  for (const s of Array.isArray(skills) ? skills : []) {
    if (typeof s === 'string') { const t = cleanStr(s); if (t) out.push(t); }
    else if (isSkillGroup(s)) { for (const it of s.items) { const t = cleanStr(it); if (t) out.push(t); } }
  }
  return out;
}

// Canonical groups for the editor/renderer: loose strings collected into one
// leading `category:''` group, then each real group in order. Tolerant of a flat
// array, a grouped array, or a mix (so a localStorage draft saved in the old flat
// shape upgrades transparently). Drops blanks.
export function toSkillGroups(skills) {
  const dedup = (arr) => {
    const seen = new Set();
    const out = [];
    for (const x of arr || []) {
      const t = cleanStr(x);
      const k = t.toLowerCase();
      if (t && !seen.has(k)) { seen.add(k); out.push(t); }
    }
    return out;
  };
  const loose = [];
  const named = [];
  for (const s of Array.isArray(skills) ? skills : []) {
    if (typeof s === 'string') { const t = cleanStr(s); if (t) loose.push(t); }
    else if (isSkillGroup(s)) named.push({ category: cleanStr(s.category), items: dedup(s.items) });
  }
  const groups = [];
  if (loose.length) groups.push({ category: '', items: dedup(loose) });
  for (const g of named) groups.push(g);
  return groups;
}

// Inverse, for SAVE: canonical groups → wire array. An empty-category group emits
// bare strings; a named group emits `{category, items}`. Dedupes case-insensitively
// across everything (first wins). Result is a pure string[] when no named group
// exists, so a resume with no categories stays flat (zero churn, no migration).
export function fromSkillGroups(groups) {
  const seen = new Set();
  const keep = (s) => { const k = s.toLowerCase(); if (!s || seen.has(k)) return false; seen.add(k); return true; };
  const out = [];
  const byCat = new Map(); // merge groups that share a category name into one
  for (const g of Array.isArray(groups) ? groups : []) {
    const category = cleanStr(g && g.category);
    const items = (Array.isArray(g && g.items) ? g.items : []).map(cleanStr).filter((i) => i && keep(i));
    if (!items.length) continue;
    if (!category) { for (const it of items) out.push(it); continue; }
    const key = category.toLowerCase();
    const existing = byCat.get(key);
    if (existing) existing.items.push(...items);
    else { const grp = { category, items: [...items] }; byCat.set(key, grp); out.push(grp); }
  }
  return out;
}

// Render view: a flat list (for the flat fallback + matched highlighting) plus the
// canonical groups and whether any real category exists (→ render grouped).
export function normalizeSkillsForRender(skills) {
  const groups = toSkillGroups(skills);
  return { flat: flattenSkills(skills), groups, grouped: groups.some((g) => g.category) };
}

// ── De-dup / fold ────────────────────────────────────────────────────────────
// A resume's skills can legitimately arrive as a flat list AND as a "TECHNICAL
// SKILLS" custom section (the parser/LLM emits both). This folds any skills-like
// section back INTO the skills field as groups and removes it from `sections`, so
// the same content never renders twice. Runs on BOTH the AI and heuristic parse
// results (client-side), so duplication is impossible regardless of AI on/off.

// A section TITLE that means "skills" (Skills / Technical Skills / Competencies /
// Tech stack / Tooling …) or a bare skill-category label the model may have
// promoted to its own section (Languages / Frameworks / Tools / Databases …).
const SKILLS_TITLE_RE = /^\s*(technical|core|key|professional|relevant|main|hard|soft|it|computer|programming)?\s*(skills?|competenc(?:y|ies)|technolog(?:y|ies)|tech\s*stack|tooling|toolbox|proficienc(?:y|ies))\b/i;
const CATEGORY_TITLE_RE = /^\s*(programming\s+)?(languages?|frameworks?(?:\s*&?\s*librar(?:y|ies))?|librar(?:y|ies)|tools?|technolog(?:y|ies)|databases?|platforms?|developer\s+tools|cloud|devops|version\s+control)\s*$/i;

export function isSkillsTitle(t) {
  const s = cleanStr(t);
  // Only fold sections that clearly MEAN "skills" (Skills / Technical Skills /
  // Competencies / Tech stack / Tooling). We deliberately do NOT fold a bare
  // category word like "Languages" or "Cloud" — a standalone "Languages" section
  // is usually spoken-language proficiency, and folding it into skill chips would
  // both mis-categorise it and delete the section. (CATEGORY_TITLE_RE is still used
  // below to LABEL loose items inside a confirmed skills section.)
  return Boolean(s) && SKILLS_TITLE_RE.test(s);
}

const splitLabel = (line) => {
  const m = String(line).match(/^(.{1,40}?)\s*[:：]\s*(.+)$/);
  return m ? [m[1].trim(), m[2].trim()] : [null, null];
};

// Turn a skills-like section (title + entries) into skill groups. Handles the
// common shapes: entry heading = category + bullets are its skills; "Label: a, b"
// lines; or a bare list of skills under the section title.
function sectionToSkillGroups(section) {
  const title = cleanStr(section && section.title);
  const named = [];
  const loose = [];
  for (const e of (section && section.entries) || []) {
    const heading = cleanStr(e && e.heading);
    const lineItems = splitSkillList([...((e && e.bullets) || []), (e && e.meta) || ''].filter(Boolean).join(', '));
    if (heading && lineItems.length) {
      named.push({ category: heading.replace(/[:：]\s*$/, ''), items: lineItems });
    } else if (heading) {
      const [cat, rest] = splitLabel(heading);
      if (cat && rest) named.push({ category: cat, items: splitSkillList(rest) });
      else loose.push(...splitSkillList(heading));
    } else {
      for (const ln of [...((e && e.bullets) || []), (e && e.meta) || ''].filter(Boolean)) {
        const [cat, rest] = splitLabel(ln);
        if (cat && rest) named.push({ category: cat, items: splitSkillList(rest) });
        else loose.push(...splitSkillList(ln));
      }
    }
  }
  const groups = [];
  if (loose.length) {
    // If the SECTION title is itself a category label (e.g. "Languages"), credit
    // the loose items to it rather than leaving them uncategorised.
    groups.push(CATEGORY_TITLE_RE.test(title) ? { category: title, items: loose } : { category: '', items: loose });
  }
  for (const g of named) if (g.items.length) groups.push(g);
  return groups;
}

export function foldSkillSectionsIntoSkills(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const skillSections = sections.filter((s) => isSkillsTitle(s && s.title));
  if (!skillSections.length) return parsed;

  let groups = [];
  for (const sec of skillSections) groups = groups.concat(sectionToSkillGroups(sec));

  // Carry over any pre-existing flat/grouped skills NOT already covered by the
  // section groups (so a skill listed only in the flat array isn't lost).
  const covered = new Set(groups.flatMap((g) => g.items.map((i) => i.toLowerCase())));
  const existing = flattenSkills(parsed.skills).filter((s) => !covered.has(s.toLowerCase()));
  const named = groups.filter((g) => g.category);
  const looseFromGroups = groups.filter((g) => !g.category).flatMap((g) => g.items);
  const loose = [...existing, ...looseFromGroups];

  const canonical = [];
  if (loose.length) canonical.push({ category: '', items: loose });
  canonical.push(...named);

  return {
    ...parsed,
    skills: fromSkillGroups(canonical),
    sections: sections.filter((s) => !isSkillsTitle(s && s.title)),
  };
}

// ── Heuristic parser helpers (used by resumeParse for pasted/.txt résumés) ─────

const isBulletLine = (l) => /^[\s•\-*▪◦·‣•]/.test(l);

// Parse the lines of a (known) skills section into groups. Detects "Label: a, b"
// lines, a sub-heading line followed by its skills, or a bare list. A would-be
// category that ends up with no items is treated as a skill itself (never dropped).
export function extractSkillGroups(lines) {
  const collected = []; // ordered [{category, items}]
  const loose = [];
  let current = null;
  for (const raw of lines || []) {
    const line = cleanStr(raw);
    if (!line) continue;
    const [cat, rest] = splitLabel(line);
    if (cat && rest) { collected.push({ category: cat, items: splitSkillList(rest) }); current = null; continue; }
    if (isBulletLine(raw)) { const items = splitSkillList(raw); (current ? current.items : loose).push(...items); continue; }
    if (line.length <= 40 && !/[,;|]/.test(line)) { current = { category: line.replace(/[:：]\s*$/, ''), items: [] }; collected.push(current); continue; }
    const items = splitSkillList(line);
    (current ? current.items : loose).push(...items);
  }
  const named = [];
  const looseExtra = [];
  for (const g of collected) {
    if (g.items.length) named.push(g);
    else if (g.category) looseExtra.push(g.category); // was a skill, not a label
  }
  const allLoose = [...loose, ...looseExtra];
  const groups = [];
  if (allLoose.length) groups.push({ category: '', items: allLoose });
  for (const g of named) groups.push(g);
  return groups;
}

// Merge parsed skill groups with vocabulary hits found elsewhere in the document
// (so a skill mentioned only in a bullet still counts), deduped, → wire array.
export function mergeSkills(groups, vocabFlat) {
  const list = (Array.isArray(groups) ? groups : [])
    .map((g) => ({ category: cleanStr(g && g.category), items: Array.isArray(g && g.items) ? g.items : [] }));
  const named = list.filter((g) => g.category && g.items.length);
  const looseFromGroups = list.filter((g) => !g.category).flatMap((g) => g.items);
  const covered = new Set(list.flatMap((g) => g.items.map((i) => String(i).toLowerCase())));
  const extras = (vocabFlat || []).filter((s) => !covered.has(String(s).toLowerCase()));
  const loose = [...looseFromGroups, ...extras];
  const canonical = [];
  if (loose.length) canonical.push({ category: '', items: loose });
  canonical.push(...named);
  return fromSkillGroups(canonical);
}
