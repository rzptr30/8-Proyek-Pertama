/**
 * HomePresenter
 * - Mengambil daftar cerita dari Story API melalui apiClient.listStories()
 * - Tidak melakukan render langsung; View akan memanggil presenter.load()
 *   lalu menampilkan hasilnya.
 *
 * Kontrak minimal ke View:
 *   const { stories, page, size, hasMore } = await presenter.load({ page: 1, size: 15 })
 *
 * Catatan:
 * - API Dicoding biasa mengembalikan properti `listStory` sebagai array.
 * - Field total/next tidak selalu tersedia; `hasMore` diestimasi dari panjang data.
 */

import apiClient from '../data/api-client';

export default class HomePresenter {
  constructor(view) {
    this._view = view;
  }

  /**
   * Ambil daftar cerita dari API.
   * @param {Object} opts
   * @param {number} [opts.page=1] - halaman (1-based)
   * @param {number} [opts.size=15] - jumlah per halaman
   * @param {number} [opts.location=1] - sertakan koordinat (sesuai spesifikasi API)
   * @returns {Promise<{stories: Array, page: number, size: number, hasMore: boolean}>}
   */
  async load({ page = 1, size = 15, location = 1 } = {}) {
    const data = await apiClient.listStories({ page, size, location });
    const stories = Array.isArray(data?.listStory) ? data.listStory
                  : Array.isArray(data?.stories) ? data.stories
                  : [];

    // Estimasi hasMore sederhana: jika jumlah item == size, kemungkinan masih ada halaman berikutnya
    const hasMore = stories.length === size;

    return { stories, page, size, hasMore };
  }
}