import { getApiBaseUrl, setApiBaseUrl, getApiToken, setApiToken } from '../data/config';

export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi ini dibuat untuk submission "Berbagi Cerita". Fitur: SPA, transisi halaman, peta, aksesibilitas, dan form tambah data.</p>

        <section aria-labelledby="app-config-title" class="config-panel">
          <h2 id="app-config-title">Pengaturan API</h2>
          <p>Runtime aplikasi membaca Base URL dan Token dari penyimpanan lokal (localStorage). Sesuai ketentuan submission, cantumkan nilai Base URL dan Token (dengan awalan "Bearer ") pada berkas <strong>STUDENT.txt</strong> untuk keperluan review.</p>
          <p><strong>Catatan:</strong> Masukkan token <em>tanpa</em> kata "Bearer" di sini. Aplikasi akan otomatis menambahkan "Bearer " saat mengirim request.</p>

          <form id="api-config-form">
            <div class="form-field">
              <label for="api-base-url">Base URL</label>
              <input id="api-base-url" name="api-base-url" type="url" placeholder="https://story-api.dicoding.dev/v1" required />
            </div>

            <div class="form-field">
              <label for="api-token">Token (tanpa kata "Bearer")</label>
              <input id="api-token" name="api-token" type="text" placeholder="Tempel token di sini, tanpa 'Bearer'" />
              <small class="field-hint">Contoh header yang akan dikirim: Authorization: Bearer ••••</small>
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

  async afterRender(_params, presenter) {
    const form = document.getElementById('api-config-form');
    const baseUrlInput = document.getElementById('api-base-url');
    const tokenInput = document.getElementById('api-token');
    const statusEl = document.getElementById('config-status');

    // Prefill dari config
    const base = getApiBaseUrl();
    const token = getApiToken(); // sudah dibersihkan dari "Bearer "
    if (baseUrlInput) baseUrlInput.value = base || '';
    if (tokenInput) tokenInput.value = token || '';

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const baseUrl = baseUrlInput?.value || '';
      const rawToken = tokenInput?.value || '';
      setApiBaseUrl(baseUrl);
      setApiToken(rawToken);
      if (statusEl) {
        statusEl.textContent = 'Tersimpan.';
        setTimeout(() => (statusEl.textContent = ''), 2000);
      }
    });
  }
}