import L from '../utils/leaflet-assets';
import apiClient from '../data/api-client';
import { captureToBlob, startCameraStream, stopCameraStream } from '../utils/camera';
import { addOutboxStory } from '../data/saved-store';

export default class AddPresenter {
  constructor(view) {
    this._view = view;
    this._map = null;
    this._marker = null;
    this._picked = { lat: null, lon: null };
    this._stream = null;
    this._cameraBlob = null;
  }

  initMap(mapEl, onPick) {
    if (!mapEl) return;
    this._map = L.map(mapEl, {
      center: [-2.5, 118],
      zoom: 5,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this._map);

    this._map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this._setPoint(lat, lng);
      onPick?.({ lat, lon: lng });
    });
  }

  _setPoint(lat, lon) {
    this._picked = { lat, lon };
    if (!this._marker) {
      this._marker = L.marker([lat, lon], { draggable: true }).addTo(this._map);
      this._marker.on('dragend', () => {
        const pos = this._marker.getLatLng();
        this._picked = { lat: pos.lat, lon: pos.lng };
        this._view.updateLatLon(this._picked);
      });
    } else {
      this._marker.setLatLng([lat, lon]);
    }
    if (this._map) {
      this._map.setView([lat, lon], Math.max(this._map.getZoom(), 12), { animate: true });
    }
  }

  getPicked() {
    return { ...this._picked };
  }

  async startCamera(videoEl) {
    if (this._stream) return;
    this._stream = await startCameraStream(videoEl, { facingMode: 'environment' });
  }

  async capturePhoto(videoEl) {
    if (!this._stream) throw new Error('Kamera belum aktif.');
    const blob = await captureToBlob(videoEl);
    this._cameraBlob = blob;
    return blob;
  }

  stopCamera() {
    if (this._stream) {
      stopCameraStream(this._stream);
      this._stream = null;
    }
  }

  hasCameraPhoto() {
    return !!this._cameraBlob;
  }

  clearCameraPhoto() {
    this._cameraBlob = null;
  }

  async submit({ description, photoFile, lat, lon }) {
    const errors = [];
    if (!description || description.trim().length < 5) {
      errors.push('Deskripsi minimal 5 karakter.');
    }
    const photoCandidate = photoFile || this._cameraBlob;
    if (!photoCandidate) {
      errors.push('Foto wajib diunggah atau diambil kamera.');
    }
    if (lat == null || lon == null) {
      errors.push('Lokasi wajib dipilih di peta (klik untuk menentukan titik).');
    }
    if (errors.length) {
      const err = new Error(errors.join(' '));
      err.validation = true;
      throw err;
    }

    // Offline: antre ke Outbox
    if (!navigator.onLine) {
      const entry = await addOutboxStory({
        description: description.trim(),
        photoBlob: photoCandidate,
        lat,
        lon,
      });
      this.clearCameraPhoto();
      return { offlineQueued: true, outbox: entry };
    }

    // Online: kirim langsung
    const res = await apiClient.addStory({
      description: description.trim(),
      photoFile: photoCandidate,
      lat,
      lon,
    });

    this.clearCameraPhoto();
    return { offlineQueued: false, result: res };
  }
}