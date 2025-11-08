import { login as apiLogin } from '../data/auth';
import { getApiToken, clearAuth } from '../data/config';

export default class LoginPresenter {
  constructor(view) { this._view = view; }
  isAuthenticated() { return !!getApiToken(); }
  async login({ email, password }) { return apiLogin({ email, password }); }
  logout() { clearAuth(); }
}