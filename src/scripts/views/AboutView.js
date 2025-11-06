import { getApiBaseUrl, setApiBaseUrl } from '../data/config';

export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi ini dibuat untuk submission "Berbagi Cerita". Fitur utama mencakup SPA, transisi halaman, peta, aksesibilitas, serta tambah data.</p>

        <section aria-labelledby="app-config-title" class="config-panel">
          <h2 id="app-config-title">Pengaturan API</h2>
          <p>Atur Base URL Story API di sini. Untuk autentikasi, gunakan halaman <a href="#/login">Masuk</a> atau <a href="#/register">Daftar</a>.</p>

          <form id="api-config-form">
            <div class="form-field">
              <label for="api-base-url">Base URL</label>
              <input id="api-base-url" name="api-base-url" type="url" placeholder="https://story-api.dicoding.dev/v1" required />
            </div>

            <div class="form-actions">
              <button type="submit">Simpan Pengaturan</button>
              <span id="config-status" role="status" aria-live="polite" class="status-text" style="margin-left:8px;"></span>
            </div>
          </form>
        </section>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('api-config-form');
    const baseUrlInput = document.getElementById('api-base-url');
    const statusEl = document.getElementById('config-status');

    // Prefill
    baseUrlInput.value = getApiBaseUrl() || '';

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const baseUrl = baseUrlInput?.value?.trim() || '';
      setApiBaseUrl(baseUrl);
      if (statusEl) {
        statusEl.textContent = 'Tersimpan.';
        setTimeout(() => (statusEl.textContent = ''), 2000);
      }
    });
  }
}