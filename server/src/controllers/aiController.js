import { mistralEnabled, mistralJSON, mistralOcr } from '../services/mistral.js';

// Skills are polymorphic (strings OR { category, items[] }) — flatten to a plain
// list for prompt text and matching.
function flatSkills(skills) {
  return (Array.isArray(skills) ? skills : []).flatMap((s) => (
    typeof s === 'string' ? [s] : (s && Array.isArray(s.items) ? s.items : [])
  )).filter(Boolean);
}

// Compact a resume object (or pass through a string) into prompt text.
function resumeToText(resume) {
  if (typeof resume === 'string') return resume.slice(0, 8000);
  const r = resume && typeof resume === 'object' ? resume : {};
  const lines = [];
  if (r.name) lines.push(r.name);
  if (r.role) lines.push(`Role: ${r.role}${r.target ? ` (target: ${r.target})` : ''}`);
  const contact = [r.email, r.phone, r.location, r.link].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  if (r.summary) lines.push(`\nSUMMARY\n${r.summary}`);
  if (Array.isArray(r.experience) && r.experience.length) {
    lines.push('\nEXPERIENCE');
    for (const e of r.experience.slice(0, 8)) {
      lines.push(`${e.role || ''}${e.company ? ` — ${e.company}` : ''}${e.period ? ` (${e.period})` : ''}`);
      for (const b of (e.bullets || []).slice(0, 8)) lines.push(`- ${b}`);
    }
  }
  if (Array.isArray(r.education) && r.education.length) {
    lines.push('\nEDUCATION');
    for (const ed of r.education.slice(0, 5)) lines.push(`${ed.degree || ''}${ed.school ? `, ${ed.school}` : ''}${ed.period ? ` (${ed.period})` : ''}`);
  }
  const skillList = flatSkills(r.skills);
  if (skillList.length) lines.push(`\nSKILLS\n${skillList.join(', ')}`);
  return lines.join('\n').slice(0, 8000);
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');

export const aiController = {
  // Lets the client decide whether to offer AI features / show the badge.
  status(req, res) {
    return res.json({ enabled: mistralEnabled() });
  },

  // ATS analysis of a resume against a target role or a pasted job description.
  async atsScan(req, res, next) {
    try {
      const { resume, jobDescription, role } = req.body || {};
      const resumeText = resumeToText(resume);
      if (!resumeText.trim()) return res.status(422).json({ error: 'A resume is required.' });
      const jd = str(jobDescription, 6000).trim();
      const target = jd ? `this job posting:\n${jd}` : `the role of "${str(role, 120) || 'the target role'}"`;
      const system = 'You are a strict ATS (applicant tracking system) and senior technical recruiter. Analyze a resume against a target and respond with ONLY valid JSON. Be specific and honest; do not inflate scores.';
      const user = `RESUME:\n${resumeText}\n\nTARGET: ${target}\n\nReturn JSON with this exact shape:\n{\n  "score": <integer 0-100 overall match>,\n  "verdict": "<one short sentence>",\n  "matchedKeywords": ["..."],\n  "missingKeywords": ["..."],\n  "sections": [{ "label": "Keywords|Skills|Experience|Impact|Summary", "score": <0-100>, "ok": <bool>, "advice": "<one actionable sentence>" }],\n  "suggestions": ["<3-6 prioritized, concrete improvements>"]\n}`;
      const result = await mistralJSON(
        [{ role: 'system', content: system }, { role: 'user', content: user }],
        { temperature: 0.2, maxTokens: 1500 },
      );
      return res.json({ result });
    } catch (err) {
      return next(err);
    }
  },

  // Parse an uploaded resume into structured fields. PDFs/images go through
  // Mistral OCR first (so scanned resumes work); pasted text skips OCR.
  async parseResume(req, res, next) {
    try {
      const { fileBase64, mimeType, text, links } = req.body || {};
      let docText = typeof text === 'string' ? text : '';
      let usedOcr = false;
      if (!docText.trim() && typeof fileBase64 === 'string' && fileBase64) {
        const mt = typeof mimeType === 'string' && mimeType ? mimeType : 'application/pdf';
        const isImage = mt.startsWith('image/');
        docText = await mistralOcr(`data:${mt};base64,${fileBase64}`, { image: isImage });
        usedOcr = true;
      }
      if (!docText.trim()) return res.status(422).json({ error: 'Could not read any text from that file.' });

      // Hyperlinks recovered from the PDF's annotation layer (the client reads them
      // with pdf.js — OCR/text extraction can't see them). Surface them so the model
      // can attach each to the right field instead of losing the URL.
      const linkHints = Array.isArray(links)
        ? links
            .filter((l) => l && typeof l.url === 'string' && l.url)
            .slice(0, 40)
            .map((l) => `- ${l.anchor ? `${String(l.anchor).slice(0, 80)} → ` : ''}${String(l.url).slice(0, 300)}`)
            .join('\n')
        : '';

      const system = 'You extract structured data from a resume. Respond with ONLY valid JSON. Never invent facts — use "" or [] when something is absent. Capture EVERY section of the resume, even unusual ones.';
      const user = `RESUME TEXT:\n${docText.slice(0, 14000)}${linkHints ? `\n\nHYPERLINKS (anchor text → URL) extracted from the PDF. These are REAL links that are often hidden behind a word or icon, so they may NOT appear in the text above:\n${linkHints}` : ''}\n\nReturn JSON with this exact shape:\n{\n  "name": "", "role": "<current or target job title>", "target": "<seniority/target, optional>",\n  "email": "", "phone": "", "location": "", "link": "<portfolio/linkedin/github>",\n  "summary": "",\n  "experience": [{ "company": "", "role": "", "period": "", "bullets": ["..."] }],\n  "education": [{ "school": "", "degree": "", "period": "" }],\n  "projects": [{ "name": "", "link": "", "bullets": ["..."] }],\n  "skills": ["a flat skill", { "category": "e.g. Languages", "items": ["..."] }],\n  "sections": [{ "title": "", "entries": [{ "heading": "", "meta": "", "bullets": ["..."] }] }]\n}\n\nRULES:\n- Put EVERY section that is NOT name/contact/summary/experience/skills/projects into "sections", keeping its real heading as "title" (e.g. Achievements, Certifications, Awards, Publications, Leadership, Volunteering, Coursework).\n- For each section entry: "heading" = the item's bold lead-in (or "" for a plain list), "meta" = date / issuer / tech / sub-line, "bullets" = the detail lines.\n- SKILLS: put ALL technical/professional skills in "skills". If the resume groups them under sub-labels (e.g. Languages, Frameworks, Databases, Tools), emit each group as { "category", "items": [...] }; otherwise a flat list of strings is fine. NEVER also create a "Skills"/"Technical Skills" entry in "sections" — that duplicates them.\n- Do not duplicate content between "sections" and the structured fields.\n- Use the HYPERLINKS list as the source of truth for URLs (they may be hidden behind a word/icon): put the LinkedIn/GitHub/portfolio link in "link" and a project's repo/demo link in that project's "link", matching by the anchor text. NEVER create a "Links"/"Hyperlinks"/"URLs" section, and never list raw URLs as their own entries/bullets; if a link doesn't fit a field, omit it. Never output a URL that is not in that list or the resume text.`;
      const result = await mistralJSON(
        [{ role: 'system', content: system }, { role: 'user', content: user }],
        { temperature: 0.1, maxTokens: 3000 },
      );
      return res.json({ result, usedOcr });
    } catch (err) {
      return next(err);
    }
  },

  // Resume enhancement: improved summary + bullet rewrites + missing skills.
  async enhance(req, res, next) {
    try {
      const { resume, target } = req.body || {};
      const resumeText = resumeToText(resume);
      if (!resumeText.trim()) return res.status(422).json({ error: 'A resume is required.' });
      const system = 'You are an expert resume writer. Rewrite content to be specific, quantified, active-voice and ATS-friendly. Never invent facts; improve phrasing of what is given. Respond with ONLY valid JSON.';
      const user = `RESUME:\n${resumeText}\n\nTARGET ROLE: ${str(target, 120) || 'general'}\n\nReturn JSON with this exact shape:\n{\n  "summary": "<improved 1-2 line professional summary>",\n  "bullets": [{ "original": "<existing bullet>", "improved": "<stronger, quantified rewrite>" }],\n  "missingSkills": ["<relevant skills the resume should add>"],\n  "tips": ["<2-4 high-impact tips>"]\n}\nOnly include bullets that exist in the resume (rewrite up to 8 of the weakest).`;
      const result = await mistralJSON(
        [{ role: 'system', content: system }, { role: 'user', content: user }],
        { temperature: 0.4, maxTokens: 1800 },
      );
      return res.json({ result });
    } catch (err) {
      return next(err);
    }
  },
};
