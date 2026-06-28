// Turn a resume's structured content into a LaTeX document for a print-perfect PDF
// (compiled by Tectonic — see resumeController.render). All user text is escaped so
// it can never break compilation or inject LaTeX commands; links use \href so the
// PDF has real clickable hyperlinks.

// Single-pass escape of every LaTeX special. Replacement strings aren't re-scanned,
// so this is correct in one pass.
const ESC = {
  '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
  '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
};
const tex = (s) => String(s == null ? '' : s).replace(/[\\&%$#_{}~^]/g, (c) => ESC[c]);

// href target: only %, #, \, & are problematic in hyperref's first arg.
const texUrl = (u) => String(u == null ? '' : u).trim().replace(/([\\%#&])/g, '\\$1');
const absUrl = (u) => {
  const l = String(u || '').trim();
  if (!l) return '';
  return /^(https?:|mailto:)/i.test(l) ? l : `https://${l}`;
};
const link = (url, label) => `\\href{${texUrl(absUrl(url))}}{${tex(label || url)}}`;

const isGroup = (s) => s && typeof s === 'object' && Array.isArray(s.items);
const hex = (c) => {
  const m = String(c || '').replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(m) ? m.toUpperCase() : '4F46E5';
};

function skillsTex(skills) {
  const list = Array.isArray(skills) ? skills : [];
  const out = [];
  const flat = [];
  for (const s of list) {
    if (typeof s === 'string') { if (s.trim()) flat.push(s); }
    else if (isGroup(s)) {
      const items = s.items.filter((i) => typeof i === 'string' && i.trim());
      if (items.length) out.push(`\\textbf{${tex(s.category || 'Skills')}:} ${items.map(tex).join(', ')}\\\\[2pt]`);
    }
  }
  if (flat.length) out.push(`${flat.map(tex).join(' \\textbullet{} ')}\\\\[2pt]`);
  return out.join('\n');
}

const bullets = (arr) => {
  const items = (arr || []).map((b) => String(b || '').trim()).filter(Boolean);
  if (!items.length) return '';
  return `\\begin{itemize}\n${items.map((b) => `  \\item ${tex(b)}`).join('\n')}\n\\end{itemize}`;
};

// entry with a bold left title, optional right-aligned meta, optional sub-line.
function entry(title, meta, sub, body) {
  const lines = [];
  lines.push(meta ? `\\textbf{${title}}\\hfill ${meta}` : `\\textbf{${title}}`);
  if (sub) lines.push(`\\\\\n\\textit{${sub}}`);
  let s = lines.join('');
  if (body) s += `\n${body}`;
  return `${s}\n\\vspace{5pt}`;
}

export function buildResumeTex(content, opts = {}) {
  const c = content || {};
  const accent = hex(opts.accent || c.accent);
  const role = [tex(c.role), c.target ? `\\textperiodcentered{} ${tex(c.target)}` : ''].filter(Boolean).join(' ');

  const contact = [];
  if (c.email) contact.push(link(`mailto:${c.email}`, c.email));
  if (c.phone) contact.push(tex(c.phone));
  if (c.location) contact.push(tex(c.location));
  if (c.link) contact.push(link(c.link, String(c.link).replace(/^https?:\/\//i, '')));

  const sec = (title, body) => (body && body.trim() ? `\\section{${tex(title)}}\n${body}\n` : '');

  // Experience
  const exp = (c.experience || []).map((e) => {
    const title = [tex(e.role), e.company ? `, ${tex(e.company)}` : ''].join('');
    const sub = e.location ? tex(e.location) : '';
    return entry(title || tex(e.company), tex(e.period), sub, bullets(e.bullets));
  }).join('\n');

  // Projects
  const proj = (c.projects || []).map((p) => {
    const right = p.link ? link(p.link, 'link') : '';
    return entry(tex(p.name), right, '', bullets(p.bullets));
  }).join('\n');

  // Education
  const edu = (c.education || []).map((e) => {
    const title = [tex(e.degree), e.school ? `, ${tex(e.school)}` : ''].join('');
    return entry(title || tex(e.school), tex(e.period), '', '');
  }).join('\n');

  // Dynamic custom sections (Achievements, Certifications, …)
  const custom = (c.sections || []).map((s) => {
    const entries = (s.entries || []).map((en) => {
      const head = tex(en.heading);
      const meta = tex(en.meta);
      const b = bullets(en.bullets);
      if (head || meta) return entry(head || meta, head ? meta : '', '', b);
      return b; // plain bullet list
    }).filter(Boolean).join('\n');
    return sec(s.title, entries);
  }).join('\n');

  const body = [
    sec('Summary', c.summary ? tex(c.summary) : ''),
    sec('Experience', exp),
    sec('Projects', proj),
    sec('Skills', skillsTex(c.skills)),
    sec('Education', edu),
    custom,
  ].filter(Boolean).join('\n');

  return `\\documentclass[11pt]{article}
\\usepackage[margin=0.55in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage[hidelinks]{hyperref}
\\definecolor{accent}{HTML}{${accent}}
\\hypersetup{colorlinks=true,urlcolor=accent,linkcolor=accent}
\\setlist[itemize]{leftmargin=1.25em,itemsep=1.5pt,topsep=2pt,parsep=0pt,label=\\textcolor{accent}{\\textbullet}}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\vspace{-6pt}\\textcolor{accent!40}{\\titlerule}]
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
\\begin{document}
\\begin{center}
{\\Huge\\bfseries ${tex(c.name) || 'Your Name'}}\\\\[3pt]
${role ? `{\\large\\color{accent}${role}}\\\\[5pt]` : ''}
${contact.length ? `{\\small ${contact.join(' \\quad\\textbar\\quad ')}}` : ''}
\\end{center}
\\vspace{4pt}
${body}
\\end{document}
`;
}
