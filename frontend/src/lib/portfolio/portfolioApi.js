// Portfolio is one-per-user. GET returns it (or null); PUT upserts. The server
// scopes everything to the signed-in user (apiFetch attaches the Bearer token).
import { apiFetch } from '../api';

export const getPortfolio = () => apiFetch('/portfolio');
export const savePortfolio = (body) => apiFetch('/portfolio', { method: 'PUT', body });
