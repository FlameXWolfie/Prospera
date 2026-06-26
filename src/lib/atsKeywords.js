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

// Common-keyword baselines per target role, used when the user scans without a
// specific job posting. These are the skills a strong resume for that role
// usually surfaces — a sensible default to measure against.
export const ROLE_PROFILES = [
  { id: 'swe', label: 'Software Engineer', keywords: ['System Design', 'Python', 'AWS', 'Docker', 'Kubernetes', 'REST APIs', 'CI/CD', 'PostgreSQL', 'Microservices', 'Git'] },
  { id: 'frontend', label: 'Frontend Engineer', keywords: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Accessibility', 'Next.js', 'Redux', 'CI/CD', 'Figma'] },
  { id: 'backend', label: 'Backend Engineer', keywords: ['System Design', 'Java', 'Python', 'SQL', 'Microservices', 'REST APIs', 'Kafka', 'Redis', 'Docker', 'Kubernetes'] },
  { id: 'data', label: 'Data Analyst', keywords: ['SQL', 'Python', 'Tableau', 'Excel', 'Analytics', 'A/B Testing', 'BigQuery', 'Data Modeling', 'Looker', 'Communication'] },
  { id: 'pm', label: 'Product Manager', keywords: ['Roadmapping', 'User Research', 'A/B Testing', 'OKRs', 'Stakeholder Management', 'Agile', 'Jira', 'Product Strategy', 'SQL', 'Go-to-Market'] },
  { id: 'design', label: 'Product Designer', keywords: ['Figma', 'Prototyping', 'User Research', 'Design Systems', 'Wireframing', 'Usability Testing', 'Accessibility', 'Information Architecture', 'Interaction Design', 'Sketch'] },
  { id: 'marketing', label: 'Marketing Manager', keywords: ['SEO', 'Content Strategy', 'Google Ads', 'Analytics', 'Email Marketing', 'Copywriting', 'CRO', 'Brand Strategy', 'HubSpot', 'Meta Ads'] },
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

// Match a resume against a role's baseline keywords (no job posting needed).
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
