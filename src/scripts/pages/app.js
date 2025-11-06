import Router from '../router/hash-router';
import { getApiToken, clearAuth, getAuthUser } from '../data/config';

// IMPORT views & presenters sesuai struktur kamu
import HomeView from '../views/HomeView';
import LoginView from '../views/LoginView';
import RegisterView from '../views/RegisterView';
import AboutView from '../views/AboutView';
import MapView from '../views/MapView';
import AddView from '../views/AddView';
import DetailView from '../views/DetailView';

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
      drawerButton.addEventListener('click', () => this._toggleDrawer());
      navigationDrawer.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#/"]')) this._closeDrawer({ returnFocus: false });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navigationDrawer.classList.contains('open')) {
          this._closeDrawer();
        }
      });
    }
  }

  async renderPage() {
    const { path, params } = Router.parse();
    const route = ROUTES[path] || ROUTES['/'];

    const authenticated = !!getApiToken();

    // Guard
    if (route.requiresAuth && !authenticated) {
      window.location.hash = '#/login';
      return;
    }
    if (!route.requiresAuth && (path === '/login' || path === '/register') && authenticated) {
      window.location.hash = '#/';
      return;
    }

    const view = new route.view();
    const presenter = new route.presenter(view);

    const html = await view.render(params);
    this._content.innerHTML = html;
    await view.afterRender(params, presenter);
    this._currentView = view;

    this._updateAuthNav();
    this._setActiveNav(route.navKey);
    const title = this._content.querySelector('[data-page-title]');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus();
    }
  }

  _updateAuthNav() {
    const token = getApiToken();
    const nav = document.getElementById('nav-list');
    const loginLink = nav?.querySelector('a[href="#/login"]');
    const regLink = nav?.querySelector('a[href="#/register"]');
    const logoutBtn = document.getElementById('logout-button');
    const userStatus = document.getElementById('user-status');

    if (token) {
      const { name } = getAuthUser();
      if (userStatus) userStatus.textContent = `Masuk sebagai ${(name || '').trim() || 'Pengguna'}`;
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
    const open = nav.classList.toggle('open');
    this._drawerButton?.setAttribute('aria-expanded', String(open));
  }

  _closeDrawer({ returnFocus = true } = {}) {
    const nav = this._navigationDrawer;
    if (!nav || !nav.classList.contains('open')) return;
    nav.classList.remove('open');
    this._drawerButton?.setAttribute('aria-expanded', 'false');
    if (returnFocus) this._drawerButton?.focus();
  }
}