export default class MapView {
  async render() {
    return `
      <section class="page" data-route="map">
        <h1 class="page-title" data-page-title>Peta Cerita</h1>
        <p>Menampilkan lokasi cerita dari API pada peta. Klik item di daftar untuk fokus peta, atau klik marker untuk melihat ringkasan cerita.</p>

        <div class="map-layout">
          <div
            class="map-layout__map"
            id="map"
            role="region"
            aria-label="Peta cerita"
            tabindex="0"
          ></div>

          <aside class="map-layout__list" aria-labelledby="map-list-title">
            <div class="map-layout__list-head">
              <h2 id="map-list-title">Daftar Lokasi</h2>
              <div id="map-status" role="status" aria-live="polite" class="status-text"></div>
            </div>
            <div id="map-list" class="map-layout__list-body" role="listbox" aria-label="Daftar lokasi cerita"></div>
          </aside>
        </div>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    const mapEl = document.getElementById('map');
    const listEl = document.getElementById('map-list');
    const statusEl = document.getElementById('map-status');

    presenter.initMap(mapEl);
    presenter.loadAndRender(listEl, statusEl);
  }
}