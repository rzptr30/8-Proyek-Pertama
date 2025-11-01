// Simple hash router parser used by src/scripts/pages/app.js
// Simpan file ini persis di: src/scripts/router/hash-router.js

const normalizePath = (path) => {
  if (!path) return '/';
  if (path === '') return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const Router = {
  parse() {
    // Ambil hash tanpa '#'
    // Contoh hash: "#/detail/abc123?foo=bar"
    const raw = window.location.hash.slice(1) || '/';
    const [rawPath] = raw.split('?');
    const path = normalizePath(rawPath);

    // Route dinamis: /detail/:id
    if (path.startsWith('/detail/')) {
      const id = path.replace('/detail/', '');
      return { path: '/detail/:id', params: { id } };
    }

    // Route statis yang didukung aplikasi
    switch (path) {
      case '/':
      case '/about':
      case '/map':
      case '/add':
        return { path, params: {} };
      default:
        // fallback ke beranda jika route tidak dikenal
        return { path: '/', params: {} };
    }
  },
};

export default Router;