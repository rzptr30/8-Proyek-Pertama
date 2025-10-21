import { getApiBaseUrl, setApiBaseUrl, getApiToken, setApiToken } from '../data/config';

export default class AboutPresenter {
  constructor(view) {
    this._view = view;
  }

  getConfig() {
    return {
      baseUrl: getApiBaseUrl(),
      token: getApiToken(),
    };
  }

  saveConfig({ baseUrl, token }) {
    setApiBaseUrl(baseUrl);
    setApiToken(token);
    return this.getConfig();
  }
}