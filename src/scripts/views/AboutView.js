export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi ini dibuat untuk memenuhi submission: Berbagi Cerita, dengan fokus pada SPA, peta, aksesibilitas, dan form tambah data.</p>
        <p>Fase berikutnya akan menambahkan integrasi API, peta interaktif, dan fitur tambah cerita.</p>
      </section>
    `;
  }

  async afterRender() {}
}