// Konfigurasi API: base URL & token disimpan di localStorage.
// Catatan: setApiToken akan membersihkan awalan "Bearer " jika user menempelkannya.

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
  // Simpan token murni tanpa kata "Bearer"
  const t = localStorage.getItem('api_token') || '';
  return (t || '').trim().replace(/^Bearer\s+/i, '');
}

export function setApiToken(token) {
  // Bersihkan jika user menempel "Bearer <token>"
  const val = (token || '').trim().replace(/^Bearer\s+/i, '');
  if (!val) {
    localStorage.removeItem('api_token');
  } else {
    localStorage.setItem('api_token', val);
  }
}

/**
 * Penting:
 * - Aplikasi runtime menggunakan localStorage untuk membaca Base URL & token.
 * - Untuk reviewer, cantumkan nilai token (dengan awalan "Bearer ") di STUDENT.txt.
 */