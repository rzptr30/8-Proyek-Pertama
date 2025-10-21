export const DEFAULT_API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export function getApiBaseUrl() {
  return localStorage.getItem('api_base_url') || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url) {
  const val = (url || '').trim();
  if (!val) {
    localStorage.removeItem('api_base_url');
  } else {
    localStorage.setItem('api_base_url', val);
  }
}

export function getApiToken() {
  return localStorage.getItem('api_token') || '';
}

export function setApiToken(token) {
  const val = (token || '').trim();
  if (!val) {
    localStorage.removeItem('api_token');
  } else {
    localStorage.setItem('api_token', val);
  }
}

/**
 * Catatan:
 * - Runtime aplikasi membaca Base URL dan Token dari localStorage.
 * - Sesuai ketentuan submission, cantumkan API key/token di STUDENT.txt untuk reviewer.
 * - STUDENT.txt tidak bisa dibaca oleh aplikasi saat runtime; ini hanya media dokumentasi.
 */