export default class HomePresenter {
  constructor(view) {
    this._view = view;
  }

  async loadStories() {
    try {
      this._view.showLoading();
      const apiClient = (await import('../data/api-client')).default;
      const res = await apiClient.listStories({ page: 1, size: 15, location: 1 });
      const raw = res?.listStory ?? res?.stories ?? [];
      const items = Array.isArray(raw) ? raw.map(this._normalizeItem) : [];
      this._view.showList(items);
    } catch (err) {
      // Berikan pesan lebih jelas jika error auth (401) atau 403
      if (err && (err.status === 401 || err.status === 403)) {
        this._view.showError('Missing authentication');
      } else {
        const msg = err?.message || 'Terjadi kesalahan jaringan.';
        this._view.showError(msg);
      }
    }
  }

  _normalizeItem(it = {}) {
    return {
      id: it.id ?? it._id ?? '',
      name: it.name ?? it.user?.name ?? 'Tanpa Nama',
      description: it.description ?? it.desc ?? '',
      photoUrl: it.photoUrl ?? it.photo ?? '',
      createdAt: it.createdAt ?? it.created_at ?? '',
      lat: it.lat ?? it.latitude ?? null,
      lon: it.lon ?? it.longitude ?? null,
    };
  }
}