export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // Relatif terhadap lokasi halaman -> bekerja di localhost dan GitHub Pages (/8-Proyek-Pertama/)
    const reg = await navigator.serviceWorker.register('sw.js');

    // Opsional: deteksi update SW
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('sw:update', { detail: { updated: true } }));
        }
      });
    });

    return reg;
  } catch (e) {
    console.error('[SW] Registration failed:', e);
  }
}