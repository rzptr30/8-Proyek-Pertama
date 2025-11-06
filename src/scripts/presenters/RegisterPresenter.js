import { register as apiRegister, login as apiLogin } from '../data/auth';
import { setApiToken, setAuthUser } from '../data/config';

export default class RegisterPresenter {
  constructor(view) { this._view = view; }

  async register({ name, email, password }) {
    await apiRegister({ name, email, password }); // "User created"
    const result = await apiLogin({ email, password }); // auto login
    if (!result?.token) throw new Error('Registrasi berhasil, tetapi token login tidak ditemukan.');
    setApiToken(result.token);
    setAuthUser({ userId: result.userId || '', name: result.name || '' });
  }
}