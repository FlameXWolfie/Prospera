// Turn user-entered contact / project values into real hrefs so résumé links are
// clickable both in the live preview and the exported PDF (the PDF is just the
// rendered template — an <a href> in the markup becomes a clickable PDF link).

// A web URL → absolute href (adds https:// when no scheme); bare emails → mailto.
// Returns '' for blanks so callers can skip wrapping.
export function absUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(s)) return `mailto:${s}`;
  return `https://${s.replace(/^\/+/, '')}`;
}

export const mailto = (email) => {
  const s = String(email || '').trim();
  return s ? `mailto:${s}` : '';
};

export const tel = (phone) => {
  const s = String(phone || '').replace(/[^\d+]/g, '');
  return s ? `tel:${s}` : '';
};

// A short, human label for a project link, derived from its host — so links show
// as "Live" / "GitHub" instead of a raw URL (what recruiters expect). A code host
// → its name; anything else (a deployed app / personal domain) → "Live".
export function linkLabel(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  let host;
  try { host = new URL(absUrl(s)).hostname.replace(/^www\./, ''); } catch { return 'Link'; }
  if (host === 'github.com' || host.endsWith('.github.com')) return 'GitHub';
  if (host.endsWith('gitlab.com')) return 'GitLab';
  if (host.endsWith('bitbucket.org')) return 'Bitbucket';
  if (host.endsWith('youtube.com') || host === 'youtu.be') return 'Video';
  if (host.endsWith('figma.com')) return 'Figma';
  if (host.endsWith('dribbble.com')) return 'Dribbble';
  if (host.endsWith('behance.net')) return 'Behance';
  if (host.endsWith('npmjs.com')) return 'npm';
  if (host.endsWith('linkedin.com')) return 'LinkedIn';
  if (host.endsWith('medium.com') || host.endsWith('dev.to') || host.endsWith('hashnode.dev')) return 'Article';
  return 'Live'; // deployed app / personal site (incl. *.vercel.app, *.github.io, custom domains)
}
