export async function withViewTransition(renderFn) {
  if (document.startViewTransition) {
    return document.startViewTransition(renderFn).finished;
  }
  const root = document.getElementById('main-content');
  if (root) root.classList.add('view-fade-enter');
  try {
    await renderFn();
  } finally {
    if (root) {
      setTimeout(() => root.classList.remove('view-fade-enter'), 220);
    }
  }
}