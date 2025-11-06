// Tambahkan route '/login' dan '/register' ke switch

const normalizePath = (path) => {
  if (!path) return '/';
  if (path === '') return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const Router = {
  parse() {
    const raw = window.location.hash.slice(1) || '/';
    const [rawPath] = raw.split('?');
    const path = normalizePath(rawPath);

    if (path.startsWith('/detail/')) {
      const id = path.replace('/detail/', '');
      return { path: '/detail/:id', params: { id } };
    }

    switch (path) {
      case '/':
      case '/about':
      case '/map':
      case '/add':
      case '/login':
      case '/register':
        return { path, params: {} };
      default:
        return { path: '/', params: {} };
    }
  },
};

export default Router;