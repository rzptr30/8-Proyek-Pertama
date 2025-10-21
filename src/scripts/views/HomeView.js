import { formatDateID } from '../utils/format';

export default class HomeView {
  async render() {
    return `
      <section class="page" data-route="home">
        <h1 class="page-title" data-page-title>Beranda</h1>
        <p>Daftar cerita terbaru dari komunitas. Klik salah satu untuk melihat detailnya.</p>

        <div class="sr-only" role="status" aria-live="polite" id="home-status"></div>

        <div id="home-content">
          ${this._renderSkeleton()}
        </div>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    // Mulai load data
    presenter.loadStories();
  }

  _contentEl() {
    return document.getElementById('home-content');
  }

  _statusEl() {
    return document.getElementById('home-status');
  }

  _renderSkeleton(count = 6) {
    const items = Array.from({ length: count })
      .map(
        () => `
        <article class="card card--skeleton" aria-hidden="true">
          <div class="card__media skeleton-block"></div>
          <div class="card__body">
            <div class="skeleton-line" style="width:60%"></div>
            <div class="skeleton-line" style="width:90%"></div>
            <div class="skeleton-line" style="width:40%"></div>
          </div>
        </article>
      `,
      )
      .join('');
    return `<div class="card-list">${items}</div>`;
  }

  showLoading() {
    const content = this._contentEl();
    const status = this._statusEl();
    if (content) content.innerHTML = this._renderSkeleton();
    if (status) status.textContent = 'Memuat daftar cerita...';
  }

  showError(message = 'Gagal memuat data.') {
    const content = this._contentEl();
    const status = this._statusEl();
    if (status) status.textContent = 'Terjadi kesalahan saat memuat data.';
    if (!content) return;

    const help =
      'Pastikan Base URL dan Token (jika diperlukan) sudah diatur pada halaman Tentang.';
    content.innerHTML = `
      <div class="notice notice--error" role="alert">
        <p><strong>Gagal memuat data:</strong> ${this._escape(message)}</p>
        <p>${help} <a href="#/about">Buka halaman Tentang</a>.</p>
      </div>
    `;
  }

  showList(items = []) {
    const content = this._contentEl();
    const status = this._statusEl();
    if (status) status.textContent = `Memuat selesai. Menampilkan ${items.length} cerita.`;
    if (!content) return;

    if (!Array.isArray(items) || items.length === 0) {
      content.innerHTML = `
        <div class="notice" role="status">
          <p>Tidak ada cerita untuk ditampilkan.</p>
        </div>
      `;
      return;
    }

    const list = items
      .map((it) => {
        const photo = it.photoUrl || '';
        const name = it.name || 'Tanpa Nama';
        const desc = it.description || '';
        const date = it.createdAt ? formatDateID(it.createdAt) : '';
        const id = it.id || '';
        const alt = `${name} — ${desc ? this._truncate(desc, 80) : 'Foto cerita'}`;

        return `
          <article class="card">
            <a class="card__media-link" href="#/detail/${this._escape(id)}" aria-label="Lihat detail cerita ${this._escape(name)}">
              <img class="card__media" src="${this._escape(photo)}" alt="${this._escape(alt)}" loading="lazy" />
            </a>
            <div class="card__body">
              <h2 class="card__title">
                <a href="#/detail/${this._escape(id)}">${this._escape(name)}</a>
              </h2>
              <p class="card__desc">${this._escape(this._truncate(desc, 140))}</p>
              <p class="card__meta">${this._escape(date)}</p>
            </div>
          </article>
        `;
      })
      .join('');

    content.innerHTML = `<div class="card-list">${list}</div>`;
  }

  _truncate(text, max = 140) {
    if (!text) return '';
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  _escape(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}