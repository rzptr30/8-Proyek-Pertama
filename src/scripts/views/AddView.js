export default class AddView {
  async render() {
    return `
      <section class="page" data-route="add">
        <h1 class="page-title" data-page-title>Tambah Cerita</h1>
        <p>Unggah foto, tulis deskripsi, dan pilih lokasi di peta dengan mengklik titik yang diinginkan.</p>

        <div id="add-status" class="status-text" role="status" aria-live="polite"></div>

        <div class="add-layout">
          <div class="add-layout__map" id="add-map" role="region" aria-label="Peta pilih lokasi"></div>

          <form id="add-form" class="add-form" novalidate>
            <div class="form-field">
              <label for="desc">Deskripsi</label>
              <textarea id="desc" name="desc" rows="4" placeholder="Tulis deskripsi cerita" required minlength="5"></textarea>
              <small class="field-hint">Minimal 5 karakter.</small>
            </div>

            <div class="form-field">
              <label for="photo">Foto</label>
              <input id="photo" name="photo" type="file" accept="image/*" />
              <div class="preview">
                <img id="photo-preview" alt="Pratinjau foto yang akan diunggah" hidden />
              </div>
            </div>

            <div class="form-field">
              <label>Posisi</label>
              <div class="latlon">
                <div>
                  <label for="lat">Latitude</label>
                  <input id="lat" name="lat" type="text" inputmode="decimal" readonly aria-readonly="true" />
                </div>
                <div>
                  <label for="lon">Longitude</label>
                  <input id="lon" name="lon" type="text" inputmode="decimal" readonly aria-readonly="true" />
                </div>
              </div>
              <small class="field-hint">Klik peta untuk memilih titik. Anda dapat menyeret marker untuk koreksi.</small>
            </div>

            <details class="camera-panel" id="camera-panel">
              <summary>Gunakan Kamera</summary>
              <div class="camera-panel__body">
                <video id="camera-video" playsinline muted></video>
                <div class="camera-actions">
                  <button type="button" id="camera-start">Mulai Kamera</button>
                  <button type="button" id="camera-capture">Ambil Foto</button>
                  <button type="button" id="camera-stop">Hentikan Kamera</button>
                </div>
                <div class="preview">
                  <img id="camera-preview" alt="Hasil foto kamera" hidden />
                </div>
              </div>
            </details>

            <div class="form-actions">
              <button id="submit-btn" type="submit">Kirim Cerita</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    // Inisialisasi peta
    const mapEl = document.getElementById('add-map');
    presenter.initMap(mapEl, ({ lat, lon }) => this.updateLatLon({ lat, lon }));

    // Elemen form
    const form = document.getElementById('add-form');
    const statusEl = document.getElementById('add-status');
    const descEl = document.getElementById('desc');
    const photoEl = document.getElementById('photo');
    const previewEl = document.getElementById('photo-preview');
    const latEl = document.getElementById('lat');
    const lonEl = document.getElementById('lon');

    // Kamera
    const panel = document.getElementById('camera-panel');
    const videoEl = document.getElementById('camera-video');
    const camPrev = document.getElementById('camera-preview');
    const btnStart = document.getElementById('camera-start');
    const btnCapture = document.getElementById('camera-capture');
    const btnStop = document.getElementById('camera-stop');

    // Preview saat file dipilih
    photoEl?.addEventListener('change', () => {
      const f = photoEl.files && photoEl.files[0];
      if (f) {
        const url = URL.createObjectURL(f);
        previewEl.src = url;
        previewEl.hidden = false;
        // Jika pengguna memilih file, kosongkan hasil foto kamera sebelumnya
        camPrev.hidden = true;
        camPrev.removeAttribute('src');
      } else {
        previewEl.hidden = true;
        previewEl.removeAttribute('src');
      }
    });

    // Kamera: mulai
    btnStart?.addEventListener('click', async () => {
      try {
        await presenter.startCamera(videoEl);
        this._setStatus(statusEl, 'Kamera aktif.');
      } catch (e) {
        this._setStatus(statusEl, `Gagal mengaktifkan kamera: ${e?.message || e}`, true);
      }
    });

    // Kamera: ambil foto
    btnCapture?.addEventListener('click', async () => {
      try {
        const blob = await presenter.capturePhoto(videoEl);
        const url = URL.createObjectURL(blob);
        camPrev.src = url;
        camPrev.hidden = false;

        // Jika kamera dipakai, kosongkan input file agar tidak bingung
        if (photoEl) {
          photoEl.value = '';
          previewEl.hidden = true;
          previewEl.removeAttribute('src');
        }
        this._setStatus(statusEl, 'Foto kamera diambil. Siap dikirim.');
      } catch (e) {
        this._setStatus(statusEl, `Gagal mengambil foto: ${e?.message || e}`, true);
      }
    });

    // Kamera: stop saat panel ditutup
    panel?.addEventListener('toggle', () => {
      if (!panel.open) {
        presenter.stopCamera();
        this._setStatus(statusEl, 'Kamera dihentikan.');
      }
    });

    // Tombol stop
    btnStop?.addEventListener('click', () => {
      presenter.stopCamera();
      this._setStatus(statusEl, 'Kamera dihentikan.');
    });

    // Submit form
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const description = descEl?.value || '';
      const file = photoEl?.files?.[0] || null;
      const lat = latEl?.value ? Number(latEl.value) : presenter.getPicked().lat;
      const lon = lonEl?.value ? Number(lonEl.value) : presenter.getPicked().lon;

      try {
        this._setStatus(statusEl, 'Mengirim cerita...', false);
        const res = await presenter.submit({ description, photoFile: file, lat, lon });

        if (res?.offlineQueued) {
          this._setStatus(
            statusEl,
            'Tidak ada koneksi. Cerita diantre dan akan disinkronkan otomatis saat online.',
            false,
            true
          );
        } else {
          this._setStatus(statusEl, 'Berhasil mengirim cerita!', false, true);
        }

        // Reset sederhana
        form.reset();
        if (previewEl) { previewEl.hidden = true; previewEl.removeAttribute('src'); }
        if (camPrev) { camPrev.hidden = true; camPrev.removeAttribute('src'); }
        presenter.stopCamera();
      } catch (err) {
        if (err?.validation) {
          this._setStatus(statusEl, err.message, true);
        } else {
          const msg = err?.data?.message || err?.message || 'Gagal mengirim cerita.';
          this._setStatus(statusEl, msg, true);
        }
      }
    });
  }

  updateLatLon({ lat, lon }) {
    const latEl = document.getElementById('lat');
    const lonEl = document.getElementById('lon');
    if (latEl) latEl.value = typeof lat === 'number' ? lat.toFixed(6) : '';
    if (lonEl) lonEl.value = typeof lon === 'number' ? lon.toFixed(6) : '';
    const statusEl = document.getElementById('add-status');
    this._setStatus(statusEl, `Lokasi dipilih: ${latEl.value}, ${lonEl.value}`);
  }

  _setStatus(el, text, isError = false, isSuccess = false) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('status--error', !!isError);
    el.classList.toggle('status--success', !!isSuccess);
  }

  async destroy() {
    // Dipanggil oleh App saat navigasi: hentikan kamera jika masih aktif
    const ev = new Event('toggle');
    const panel = document.getElementById('camera-panel');
    if (panel && panel.open) {
      panel.open = false;
      document.dispatchEvent(ev);
    }
  }
}