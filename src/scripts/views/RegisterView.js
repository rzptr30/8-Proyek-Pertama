export default class RegisterView {
  async render() {
    return `
      <section class="page" data-route="register">
        <h1 class="page-title" data-page-title>Daftar</h1>
        <p>Buat akun baru, lalu Anda akan otomatis masuk.</p>

        <div id="reg-status" role="status" aria-live="polite" class="status-text"></div>

        <form id="reg-form" class="add-form" novalidate style="max-width:520px">
          <div class="form-field">
            <label for="name">Nama</label>
            <input id="name" name="name" type="text" placeholder="Nama lengkap" required />
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="nama@contoh.com" required />
          </div>

          <div class="form-field password-field">
            <label for="password">Kata Sandi</label>
            <div class="password-input-wrap">
              <input id="password" name="password" type="password" placeholder="Minimal 6 karakter" required minlength="6" />
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
            <button type="submit" id="reg-submit">Daftar</button>
          </div>
        </form>

        <p>Sudah punya akun? <a href="#/login">Masuk</a></p>
      </section>
    `;
  }

  async afterRender(_params, presenter) {
    const form = document.getElementById('reg-form');
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const pass = document.getElementById('password');
    const statusEl = document.getElementById('reg-status');
    const togglePw = document.getElementById('toggle-password');

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
      const nm = name?.value?.trim() || '';
      const em = email?.value?.trim() || '';
      const pw = pass?.value || '';
      if (!nm || !em || !pw) {
        this._setStatus(statusEl, 'Semua field wajib diisi.', true);
        return;
      }
      try {
        this._setStatus(statusEl, 'Memproses...', false);
        await presenter.register({ name: nm, email: em, password: pw });
        this._setStatus(statusEl, 'Registrasi berhasil. Mengalihkan...', false, true);
        setTimeout(() => { window.location.hash = '#/'; }, 400);
      } catch (err) {
        const msg = err?.data?.message || err?.message || 'Registrasi gagal.';
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