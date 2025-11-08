const STATIC_ROUTES = new Set([
  '/',
  '/about',
  '/map',
  '/add',
  '/login',
  '/register',
]);

function normalize(p) {
  if (!p) return '/';
  return p.startsWith('/') ? p : `/${p}`;
}

const Router = {
  parse() {
    const raw = window.location.hash.slice(1) || '/';
    const [pathPart] = raw.split('?');
    const path = normalize(pathPart);

    if (path.startsWith('/detail/')) {
      const id = path.replace('/detail/', '');
      return { path: '/detail/:id', params: { id } };
    }

    if (STATIC_ROUTES.has(path)) return { path, params: {} };

    return { path: '/', params: {} };
  },
};

export default Router;