# Berbagi Cerita — Submission Proyek Web API + Peta + Aksesibilitas (SPA)

Aplikasi Single-Page Application (SPA) bertema “Berbagi Cerita” yang menampilkan daftar cerita dari Story API, memvisualisasikan lokasi pada peta digital (OpenStreetMap/Leaflet), serta menyediakan fitur tambah cerita baru dengan unggah gambar atau kamera langsung. Aplikasi dibangun dengan arsitektur MVP, transisi halaman kustom, dan aksesibilitas yang memperhatikan standar WCAG.

## Ringkasan Fitur Utama
- SPA (Hash Routing): #/, #/map, #/add, #/about, #/detail/:id
- Transisi Halaman Kustom: View Transitions API dengan fallback CSS
- Arsitektur MVP: Presenter terpisah dari View
- Daftar Cerita dari API: Gambar + ≥3 teks (judul/nama, deskripsi singkat, tanggal)
- Peta Digital (Leaflet + OSM):
  - Marker + popup
  - Interaktivitas: sinkronisasi list ↔ marker, highlight aktif
  - Multiple tile layers + layer control (Advance)
- Form Tambah Cerita:
  - Upload gambar, pilih lokasi via klik peta (marker draggable)
  - Validasi input + pesan sukses/gagal (aria-live)
  - Opsi kamera langsung (getUserMedia) dan menutup media stream
- Aksesibilitas:
  - Alt text, HTML semantik, label input
  - Responsif (375px, 768px, 1024px)
  - Skip to content, operable via keyboard
  - Reduced motion: hormati preferensi pengguna

## Prasyarat
- Node.js LTS (16+ atau 18+ disarankan)
- Internet (untuk memuat tile peta dan Story API)

## Cara Menjalankan (Development)
1. Install dependency:
   ```
   npm install
   ```
2. Jalankan dev server:
   ```
   npm run start-dev
   ```
3. Buka di browser:
   - http://localhost:9000

## Build Production dan Serve
- Build:
  ```
  npm run build
  ```
  Hasil build ada di folder `dist/`.
- Preview hasil build (opsional):
  ```
  npm run serve
  ```
  Lalu buka `http://localhost:8080` (port dari http-server bisa berbeda di mesin Anda).

## Konfigurasi API (WAJIB)
Aplikasi membaca Base URL & Token dari localStorage melalui halaman “Tentang”:
1. Buka menu “Tentang”.
2. Isi Base URL, contoh: `https://story-api.dicoding.dev/v1`
3. Jika API butuh autentikasi, isi Token (Bearer token).
4. Klik “Simpan Pengaturan”.

Catatan:
- Sesuai ketentuan penilaian, API key/token yang digunakan juga harus dicantumkan pada berkas `STUDENT.txt` di root proyek (untuk keperluan review).
- Aplikasi runtime TIDAK membaca `STUDENT.txt`. File ini hanya dokumentasi nilai credential yang digunakan.

## Panduan Uji Kriteria (Step-by-step)
Berikut langkah yang bisa diikuti reviewer untuk memverifikasi seluruh kriteria:

### Kriteria 1: SPA dan Transisi Halaman
- Navigasi tanpa reload (hash routing): klik menu Beranda, Peta, Tambah, Tentang.
- Transisi halaman halus terlihat saat berpindah route.
- Arsitektur MVP:
  - Folder `src/scripts/presenters/` berisi Presenter.
  - Folder `src/scripts/views/` berisi View.
- Fallback CSS aktif jika browser tidak mendukung View Transitions API.

Lokasi file:
- Router: `src/scripts/router/hash-router.js`
- Orkestrasi App + transisi: `src/scripts/pages/app.js`
- View/Presenter: `src/scripts/views/*`, `src/scripts/presenters/*`

### Kriteria 2: Menampilkan Data dan Marker pada Peta
- Halaman “Beranda” memuat daftar cerita dari API:
  - Tampilkan gambar + ≥3 teks (nama, deskripsi ringkas, tanggal).
