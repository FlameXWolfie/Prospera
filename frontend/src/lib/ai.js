// AI features (Mistral) via the server — the API key never touches the browser.
// When AI is disabled on the server these endpoints return 503; callers should
// catch and fall back to the deterministic heuristic.
import { apiFetch } from './api';

export const aiStatus = () => apiFetch('/ai/status');
export const aiAtsScan = (body) => apiFetch('/ai/ats-scan', { method: 'POST', body });
export const aiEnhance = (body) => apiFetch('/ai/enhance', { method: 'POST', body });
export const aiParseResume = (body) => apiFetch('/ai/parse-resume', { method: 'POST', body });
