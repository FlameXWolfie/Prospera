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
