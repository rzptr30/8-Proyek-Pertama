import { getApiBaseUrl, getApiToken } from './config';

class ApiClient {
  constructor() {}

  _buildUrl(path, query = {}) {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${p}`);
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });
    return url.toString();
  }

  _headers({ auth = true } = {}) {
    const headers = {};
    if (auth) {
      const token = getApiToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async _handleJsonResponse(res) {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || 'Invalid JSON response' };
    }
    if (!res.ok) {
      const msg = data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // GET /stories?location=1&page=&size=
  async listStories({ page = 1, size = 15, location = 1 } = {}) {
    const url = this._buildUrl('/stories', { page, size, location });
    const res = await fetch(url, {
      method: 'GET',
      headers: this._headers({ auth: true }),
    });
    return this._handleJsonResponse(res);
  }

  // GET /stories/{id}
  async getStoryDetail(id) {
    if (!id) throw new Error('id wajib diisi');
    const url = this._buildUrl(`/stories/${encodeURIComponent(id)}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: this._headers({ auth: true }),
    });
    return this._handleJsonResponse(res);
  }

  // POST /stories (FormData: description, photo(file), lat, lon)
  async addStory({ description, photoFile, lat, lon }) {
    if (!description) throw new Error('Deskripsi wajib diisi');
    if (!photoFile) throw new Error('Foto wajib diunggah');

    const form = new FormData();
    form.append('description', description);
    form.append('photo', photoFile);
    if (lat !== undefined && lat !== null) form.append('lat', String(lat));
    if (lon !== undefined && lon !== null) form.append('lon', String(lon));

    const url = this._buildUrl('/stories');
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers({ auth: true }), // FormData tidak butuh Content-Type manual
      body: form,
    });
    return this._handleJsonResponse(res);
  }
}

const apiClient = new ApiClient();
export default apiClient;