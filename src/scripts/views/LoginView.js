export default class LoginView {
  async render() {
    return `
      <section class="page" data-route="login">
        <h1 class="page-title" data-page-title>Masuk</h1>
        <p>Masuk untuk mendapatkan token otomatis dari Story API.</p>

        <div id="login-status" role="status" aria-live="polite" class="status-text"></div>
        <div id="login-actions" class="form-actions" style="margin:8px 0"></div>

        <form id="login-form" class="add-form" novalidate style="max-width:520px">
          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="nama@contoh.com" required />
          </div>

          <div class="form-field password-field">
            <label for="password">Kata Sandi</label>
            <div class="password-input-wrap">
              <input id="password" name="password" type="password" placeholder="Kata sandi" required />
              <button
                type="button"
                id="toggle-password"
                class="password-toggle"
                aria-label="Tampilkan kata sandi"
                aria-pressed="false"
                title="Tampilkan/sembunyikan kata sandi"
              >👁</button>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" id="login-submit">Masuk</button>
          </div>
        </form>

        <p>Belum punya akun? <a href="#/register">Daftar</a></p>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    const form = document.getElementById('login-form');
    const email = document.getElementById('email');
    const pass = document.getElementById('password');
    const statusEl = document.getElementById('login-status');
    const actions = document.getElementById('login-actions');
    const togglePw = document.getElementById('toggle-password');

    if (presenter.isAuthenticated()) {
      this._setStatus(statusEl, 'Anda sudah masuk. Klik tombol di bawah untuk ganti akun.');
      form.hidden = true;

      if (actions && !actions.querySelector('#login-switch')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'login-switch';
        btn.textContent = 'Keluar untuk ganti akun';
        btn.addEventListener('click', () => {
          presenter.logout();
          this._setStatus(statusEl, 'Silakan masukkan email dan kata sandi.');
          form.hidden = false;
          email?.focus();
          btn.remove();
        });
        actions.appendChild(btn);
      }
      return;
    }

    togglePw?.addEventListener('click', () => {
      const isText = pass.type === 'text';
      pass.type = isText ? 'password' : 'text';
      togglePw.setAttribute('aria-pressed', String(!isText));
      togglePw.setAttribute('aria-label', isText ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi');
      togglePw.textContent = isText ? '👁' : '🙈';
      if (!isText) pass.focus();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const em = email?.value?.trim() || '';
      const pw = pass?.value || '';
      if (!em || !pw) {
        this._setStatus(statusEl, 'Email dan kata sandi wajib diisi.', true);
        return;
      }
      try {
        this._setStatus(statusEl, 'Memproses...', false);
        await presenter.login({ email: em, password: pw });
        this._setStatus(statusEl, 'Berhasil masuk. Mengalihkan...', false, true);
        setTimeout(() => { window.location.hash = '#/'; }, 300);
      } catch (err) {
        const msg = err?.data?.message || err?.message || 'Login gagal.';
        this._setStatus(statusEl, msg, true);
      }
    });
  }

  _setStatus(el, text, isError = false, isSuccess = false) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('status--error', !!isError);
    el.classList.toggle('status--success', !!isSuccess);
  }
}