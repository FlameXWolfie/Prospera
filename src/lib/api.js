// Tiny fetch wrapper for the Prospera API. In dev, requests go to `/api` and are
// proxied to the Express server (see vite.config.js). Override with VITE_API_URL.

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'prospera_token';

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields || null;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the API is running.', 0);
  }

  let data = {};
  try { data = await res.json(); } catch { /* empty / non-JSON body */ }

  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status}).`, res.status, data.fields);
  }
  return data;
}

// Like apiFetch but returns a binary Blob (e.g. a compiled PDF). On error the body
// is JSON ({ error }), so we surface that message.
export async function apiBlob(path, { method = 'POST', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the API is running.', 0);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status}).`;
    try { const d = await res.json(); if (d.error) msg = d.error; } catch { /* non-JSON */ }
    throw new ApiError(msg, res.status);
  }
  return res.blob();
}
