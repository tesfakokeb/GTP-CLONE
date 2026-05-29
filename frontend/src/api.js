/** Site root from .env; API routes live under `/api` on the backend. */
const SITE_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(
  /\/$/,
  '',
);
const API_BASE_URL = SITE_BASE_URL ? `${SITE_BASE_URL}/api` : '/api';

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
