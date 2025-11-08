import { getApiBaseUrl, getApiToken } from './config';

class ApiClient {
  _buildUrl(path, query = {}) {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${p}`);
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  }

  _headers({ auth = true, json = true } = {}) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (auth) {
      const token = getApiToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }

  async _handle(res) {
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || 'Invalid JSON' }; }
    if (!res.ok || data?.error) {
      const err = new Error(data?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

   async getVapidPublicKey() {
    // Endpoint VAPID key tidak tersedia pada API ini.
    // Kembalikan string kosong agar push-manager memakai fallback.
    return '';
  }

  // AUTH
  async login({ email, password }) {
    const res = await fetch(this._buildUrl('/login'), {
      method: 'POST',
      headers: this._headers({ auth: false, json: true }),
      body: JSON.stringify({ email, password }),
    });
    return this._handle(res);
  }
  async register({ name, email, password }) {
    const res = await fetch(this._buildUrl('/register'), {
      method: 'POST',
      headers: this._headers({ auth: false, json: true }),
      body: JSON.stringify({ name, email, password }),
    });
    return this._handle(res);
  }

  // STORIES
  async listStories({ page = 1, size = 15, location = 1 } = {}) {
    const res = await fetch(this._buildUrl('/stories', { page, size, location }), {
      method: 'GET',
      headers: this._headers({ auth: true, json: false }),
    });
    return this._handle(res);
  }
  async getStoryDetail(id) {
    const res = await fetch(this._buildUrl(`/stories/${encodeURIComponent(id)}`), {
      method: 'GET',
      headers: this._headers({ auth: true, json: false }),
    });
    return this._handle(res);
  }
  async addStory({ description, photoFile, lat, lon }) {
    const form = new FormData();
    form.append('description', description);
    form.append('photo', photoFile);
    if (lat != null) form.append('lat', String(lat));
    if (lon != null) form.append('lon', String(lon));
    const res = await fetch(this._buildUrl('/stories'), {
      method: 'POST',
      headers: this._headers({ auth: true, json: false }),
      body: form,
    });
    return this._handle(res);
  }

  // PUSH
  // Catatan: endpoint bisa berbeda. Sesuaikan jika dokumentasi API-mu lain.
  async getVapidPublicKey() {
    const res = await fetch(this._buildUrl('/push/web'), {
      method: 'GET',
      headers: this._headers({ auth: false, json: false }),
    });
    const data = await this._handle(res);
    // Terima salah satu bentuk: { publicKey } atau { data: { publicKey } }
    return data?.publicKey || data?.data?.publicKey || '';
  }

  async sendPushSubscription(subscription) {
    const res = await fetch(this._buildUrl('/push/subscribe'), {
      method: 'POST',
      headers: this._headers({ auth: true, json: true }),
      body: JSON.stringify(subscription),
    });
    return this._handle(res);
  }

  async removePushSubscription(subscription) {
    // Sebagian API hanya butuh endpoint; kita kirim full agar fleksibel.
    const res = await fetch(this._buildUrl('/push/unsubscribe'), {
      method: 'POST',
      headers: this._headers({ auth: true, json: true }),
      body: JSON.stringify({ endpoint: subscription?.endpoint || '', subscription }),
    });
    return this._handle(res);
  }
}

export default new ApiClient();