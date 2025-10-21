import Router from '../router/hash-router';
import HomeView from '../views/HomeView';
import AboutView from '../views/AboutView';
import MapView from '../views/MapView';
import AddView from '../views/AddView';
import DetailView from '../views/DetailView';

import HomePresenter from '../presenters/HomePresenter';
import AboutPresenter from '../presenters/AboutPresenter';
import MapPresenter from '../presenters/MapPresenter';
import AddPresenter from '../presenters/AddPresenter';
import DetailPresenter from '../presenters/DetailPresenter';

const ROUTES = {
  '/': { view: HomeView, presenter: HomePresenter, navKey: '/' },
  '/about': { view: AboutView, presenter: AboutPresenter, navKey: '/about' },
  '/map': { view: MapView, presenter: MapPresenter, navKey: '/map' },
  '/add': { view: AddView, presenter: AddPresenter, navKey: '/add' },
  '/detail/:id': { view: DetailView, presenter: DetailPresenter, navKey: '/' },
};

export default class App {
  constructor({ content, drawerButton, navigationDrawer }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;
    this._currentView = null;

    // Drawer accessibility & keyboard handling
    if (this._drawerButton && this._navigationDrawer) {
      this._onDrawerBtnClick = () => this._toggleDrawer();
      this._onKeydownGlobal = (e) => {
        // ESC untuk menutup
        if (e.key === 'Escape' && this._navigationDrawer.classList.contains('open')) {
          this._closeDrawer({ returnFocus: true });
        }
      };
      this._onNavClick = (e) => {
        const target = e.target;
        if (target && target.matches('a[href^="#/"]')) {
          // Tutup drawer saat link dipilih (penting di mobile dan keyboard)
          this._closeDrawer({ returnFocus: false });
        }
      };

      this._drawerButton.addEventListener('click', this._onDrawerBtnClick);
      document.addEventListener('keydown', this._onKeydownGlobal);
      this._navigationDrawer.addEventListener('click', this._onNavClick);
    }
  }

  async renderPage() {
    const { path, params } = Router.parse();
    const routeKey = ROUTES[path] ? path : '/';
    const route = ROUTES[routeKey];

    const view = new route.view();
    const presenter = new route.presenter(view);

    this._setActiveNav(route.navKey || routeKey);

    const render = async () => {
      // Bersihkan view sebelumnya (tutup kamera, dll.)
      if (this._currentView && typeof this._currentView.destroy === 'function') {
        try { await this._currentView.destroy(); } catch {}
      }

      const html = await view.render(params);
      this._content.innerHTML = html;
      await view.afterRender(params, presenter);
      this._currentView = view;

      // Focus management: fokuskan judul halaman
      const pageTitle = this._content.querySelector('[data-page-title]');
      if (pageTitle) {
        pageTitle.setAttribute('tabindex', '-1');
        pageTitle.focus({ preventScroll: true });
        pageTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        this._content.focus({ preventScroll: true });
      }
    };

    if (document.startViewTransition) {
      await document.startViewTransition(render).finished;
    } else {
      this._content.classList.add('fade-out');
      await new Promise((r) => setTimeout(r, 100));
      await render();
      this._content.classList.remove('fade-out');
      this._content.classList.add('fade-in');
      setTimeout(() => this._content.classList.remove('fade-in'), 200);
    }
  }

  _toggleDrawer() {
    const isOpen = this._navigationDrawer.classList.toggle('open');
    this._drawerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    this._drawerButton.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');

    if (isOpen) {
      // Pindahkan fokus ke link pertama di nav
      const firstLink = this._navigationDrawer.querySelector('a[href^="#/"]');
      firstLink?.focus();
    } else {
      // Kembalikan fokus ke tombol
      this._drawerButton.focus();
    }
  }

  _closeDrawer({ returnFocus = true } = {}) {
    if (!this._navigationDrawer.classList.contains('open')) return;
    this._navigationDrawer.classList.remove('open');
    this._drawerButton.setAttribute('aria-expanded', 'false');
    this._drawerButton.setAttribute('aria-label', 'Buka menu');
    if (returnFocus) this._drawerButton.focus();
  }

  _setActiveNav(navKey) {
    const navList = document.getElementById('nav-list');
    if (!navList) return;
    const links = navList.querySelectorAll('a[href^="#/"]');
    links.forEach((a) => {
      const hrefKey = (a.getAttribute('href') || '#/').replace('#', '');
      if (hrefKey === navKey) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('active');
      } else {
        a.removeAttribute('aria-current');
        a.classList.remove('active');
      }
    });
  }
}