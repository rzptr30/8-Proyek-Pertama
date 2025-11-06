import L from '../utils/leaflet-assets';
import apiClient from '../data/api-client';

export default class MapPresenter {
  constructor(view) {
    this._view = view;
    this._map = null;
    this._baseLayers = {};
    this._markersLayer = null;
    this._markersById = new Map();
    this._activeId = null;
  }

  initMap(mapEl) {
    if (!mapEl) return;

    this._map = L.map(mapEl, {
      center: [-2.5, 118],
      zoom: 5,
      scrollWheelZoom: true,
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this._map);

    const cartoLight = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | © OpenStreetMap contributors',
      },
    );

    const esriWorldImagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    );

    this._baseLayers = {
      'OSM Standard': osm,
      'CARTO Light': cartoLight,
      'Esri World Imagery': esriWorldImagery,
    };

    L.control.layers(this._baseLayers, null, { position: 'topright' }).addTo(this._map);
    this._markersLayer = L.layerGroup().addTo(this._map);
  }

  async loadAndRender(listEl, statusEl) {
    try {
      if (statusEl) statusEl.textContent = 'Memuat lokasi cerita...';
      const res = await apiClient.listStories({ page: 1, size: 50, location: 1 });
      const stories = Array.isArray(res?.listStory) ? res.listStory : res?.stories || [];

      const items = stories
        .map((s) => this._normalize(s))
        .filter((s) => s.lat !== null && s.lon !== null);

      this._renderMarkers(items);
      this._renderList(listEl, items);
      this._fitBoundsToMarkers();

      if (statusEl) statusEl.textContent = `Menampilkan ${items.length} lokasi cerita.`;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data peta.';
      if (statusEl) statusEl.textContent = msg;
      if (listEl) {
        listEl.innerHTML = `
          <div class="notice notice--error" role="alert">
            <p><strong>Gagal memuat peta:</strong> ${this._esc(msg)}</p>
            <p>Pastikan Anda sudah login sebelum membuka halaman Peta.</p>
          </div>
        `;
      }
    }
  }

  _renderMarkers(items) {
    if (!this._map || !this._markersLayer) return;
    this._markersLayer.clearLayers();
    this._markersById.clear();

    items.forEach((it) => {
      const marker = L.marker([it.lat, it.lon], { title: it.name });
      const popupHtml = `
        <div class="popup">
          <div class="popup__media">
            <img src="${this._esc(it.photoUrl)}" alt="Foto cerita ${this._esc(it.name)}">
          </div>
          <div class="popup__body">
            <strong>${this._esc(it.name)}</strong>
            <div>${this._esc(this._truncate(it.description, 100))}</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.on('click', () => this._highlight(it.id, { from: 'marker' }));
      marker.addTo(this._markersLayer);
      this._markersById.set(it.id, { item: it, marker });
    });
  }

  _renderList(listEl, items) {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = `<p role="status">Tidak ada data berlokasi.</p>`;
      return;
    }
    const html = items
      .map(
        (it) => `
        <li class="maplist__item" data-id="${this._esc(it.id)}" role="option" aria-selected="false">
          <button type="button" class="maplist__btn" aria-label="Fokuskan peta ke ${this._esc(it.name)}">
            <span class="maplist__title">${this._esc(it.name)}</span>
            <span class="maplist__desc">${this._esc(this._truncate(it.description, 80))}</span>
          </button>
        </li>`,
      )
      .join('');

    listEl.innerHTML = `<ul class="maplist" aria-label="Daftar lokasi cerita">${html}</ul>`;
    listEl.querySelectorAll('.maplist__item').forEach((li) => {
      li.querySelector('.maplist__btn')?.addEventListener('click', () => {
        const id = li.getAttribute('data-id') || '';
        this._highlight(id, { from: 'list' });
      });
    });
  }

  _highlight(id, { from } = {}) {
    if (!id || !this._map) return;
    const container = document.getElementById('map-list');
    container?.querySelectorAll('.maplist__item').forEach((li) => {
      const isActive = li.getAttribute('data-id') === id;
      li.classList.toggle('is-active', isActive);
      li.setAttribute('aria-selected', isActive ? 'true' : 'false');
      const btn = li.querySelector('.maplist__btn');
      if (btn) {
        if (isActive) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      }
    });

    const entry = this._markersById.get(id);
    if (!entry) return;

    if (this._activeId && this._activeId !== id) {
      const prev = this._markersById.get(this._activeId);
      if (prev?.marker) prev.marker.setZIndexOffset(0);
    }
    entry.marker.setZIndexOffset(1000);
    this._activeId = id;

    this._map.setView([entry.item.lat, entry.item.lon], Math.max(this._map.getZoom(), 12), { animate: true });
    if (from === 'list') entry.marker.openPopup();

    const activeLi = container?.querySelector('.maplist__item.is-active');
    activeLi?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _fitBoundsToMarkers() {
    const bounds = [];
    this._markersById.forEach(({ item }) => bounds.push([item.lat, item.lon]));
    if (bounds.length && this._map) {
      this._map.fitBounds(bounds, { padding: [24, 24] });
    }
  }

  _normalize(it = {}) {
    const lat = it.lat ?? it.latitude ?? null;
    const lon = it.lon ?? it.longitude ?? null;
    return {
      id: it.id ?? it._id ?? '',
      name: it.name ?? it.user?.name ?? 'Tanpa Nama',
      description: it.description ?? '',
      photoUrl: it.photoUrl ?? it.photo ?? '',
      lat: lat !== null ? Number(lat) : null,
      lon: lon !== null ? Number(lon) : null,
    };
  }

  _truncate(text, max = 100) {
    if (!text) return '';
    return text.length <= max ? text : text.slice(0, max - 1) + '…';
  }

  _esc(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}