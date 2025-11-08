import apiClient from '../data/api-client';
import { saveStory, removeSavedStory, getSavedStory } from '../data/saved-store';

export default class DetailView {
  async render(params = {}) {
    const id = params.id || '';
    return `
      <section class="page" data-route="detail">
        <h1 class="page-title" data-page-title>Detail Cerita</h1>
        <div id="detail-container" data-id="${id}"></div>

        <div class="actions" style="margin:12px 0;">
          <button type="button" id="btn-save">Simpan</button>
          <button type="button" id="btn-unsave" hidden>Hapus Simpanan</button>
        </div>

        <div id="detail-status" role="status" aria-live="polite"></div>
      </section>
    `;
  }

  async afterRender(params = {}) {
    const id = params.id;
    const container = document.getElementById('detail-container');
    const saveBtn = document.getElementById('btn-save');
    const unsaveBtn = document.getElementById('btn-unsave');
    const statusEl = document.getElementById('detail-status');

    if (!id) {
      container.innerHTML = '<p>ID tidak ditemukan.</p>';
      saveBtn.disabled = true;
      return;
    }

    try {
      const data = await apiClient.getStoryDetail(id);
      const story = data?.story || data || {};

      container.innerHTML = `
        <article>
          <h2>${escapeHtml(story.name || 'Tanpa Nama')}</h2>
          ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Foto cerita ${escapeHtml(story.name || '')}" style="max-width:100%;height:auto"/>` : ''}
          <p>${escapeHtml(story.description || '')}</p>
          ${story.lat != null && story.lon != null ? `<small>Lokasi: ${story.lat}, ${story.lon}</small>` : ''}
        </article>
      `;

      const existing = await getSavedStory(story.id);
      toggleButtons(!!existing);

      saveBtn.addEventListener('click', async () => {
        try {
          await saveStory({
            id: story.id,
            name: story.name,
            description: story.description,
            photoUrl: story.photoUrl,
            lat: story.lat,
            lon: story.lon,
            createdAt: story.createdAt,
          });
          toggleButtons(true);
          statusEl.textContent = 'Cerita disimpan.';
        } catch (e) {
          statusEl.textContent = e?.message || 'Gagal menyimpan cerita.';
        }
      });

      unsaveBtn.addEventListener('click', async () => {
        try {
          await removeSavedStory(story.id);
          toggleButtons(false);
          statusEl.textContent = 'Simpanan dihapus.';
        } catch (e) {
          statusEl.textContent = e?.message || 'Gagal menghapus simpanan.';
        }
      });

      function toggleButtons(saved) {
        saveBtn.hidden = !!saved;
        unsaveBtn.hidden = !saved;
      }
    } catch (e) {
      container.innerHTML = `<p class="status--error">Gagal memuat detail: ${escapeHtml(e?.message || 'Unknown')}</p>`;
    }
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}