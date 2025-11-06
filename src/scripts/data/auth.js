import apiClient from './api-client';
import { setApiToken, setAuthUser } from './config';

export async function register({ name, email, password }) {
  await apiClient.register({ name, email, password }); // "User created"
  return login({ email, password }); // auto-login
}

export async function login({ email, password }) {
  const data = await apiClient.login({ email, password });
  const lr = data?.loginResult || {};
  if (!lr.token) throw new Error('Token tidak ditemukan pada respons login.');
  setApiToken(lr.token);
  setAuthUser({ userId: lr.userId || '', name: lr.name || '' });
  return lr;
}