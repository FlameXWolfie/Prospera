// In-memory cache of original-PDF data URIs, keyed by resume id.
//
// When a résumé is uploaded we already hold its bytes in the browser, so we stash
// the data URI here keyed by the server id. The preview then renders instantly
// without a round-trip to GET /resumes/:id/file (which would otherwise refetch a
// PDF we literally just sent). It also caches files fetched for saved resumes so
// re-selecting one doesn't refetch. Cleared on full reload — that's fine, the
// preview falls back to the lazy fetch.
const cache = new Map();

export const cachePdfDataUri = (id, uri) => {
  if (id && uri) cache.set(String(id), uri);
};

export const getCachedPdfDataUri = (id) => (id ? cache.get(String(id)) || null : null);
