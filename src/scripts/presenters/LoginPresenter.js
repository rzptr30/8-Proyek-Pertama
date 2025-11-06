import { login as apiLogin } from '../data/auth';
import { setApiToken, setAuthUser, getApiToken, clearAuth } from '../data/config';

export default class LoginPresenter {
  constructor(view) { this._view = view; }

  isAuthenticated() { return !!getApiToken(); }

  async login({ email, password }) {
    const result = await apiLogin({ email, password });
    if (!result?.token) throw new Error('Token tidak ditemukan pada respons.');
    setApiToken(result.token);
    setAuthUser({ userId: result.userId || '', name: result.name || '' });
  }

  logout() { clearAuth(); }
}