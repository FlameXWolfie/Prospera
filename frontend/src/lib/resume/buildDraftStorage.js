// Studio builder draft persistence. Scoped per user so a leftover draft from
// account A can never autosave-PATCH into account B's session (same browser).

import { emptyDraft } from './resumeDraft';

// Pre-scoping key — removed on every load so it can't leak across accounts.
const LEGACY_KEY = 'prospera_build_draft';
const keyFor = (userId) => `prospera_build_draft:${userId}`;

const dropLegacy = () => {
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* private mode */ }
};

/** Load this user's in-progress Studio draft, or a blank draft. */
export function loadBuildDraft(userId) {
  dropLegacy();
  if (!userId) return emptyDraft();
  try {
    const s = localStorage.getItem(keyFor(userId));
    if (s) return JSON.parse(s);
  } catch { /* ignore corrupt/blocked storage */ }
  return emptyDraft();
}

/** Persist the Studio draft under the signed-in user. */
export function saveBuildDraft(userId, draft) {
  if (!userId || !draft) return;
  dropLegacy();
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(draft));
  } catch { /* private mode */ }
}