- Halaman “Peta”:
  - Marker dan popup (gambar + ringkasan).
  - Interaktivitas (Skilled): klik item daftar → peta fokus + popup; klik marker → item daftar di-highlight.
  - Multiple tile layers (Advance): ganti layer via kontrol kanan atas (OSM, CARTO Light, Esri Imagery).

Lokasi file:
- API client: `src/scripts/data/api-client.js`, `src/scripts/data/config.js`
- Beranda: `src/scripts/presenters/HomePresenter.js`, `src/scripts/views/HomeView.js`
- Peta: `src/scripts/presenters/MapPresenter.js`, `src/scripts/views/MapView.js`
- Leaflet assets (icon fix): `src/scripts/utils/leaflet-assets.js`

### Kriteria 3: Memiliki Fitur Tambah Data Baru
- Halaman “Tambah”:
  - Pilih lokasi via klik peta (marker draggable), otomatis isi lat/lon.
  - Upload file gambar ATAU gunakan kamera:
    - “Mulai Kamera”, “Ambil Foto”, “Hentikan Kamera”
    - Stream kamera dimatikan saat panel ditutup/navigasi.
  - Validasi form (client-side): deskripsi minimal 5 karakter, foto wajib, lokasi wajib.
  - Pengiriman async ke API menggunakan Fetch + FormData.
  - Pesan sukses/gagal jelas (aria-live).
  
Lokasi file:
- Add Form: `src/scripts/presenters/AddPresenter.js`, `src/scripts/views/AddView.js`
- Kamera: `src/scripts/utils/camera.js`

### Kriteria 4: Aksesibilitas sesuai Standar
- Alt pada setiap gambar (kosong `""` jika dekoratif).
- HTML semantik, label pada input.
- Skip to content: tautan “Lewati ke konten utama”.
- Keyboard operable:
  - Tombol menu dengan `aria-controls` dan `aria-expanded`.
  - ESC menutup menu.
  - Fokus berpindah ke judul halaman saat route berubah.
  - Daftar lokasi di Peta menggunakan role yang sesuai (listbox/option) dan `aria-selected`.
- Responsif:
  - 375px (mobile), 768px (tablet), 1024px (desktop) tanpa elemen bertumpuk.
- Reduced Motion:
  - Transisi/animasi dinonaktifkan saat preferensi pengguna “Reduce motion” aktif.

Lokasi file:
- Struktur HTML: `src/index.html`
- Gaya & responsif & aksesibilitas: `src/styles/styles.css`
- Focus management: `src/scripts/pages/app.js`

## Struktur Proyek
```
src/
  index.html
  styles/
    styles.css
  scripts/
    index.js
    pages/
      app.js
    router/
      hash-router.js
    data/
      api-client.js
      config.js
    presenters/
      HomePresenter.js
      MapPresenter.js
      AddPresenter.js
      AboutPresenter.js
      DetailPresenter.js
    views/
      HomeView.js
      MapView.js
      AddView.js
      AboutView.js
      DetailView.js
    utils/
      leaflet-assets.js
      camera.js
      format.js
public/ (disalin ke dist saat build)
```

## Teknologi
- Bundler: Webpack
- Peta: Leaflet + OpenStreetMap (tanpa API key)
- Transisi: View Transitions API + fallback CSS
- Akses Kamera: MediaStream (getUserMedia)

## Packaging Submission (ZIP)
- Jalankan `npm run build` untuk menghasilkan folder `dist/`.
- Buat ZIP berisi seluruh proyek (bukan hanya dist), termasuk:
  - `src/`, `webpack.*.js`, `package.json`, `package-lock.json`, `STUDENT.txt`, aset, dst.
- Sertakan video cara pengiriman (sesuai instruksi Dicoding).
- Hindari submit berkali-kali agar review tidak tertunda.

## Catatan
- Jika Story API membutuhkan token, pastikan:
  - Di-runtime: set lewat halaman “Tentang”.
  - Untuk reviewer: cantumkan nilai token pada `STUDENT.txt`.
- Hindari plagiat. Kode ini adalah hasil implementasi sendiri untuk memenuhi kriteria tugas.

Selamat mencoba dan semoga lulus dengan nilai terbaik!