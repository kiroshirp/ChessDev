export const ROUTES = Object.freeze({ material: 'material', 'como-funciona': 'funciona', solicitud: 'solicitud' });
export function sectionForPath(pathname, basePath) {
  if (!pathname.startsWith(basePath)) return null;
  return ROUTES[pathname.slice(basePath.length).replace(/\/$/, '')] || null;
}

export function startRoutes() {
  const base = new URL('.', import.meta.url);
  if (location.hash) {
    const legacy = Object.entries(ROUTES).find(([, section]) => section === location.hash.slice(1));
    history.replaceState(null, '', legacy ? new URL(`${legacy[0]}/`, base).pathname : location.pathname + location.search);
  }
  const scroll = (section, focus = false) => {
    const target = document.getElementById(section || 'contenido');
    if (!target) return;
    if (section) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-route]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = new URL(link.href);
    if (location.pathname !== target.pathname || location.hash) history.pushState(null, '', target.pathname);
    scroll(link.dataset.route || null, true);
  });
  document.querySelector('.skip-link')?.addEventListener('click', event => { event.preventDefault(); scroll('contenido', true); });
  window.addEventListener('popstate', () => scroll(sectionForPath(location.pathname, base.pathname)));
  scroll(sectionForPath(location.pathname, base.pathname));
}
