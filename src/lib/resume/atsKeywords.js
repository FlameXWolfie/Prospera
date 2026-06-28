// Deterministic keyword matcher behind the ATS Scan screen.
//
// There is no real NLP/AI here: a job description is scanned for terms from a
// curated skill vocabulary, then those detected terms are checked against the
// selected resume. The "match" is an honest keyword-overlap heuristic, not a
// black-box score — the UI labels it as such.

// Union of every skill used across the seed resumes plus common ATS terms,
// grouped only for readability. Multi-word and punctuated terms are matched
// whole (see `mentions`), so 'Java' never matches inside 'JavaScript'.
export const SKILL_VOCAB = [
  // Engineering
  'System Design', 'Microservices', 'REST APIs', 'REST', 'GraphQL', 'gRPC',
  'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'C#', 'Ruby',
  'Node.js', 'React', 'Vue', 'Angular', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS',
  'Spring Boot', 'Django', 'Express', 'Redux',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Git',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'BigQuery',
  // Data & Analytics
  'SQL', 'dbt', 'Tableau', 'Looker', 'Power BI', 'Excel', 'Machine Learning',
  'Data Modeling', 'ETL', 'Mixpanel', 'Analytics', 'A/B Testing', 'Experimentation',
  // Product
  'Roadmapping', 'Product Strategy', 'User Research', 'User Interviews', 'Jira',
  'OKRs', 'Stakeholder Management', 'Agile', 'Scrum', 'Go-to-Market', 'Growth Hacking',
  // Design
  'Figma', 'Sketch', 'Prototyping', 'Wireframing', 'Design Systems',
  'Usability Testing', 'Information Architecture', 'Accessibility', 'Interaction Design',
  // Marketing
  'SEO', 'SEM', 'Content Strategy', 'Google Ads', 'Meta Ads', 'TikTok Ads',
  'Email Marketing', 'Copywriting', 'CRO', 'HubSpot', 'Brand Strategy',
  // Cross-functional
  'Leadership', 'Communication', 'Cross-functional Collaboration', 'Mentorship',
  'Project Management', 'Roadmap', 'Budgeting',
];

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-term match: the term may not be flanked by another alphanumeric / + / #
// character, so 'java' will not hit 'javascript' and 'c' will not hit 'c++'.
function mentions(text, term) {
  const re = new RegExp(`(?<![a-z0-9+#])${escapeRe(term.toLowerCase())}(?![a-z0-9+#])`, 'i');
  return re.test(text);
}

