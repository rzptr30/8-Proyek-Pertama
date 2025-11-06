import Router from '../router/hash-router';
import { getApiToken, clearAuth, getAuthUser } from '../data/config';
import { withViewTransition } from '../utils/view-transition';

// Views
import HomeView from '../views/HomeView';
import LoginView from '../views/LoginView';
import RegisterView from '../views/RegisterView';
import AboutView from '../views/AboutView';
import MapView from '../views/MapView';
import AddView from '../views/AddView';
import DetailView from '../views/DetailView';

// Presenters
import HomePresenter from '../presenters/HomePresenter';
import LoginPresenter from '../presenters/LoginPresenter';
import RegisterPresenter from '../presenters/RegisterPresenter';
import AboutPresenter from '../presenters/AboutPresenter';
import MapPresenter from '../presenters/MapPresenter';
import AddPresenter from '../presenters/AddPresenter';
import DetailPresenter from '../presenters/DetailPresenter';

const ROUTES = {
  '/': { view: HomeView, presenter: HomePresenter, requiresAuth: true, navKey: '/' },
  '/about': { view: AboutView, presenter: AboutPresenter, navKey: '/about' },
  '/map': { view: MapView, presenter: MapPresenter, requiresAuth: true, navKey: '/map' },
  '/add': { view: AddView, presenter: AddPresenter, requiresAuth: true, navKey: '/add' },
  '/login': { view: LoginView, presenter: LoginPresenter, navKey: '/login' },
  '/register': { view: RegisterView, presenter: RegisterPresenter, navKey: '/register' },
  '/detail/:id': { view: DetailView, presenter: DetailPresenter, requiresAuth: true, navKey: '/' },
};

export default class App {
  constructor({ content, drawerButton, navigationDrawer }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;
    this._currentView = null;

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearAuth();
        this._updateAuthNav();
        window.location.hash = '#/login';
      });
    }

    if (drawerButton && navigationDrawer) {
      this._drawerButton.addEventListener('click', () => this._toggleDrawer());
      this._navigationDrawer.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#/"]')) {
          this._closeDrawer({ returnFocus: false });
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._navigationDrawer.classList.contains('open')) {
          this._closeDrawer({ returnFocus: true });
        }
      });
      // Initial ARIA
      this._drawerButton.setAttribute('aria-expanded', 'false');
      this._drawerButton.setAttribute('aria-label', 'Buka menu');
    }
  }

  async renderPage() {
    const { path, params } = Router.parse();
    const route = ROUTES[path] || ROUTES['/'];
    const authenticated = !!getApiToken();

    // Guard: butuh auth tapi belum login -> redirect login
    if (route.requiresAuth && !authenticated) {
      if (path !== '/login') {
        window.location.hash = '#/login';
      }
      return;
    }
    // Sudah login buka /login atau /register -> alihkan ke beranda
    if (!route.requiresAuth && (path === '/login' || path === '/register') && authenticated) {
      window.location.hash = '#/';
      return;
    }

    const view = new route.view();
    const presenter = new route.presenter(view);

    const doRender = async () => {
      if (this._currentView?.destroy) {
        try { await this._currentView.destroy(); } catch {}
      }
      const html = await view.render(params);
      this._content.innerHTML = html;
      await view.afterRender(params, presenter);
      this._currentView = view;

      this._updateAuthNav();
      this._setActiveNav(route.navKey);
      this._focusPageTitle();
    };

    await withViewTransition(doRender);
  }

  _focusPageTitle() {
    const title = this._content.querySelector('[data-page-title]');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    } else {
      this._content.setAttribute('tabindex', '-1');
      this._content.focus({ preventScroll: true });
    }
  }

  _updateAuthNav() {
    const token = getApiToken();
    const nav = document.getElementById('nav-list');
    const logoutBtn = document.getElementById('logout-button');
    const userStatus = document.getElementById('user-status');

    // Cari semua elemen link login/register (termasuk parent <li> kalau ada)
    const loginLinks = [
      ...document.querySelectorAll('a[href="#/login"], [data-nav="login"]'),
    ];
    const registerLinks = [
      ...document.querySelectorAll('a[href="#/register"], [data-nav="register"]'),
    ];

    const hide = (el) => {
      if (!el) return;
      el.setAttribute('hidden', 'true');
      el.setAttribute('aria-hidden', 'true');
      // Sembunyikan parent <li> jika ada
      if (el.parentElement && el.parentElement.tagName === 'LI') {
        el.parentElement.setAttribute('hidden', 'true');
        el.parentElement.setAttribute('aria-hidden', 'true');
      }
    };
    const show = (el) => {
      if (!el) return;
      el.removeAttribute('hidden');
      el.removeAttribute('aria-hidden');
      if (el.parentElement && el.parentElement.tagName === 'LI') {
        el.parentElement.removeAttribute('hidden');
        el.parentElement.removeAttribute('aria-hidden');
      }
    };

    if (token) {
      const { name } = getAuthUser();
      if (userStatus) userStatus.textContent = `Masuk sebagai ${(name || '').trim() || 'Pengguna'}`;
      loginLinks.forEach(hide);
      registerLinks.forEach(hide);
      if (logoutBtn) logoutBtn.hidden = false;
    } else {
      if (userStatus) userStatus.textContent = 'Belum masuk';
      loginLinks.forEach(show);
      registerLinks.forEach(show);
      if (logoutBtn) logoutBtn.hidden = true;
    }
  }

  _setActiveNav(key) {
    const navList = document.getElementById('nav-list');
    if (!navList) return;
    navList.querySelectorAll('a[href^="#/"]').forEach((a) => {
      const hrefKey = (a.getAttribute('href') || '#/').slice(1);
      if (hrefKey === key) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  }

  _toggleDrawer() {
    const nav = this._navigationDrawer;
    if (!nav) return;
    const opened = nav.classList.toggle('open');
    this._drawerButton?.setAttribute('aria-expanded', String(opened));
    this._drawerButton?.setAttribute('aria-label', opened ? 'Tutup menu' : 'Buka menu');
    if (opened) {
      const firstLink = nav.querySelector('a[href^="#/"]');
      firstLink?.focus();
    } else {
      this._drawerButton?.focus();
    }
  }

  _closeDrawer({ returnFocus = true } = {}) {
    const nav = this._navigationDrawer;
    if (!nav || !nav.classList.contains('open')) return;
    nav.classList.remove('open');
    this._drawerButton?.setAttribute('aria-expanded', 'false');
    this._drawerButton?.setAttribute('aria-label', 'Buka menu');
    if (returnFocus) this._drawerButton?.focus();
  }
}