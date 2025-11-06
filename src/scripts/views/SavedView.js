export default class SavedView {
  async render() {
    return `
      <section class="page" data-route="saved">
        <h1 class="page-title" data-page-title>Disimpan</h1>
        <div class="saved-controls">
          <input id="saved-search" type="search" placeholder="Cari..." aria-label="Cari cerita tersimpan">
          <select id="saved-sort" aria-label="Urutkan">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama</option>
          </select>
        </div>
        <div id="saved-status" role="status" aria-live="polite" class="status"></div>
        <div id="outbox-section"></div>
        <ul id="saved-list" class="saved-list" aria-label="Daftar cerita tersimpan"></ul>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    const listEl = document.getElementById('saved-list');
    const statusEl = document.getElementById('saved-status');
    const searchEl = document.getElementById('saved-search');
    const sortEl = document.getElementById('saved-sort');
    const outboxSection = document.getElementById('outbox-section');

    let state = { saved: [], outbox: [] };

    const applyRender = () => {
      const term = searchEl.value.trim().toLowerCase();
      const sortMode = sortEl.value;
      let items = [...state.saved];

      if (term) {
        items = items.filter(
          s =>
            s.name.toLowerCase().includes(term) ||
            s.description.toLowerCase().includes(term)
        );
      }

      if (sortMode === 'newest') {
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortMode === 'oldest') {
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortMode === 'name') {
        items.sort((a, b) => a.name.localeCompare(b.name));
      }

      listEl.innerHTML = items.length
        ? items
            .map(
              s => `<li class="saved-item" data-id="${s.id}">
                <article>
                  <h3>${escapeHtml(s.name)}</h3>
                  <p>${escapeHtml(s.description.slice(0, 120))}</p>
                  <small>${new Date(s.createdAt).toLocaleString('id-ID')}</small>
                  <div class="actions">
                    <button type="button" class="btn-delete" aria-label="Hapus ${escapeHtml(
                      s.name
                    )}">Hapus</button>
                    <a href="#/detail/${s.id}">Detail</a>
                  </div>
                </article>
              </li>`
            )
            .join('')
        : '<li><em>Tidak ada cerita disimpan.</em></li>';

      outboxSection.innerHTML = renderOutbox(state.outbox);
    };

    const renderOutbox = (items) => {
      if (!items.length) return '';
      return `
        <div class="outbox-wrap">
          <h2>Menunggu Sinkronisasi (${items.length})</h2>
          <ul class="outbox-list">
            ${items
              .map(
                o => `<li class="outbox-item" data-local-id="${o.localId}">
                  <strong>${escapeHtml(o.description.slice(0, 40))}</strong>
                  <small>Status: ${o.status}</small>
                  ${o.errorMessage ? `<small class="error">${escapeHtml(o.errorMessage)}</small>` : ''}
                </li>`
              )
              .join('')}
          </ul>
        </div>
      `;
    };

    const escapeHtml = (s) =>
      String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const reload = async () => {
      statusEl.textContent = 'Memuat...';
      state = await presenter.load();
      statusEl.textContent = `Tersimpan: ${state.saved.length}, Outbox: ${state.outbox.length}`;
      applyRender();
    };

    listEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-delete');
      if (!btn) return;
      const li = btn.closest('.saved-item');
      const id = li?.getAttribute('data-id');
      if (!id) return;
      await presenter.delete(id);
      await reload();
    });

    searchEl.addEventListener('input', applyRender);
    sortEl.addEventListener('change', applyRender);

    await reload();
  }
}