// Flatten a resume into one lowercase searchable string.
function resumeCorpus(resume) {
  if (!resume) return '';
  const parts = [resume.role, resume.target, resume.summary, ...(resume.skills || [])];
  for (const exp of resume.experience || []) {
    parts.push(exp.role, exp.company, ...(exp.bullets || []));
  }
  for (const p of resume.projects || []) {
    parts.push(p.name, ...(p.bullets || []));
  }
  for (const s of resume.sections || []) {
    for (const e of s.entries || []) {
      parts.push(e.heading, e.meta, ...(e.bullets || []));
    }
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

// Pull every known skill that appears in a blob of text (e.g. an uploaded
// resume). Used to turn a raw file into a scannable resume object.
export function extractSkills(text) {
  const lower = (text || '').toLowerCase();
  const seen = new Set();
  return SKILL_VOCAB.filter((term) => {
    const key = term.toLowerCase();
    if (seen.has(key) || !mentions(lower, term)) return false;
    seen.add(key);
    return true;
  });
}

// Per-role competency baselines, used when the user scans without a specific job
// posting. Each role is a set of CATEGORIES, and a category is "covered" if the
// résumé mentions ANY of its equivalent terms — so a different-but-valid stack
// (Go/Node where the list happens to mention Java) isn't unfairly penalised. A
// single hardcoded keyword list can't capture "any backend language"; categories
// can. (When the Mistral key is set, the report uses AI's judgement instead —
// this is the offline fallback.)
export const ROLE_PROFILES = [
  { id: 'swe', label: 'Software Engineer', categories: [
    { label: 'Programming language', any: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Golang', 'C++', 'C#', 'Ruby', 'Rust'] },
    { label: 'Cloud platform', any: ['AWS', 'Azure', 'GCP'] },
    { label: 'Containers & orchestration', any: ['Docker', 'Kubernetes'] },
    { label: 'APIs', any: ['REST APIs', 'REST', 'GraphQL', 'gRPC'] },
    { label: 'Databases', any: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL', 'Redis'] },
    { label: 'System design', any: ['System Design', 'Microservices'] },
    { label: 'CI/CD & version control', any: ['CI/CD', 'Git'] },
  ] },
  { id: 'frontend', label: 'Frontend Engineer', categories: [
    { label: 'UI framework', any: ['React', 'Vue', 'Angular', 'Next.js'] },
    { label: 'Language', any: ['TypeScript', 'JavaScript'] },
    { label: 'Markup & styling', any: ['HTML', 'CSS', 'Tailwind CSS'] },
    { label: 'State management', any: ['Redux'] },
    { label: 'Accessibility', any: ['Accessibility'] },
    { label: 'Design tooling', any: ['Figma', 'Sketch'] },
    { label: 'CI/CD & version control', any: ['CI/CD', 'Git'] },
  ] },
  { id: 'backend', label: 'Backend Engineer', categories: [
    { label: 'Backend language', any: ['Java', 'Python', 'Go', 'Golang', 'Rust', 'C#', 'Node.js', 'Ruby'] },
    { label: 'Databases', any: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL', 'Redis'] },
    { label: 'APIs', any: ['REST APIs', 'REST', 'GraphQL', 'gRPC'] },
    { label: 'Cloud platform', any: ['AWS', 'Azure', 'GCP'] },
    { label: 'Containers & orchestration', any: ['Docker', 'Kubernetes'] },
    { label: 'System design', any: ['System Design', 'Microservices'] },
    { label: 'Messaging & streaming', any: ['Kafka'] },
  ] },
  { id: 'data', label: 'Data Analyst', categories: [
    { label: 'SQL & warehouses', any: ['SQL', 'PostgreSQL', 'MySQL', 'BigQuery'] },
    { label: 'Language', any: ['Python'] },
    { label: 'BI & visualization', any: ['Tableau', 'Looker', 'Power BI', 'Excel'] },
    { label: 'Analytics & experimentation', any: ['Analytics', 'A/B Testing', 'Experimentation', 'Mixpanel'] },
    { label: 'Data modeling & ETL', any: ['Data Modeling', 'ETL', 'dbt'] },
    { label: 'Communication', any: ['Communication'] },
  ] },
  { id: 'pm', label: 'Product Manager', categories: [
    { label: 'Roadmapping & strategy', any: ['Roadmapping', 'Roadmap', 'Product Strategy'] },
    { label: 'User research', any: ['User Research', 'User Interviews'] },
    { label: 'Experimentation', any: ['A/B Testing', 'Experimentation'] },
    { label: 'Goal setting', any: ['OKRs'] },
    { label: 'Stakeholder management', any: ['Stakeholder Management', 'Cross-functional Collaboration'] },
    { label: 'Agile tooling', any: ['Agile', 'Scrum', 'Jira'] },
    { label: 'Data fluency', any: ['SQL', 'Analytics'] },
    { label: 'Go-to-market', any: ['Go-to-Market'] },
  ] },
  { id: 'design', label: 'Product Designer', categories: [
    { label: 'Design tool', any: ['Figma', 'Sketch'] },
    { label: 'Prototyping', any: ['Prototyping', 'Wireframing'] },
    { label: 'User research', any: ['User Research', 'Usability Testing'] },
    { label: 'Design systems', any: ['Design Systems'] },
    { label: 'Information architecture', any: ['Information Architecture'] },
    { label: 'Accessibility', any: ['Accessibility'] },
    { label: 'Interaction design', any: ['Interaction Design'] },
  ] },
  { id: 'marketing', label: 'Marketing Manager', categories: [
    { label: 'SEO / SEM', any: ['SEO', 'SEM'] },
    { label: 'Paid ads', any: ['Google Ads', 'Meta Ads', 'TikTok Ads'] },
    { label: 'Content', any: ['Content Strategy', 'Copywriting'] },
    { label: 'Analytics', any: ['Analytics'] },
    { label: 'Email marketing', any: ['Email Marketing'] },
    { label: 'Conversion optimization', any: ['CRO'] },
    { label: 'Brand', any: ['Brand Strategy'] },
    { label: 'Martech tools', any: ['HubSpot'] },
  ] },
];

// Best-guess role profile for a resume, matched on its role/target text.
export function profileForResume(resume) {
  const text = `${resume?.role || ''} ${resume?.target || ''}`.toLowerCase();
  if (/front.?end|ui|web/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'frontend');
  if (/back.?end/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'backend');
  if (/data|analyt/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'data');
  if (/design|ux|ui/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'design');
  if (/market|growth|seo|brand/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'marketing');
  if (/product|pm\b/.test(text)) return ROLE_PROFILES.find((p) => p.id === 'pm');
  return ROLE_PROFILES[0];
}

// Core overlap: which of `detected` keywords appear in the resume.
// Returns { score, detected, matched, missing }; score is null when empty.
function matchKeywords(detected, resume) {
  const corpus = resumeCorpus(resume);
  const matched = [];
  const missing = [];
  for (const term of detected) {
    if (mentions(corpus, term)) matched.push(term);
    else missing.push(term);
  }
  const score = detected.length
    ? Math.round((matched.length / detected.length) * 100)
    : null;
  return { score, detected, matched, missing };
}

// Detect known skills mentioned in a job description, then match against resume.
export function scanResume(jobDescription, resume) {
  return matchKeywords(extractSkills(jobDescription), resume);
}

// Match a resume against a flat keyword list (no job posting needed). Kept for
// any caller that has a raw keyword array; role scans use scanRoleProfile.
export function scanRole(keywords, resume) {
  const seen = new Set();
  const detected = (keywords || []).filter((term) => {
    const key = term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return matchKeywords(detected, resume);
}

// Category-aware role match: each competency category counts as covered when the
// résumé mentions ANY of its equivalent terms, so a valid alternative stack isn't
// penalised. `matched` are the actual terms found; `missing` is one canonical term
// to add per uncovered competency (so "Add" suggestions stay concrete); `detected`
// is the list of competency labels. Score = covered categories / total.
export function scanRoleProfile(profile, resume) {
  const corpus = resumeCorpus(resume);
  const cats = (profile && profile.categories) || [];
  const matched = [];
  const missing = [];
  for (const c of cats) {
    const hit = (c.any || []).find((t) => mentions(corpus, t));
    if (hit) matched.push(hit);
    else if (c.any && c.any.length) missing.push(c.any[0]);
  }
  const score = cats.length ? Math.round((matched.length / cats.length) * 100) : null;
  return { score, detected: cats.map((c) => c.label), matched, missing };
}
