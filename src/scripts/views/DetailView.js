export default class DetailView {
  async render(params = {}) {
    const id = params.id || '(tanpa id)';
    return `
      <section class="page" data-route="detail">
        <h1 class="page-title" data-page-title>Detail Cerita</h1>
        <p>ID Cerita: <strong>${id}</strong></p>
        <p>Konten detail akan diisi setelah integrasi API di fase berikutnya.</p>
      </section>
    `;
  }

  async afterRender() {}
}