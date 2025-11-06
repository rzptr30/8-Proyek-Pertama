import Router from '../router/hash-router';
import HomeView from '../views/HomeView';
import AboutView from '../views/AboutView';
import MapView from '../views/MapView';
import AddView from '../views/AddView';
import DetailView from '../views/DetailView';
import LoginView from '../views/LoginView';
import RegisterView from '../views/RegisterView';

import HomePresenter from '../presenters/HomePresenter';
import AboutPresenter from '../presenters/AboutPresenter';
import MapPresenter from '../presenters/MapPresenter';
import AddPresenter from '../presenters/AddPresenter';
import DetailPresenter from '../presenters/DetailPresenter';
import LoginPresenter from '../presenters/LoginPresenter';
import RegisterPresenter from '../presenters/RegisterPresenter';

import { getApiToken, clearAuth, getAuthUser } from '../data/config';

const ROUTES = {
  '/': { view: HomeView, presenter: HomePresenter, navKey: '/' },
  '/about': { view: AboutView, presenter: AboutPresenter, navKey: '/about' },
  '/map': { view: MapView, presenter: MapPresenter, navKey: '/map' },
  '/add': { view: AddView, presenter: AddPresenter, navKey: '/add', requiresAuth: true },
  '/login': { view: LoginView, presenter: LoginPresenter, navKey: '/login' },
  '/register': { view: RegisterView, presenter: RegisterPresenter, navKey: '/register' },
  '/detail/:id': { view: DetailView, presenter: DetailPresenter, navKey: '/' },
};

export default class App {
  constructor({ content, drawerButton, navigationDrawer }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;
    this._currentView = null;

    if (this._drawerButton && this._navigationDrawer) {
      this._onDrawerBtnClick = () => this._toggleDrawer();
      this._onKeydownGlobal = (e) => {
        if (e.key === 'Escape' && this._navigationDrawer.classList.contains('open')) {
          this._closeDrawer({ returnFocus: true });
        }
      };
      this._onNavClick = (e) => {
        const target = e.target;
        if (target && target.matches('a[href^="#/"]')) {
          this._closeDrawer({ returnFocus: false });
        }
      };

      this._drawerButton.addEventListener('click', this._onDrawerBtnClick);
      document.addEventListener('keydown', this._onKeydownGlobal);
      this._navigationDrawer.addEventListener('click', this._onNavClick);
    }

    // Tombol Logout
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearAuth();
        this._updateAuthNav();
        window.location.hash = '#/login';
      });
    }
  }

  async renderPage() {
    const { path, params } = Router.parse();
    const routeKey = ROUTES[path] ? path : '/';
    const route = ROUTES[routeKey];

    if (route.requiresAuth && !getApiToken()) {
      window.location.hash = '#/login';
      return;
    }

    const view = new route.view();
    const presenter = new route.presenter(view);

    this._setActiveNav(route.navKey || routeKey);

    const render = async () => {
      if (this._currentView && typeof this._currentView.destroy === 'function') {
        try { await this._currentView.destroy(); } catch {}
      }

      const html = await view.render(params);
      this._content.innerHTML = html;
      await view.afterRender(params, presenter);
      this._currentView = view;

      // Update status auth di navbar setiap render halaman
      this._updateAuthNav();

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

  _updateAuthNav() {
    const token = getApiToken();
    const user = getAuthUser();

    const nav = document.getElementById('nav-list');
    const loginLink = nav?.querySelector('a[href="#/login"]');
    const regLink = nav?.querySelector('a[href="#/register"]');
    const logoutBtn = document.getElementById('logout-button');
    const userStatus = document.getElementById('user-status');

    if (token) {
      // Tampilkan nama user
      const name = (user?.name || '').trim() || 'Pengguna';
      if (userStatus) userStatus.textContent = `Masuk sebagai ${name}`;

      // Toggle nav
      loginLink?.setAttribute('hidden', 'true');
      regLink?.setAttribute('hidden', 'true');
      if (logoutBtn) logoutBtn.hidden = false;
    } else {
      if (userStatus) userStatus.textContent = 'Belum masuk';
      loginLink?.removeAttribute('hidden');
      regLink?.removeAttribute('hidden');
      if (logoutBtn) logoutBtn.hidden = true;
    }
  }

  _toggleDrawer() {
    const isOpen = this._navigationDrawer.classList.toggle('open');
    this._drawerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    this._drawerButton.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
    if (isOpen) {
      const firstLink = this._navigationDrawer.querySelector('a[href^="#/"]');
      firstLink?.focus();
    } else {
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