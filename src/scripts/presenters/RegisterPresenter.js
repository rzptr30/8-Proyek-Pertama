import { register as apiRegister } from '../data/auth';

export default class RegisterPresenter {
  constructor(view) { this._view = view; }

  async register({ name, email, password }) {
    return apiRegister({ name, email, password });
  }
}