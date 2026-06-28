import { mistralEnabled, mistralJSON, mistralOcr } from '../services/mistral.js';

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
  if (Array.isArray(r.skills) && r.skills.length) lines.push(`\nSKILLS\n${r.skills.join(', ')}`);
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

  // Parse an uploaded résumé into structured fields. PDFs/images go through
  // Mistral OCR first (so scanned résumés work); pasted text skips OCR.
  async parseResume(req, res, next) {
    try {
      const { fileBase64, mimeType, text } = req.body || {};
      let docText = typeof text === 'string' ? text : '';
      let usedOcr = false;
      if (!docText.trim() && typeof fileBase64 === 'string' && fileBase64) {
        const mt = typeof mimeType === 'string' && mimeType ? mimeType : 'application/pdf';
        const isImage = mt.startsWith('image/');
        docText = await mistralOcr(`data:${mt};base64,${fileBase64}`, { image: isImage });
        usedOcr = true;
      }
      if (!docText.trim()) return res.status(422).json({ error: 'Could not read any text from that file.' });

      const system = 'You extract structured data from a résumé. Respond with ONLY valid JSON. Never invent facts — use "" or [] when something is absent. Capture EVERY section of the résumé, even unusual ones.';
      const user = `RÉSUMÉ TEXT:\n${docText.slice(0, 14000)}\n\nReturn JSON with this exact shape:\n{\n  "name": "", "role": "<current or target job title>", "target": "<seniority/target, optional>",\n  "email": "", "phone": "", "location": "", "link": "<portfolio/linkedin/github>",\n  "summary": "",\n  "experience": [{ "company": "", "role": "", "period": "", "bullets": ["..."] }],\n  "education": [{ "school": "", "degree": "", "period": "" }],\n  "projects": [{ "name": "", "link": "", "bullets": ["..."] }],\n  "skills": ["..."],\n  "sections": [{ "title": "", "entries": [{ "heading": "", "meta": "", "bullets": ["..."] }] }]\n}\n\nRULES:\n- Put EVERY section that is NOT name/contact/summary/experience/education/skills/projects into "sections", keeping its real heading as "title" (e.g. Achievements, Certifications, Awards, Publications, Leadership, Volunteering, Languages, Interests, Coursework).\n- For each section entry: "heading" = the item's bold lead-in (or "" for a plain list), "meta" = date / issuer / tech / sub-line, "bullets" = the detail lines.\n- Do not duplicate content between "sections" and the structured fields.`;
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
