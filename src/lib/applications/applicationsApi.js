// Application-tracker CRUD against the API. Session-scoped on the server.
import { apiFetch } from '../api';

export const listApplications = () => apiFetch('/applications');
export const createApplication = (app) => apiFetch('/applications', { method: 'POST', body: app });
export const updateApplication = (id, patch) => apiFetch(`/applications/${id}`, { method: 'PATCH', body: patch });
export const deleteApplication = (id) => apiFetch(`/applications/${id}`, { method: 'DELETE' });
