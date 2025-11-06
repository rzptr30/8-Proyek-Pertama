export const DEFAULT_API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export function getApiBaseUrl() {
  return localStorage.getItem('api_base_url') || DEFAULT_API_BASE_URL;
}
export function setApiBaseUrl(url) {
  const val = (url || '').trim();
  if (!val) localStorage.removeItem('api_base_url');
  else localStorage.setItem('api_base_url', val);
}

export function getApiToken() {
  const t = localStorage.getItem('api_token') || '';
  return (t || '').trim().replace(/^Bearer\s+/i, '');
}
export function setApiToken(token) {
  const val = (token || '').trim().replace(/^Bearer\s+/i, '');
  if (!val) localStorage.removeItem('api_token');
  else localStorage.setItem('api_token', val);
}

export function setAuthUser({ userId = '', name = '' } = {}) {
  if (userId) localStorage.setItem('api_user_id', userId);
  else localStorage.removeItem('api_user_id');
  if (name) localStorage.setItem('api_user_name', name);
  else localStorage.removeItem('api_user_name');
}
export function getAuthUser() {
  return {
    userId: localStorage.getItem('api_user_id') || '',
    name: localStorage.getItem('api_user_name') || '',
  };
}
export function clearAuth() {
  localStorage.removeItem('api_token');
  localStorage.removeItem('api_user_id');
  localStorage.removeItem('api_user_name');
}