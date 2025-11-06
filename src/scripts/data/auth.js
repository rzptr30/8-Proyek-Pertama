// Helper autentikasi ke Story API
import { getApiBaseUrl } from './config';

async function handleJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function register({ name, email, password }) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  // Di Story API: pesan "User created" jika sukses, tidak ada token.
  return handleJson(res);
}

export async function login({ email, password }) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleJson(res);
  // data.loginResult: { userId, name, token }
  return data.loginResult || {};
}