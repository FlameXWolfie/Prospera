// Resume CRUD against the API. All routes require a session (apiFetch attaches
// the Bearer token); the server scopes every query to the signed-in user.
import { apiFetch } from '../api';

export const listResumes = () => apiFetch('/resumes');
// The original uploaded file (base64) — fetched lazily, only when a preview needs it.
export const getResumeFile = (id) => apiFetch(`/resumes/${id}/file`);
export const createResume = (resume) => apiFetch('/resumes', { method: 'POST', body: resume });
export const updateResume = (id, patch) => apiFetch(`/resumes/${id}`, { method: 'PATCH', body: patch });
// Record a real ATS scan result (score + what it was scanned against); the server
// stamps `scannedAt`, which is what makes the score "real" everywhere it shows.
export const recordResumeScan = (id, body) => apiFetch(`/resumes/${id}/scan`, { method: 'POST', body });
export const activateResume = (id) => apiFetch(`/resumes/${id}/activate`, { method: 'POST' });
export const deleteResume = (id) => apiFetch(`/resumes/${id}`, { method: 'DELETE' });
