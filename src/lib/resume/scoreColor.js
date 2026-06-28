// Shared ATS-score color band. Imported by both the dashboard ResumesGrid and
// the Resume Library so the same score never renders two different colors.
// Thresholds: 85+ is ATS-ready (success), 70-84 needs minor work (warning),
// below 70 needs attention (danger).

export function scoreColor(score) {
  if (score >= 85) return '#10b981'; // --success
  if (score >= 70) return '#f59e0b'; // --warning
  return '#ef4444'; // --danger
}

export function scoreBand(score) {
  if (score >= 85) return '85+';
  if (score >= 70) return '70-84';
  return '<70';
}

// A résumé's ATS score is only real once it has actually been scanned against a
// target (`scannedAt` is set server-side by POST /resumes/:id/scan). Until then
// there is NO score to show — returns null so the UI renders "Not scanned" rather
// than a fabricated number. Use this everywhere a per-résumé score is displayed.
export const scanScore = (resume) =>
  (resume && resume.scannedAt && typeof resume.score === 'number' ? resume.score : null);

// The résumé was scanned, but its content has changed since — the shown score is
// out of date until a re-scan. UIs should surface an "edited — re-scan" cue.
export const isScanStale = (resume) => Boolean(resume && resume.scannedAt && resume.scanStale);
