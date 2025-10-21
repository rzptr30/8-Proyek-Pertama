const normalizePath = (path) => {
  if (!path) return '/';
  if (path === '') return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const Router = {
  parse() {
    // Contoh hash: "#/detail/abc123?foo=bar"
    const raw = window.location.hash.slice(1) || '/';
    const [rawPath, rawQuery] = raw.split('?');
    const path = normalizePath(rawPath);

    // Dynamic route: /detail/:id
    if (path.startsWith('/detail/')) {
      const id = path.replace('/detail/', '');
      return { path: '/detail/:id', params: { id } };
    }

    // Statis
    switch (path) {
      case '/':
      case '/about':
      case '/map':
      case '/add':
        return { path, params: {} };
      default:
        return { path: '/', params: {} };
    }
  },
};

export default Router;