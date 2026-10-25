import { authenticate, readCatalog, saveCatalog } from './catalog-api.mjs';
import { catalogProducts, validateProduct, escapeHTML, nextProductId } from './inventory.mjs';
import { euros } from './rental.mjs';
import { mountOrders,clearOrders } from './admin-orders.mjs';

const el = id => document.getElementById(id);
let session = null;
let catalog = null;
let etag = null;
let busy = false;
let deleteId = null;

function message(text) { el('admin-feedback').textContent = text; }
function setBusy(value) {
  busy = value;
  for (const button of document.querySelectorAll('#dashboard button,#save-product,#confirm-delete')) button.disabled = value;
}
function render() {
  const products = catalogProducts(catalog);
  el('inventory-count').textContent = `${products.length} artículos · ${products.filter(p => p.visible).length} visibles · revisión ${catalog.revision}`;
  el('admin-products').innerHTML = products.map(product => `<article class="admin-item"><div><span class="tag">${product.visible ? 'Visible' : 'Oculto'}${product.max === 0 ? ' · Sin unidades' : ''}</span><h2>${escapeHTML(product.name)}</h2><p>${product.max} unidades · ${euros(product.price)} / ud. · Reposición: ${product.replacementValue ? euros(product.replacementValue) : 'pendiente de valorar'}</p><p>${escapeHTML(product.description)}</p></div><div class="item-actions"><button type="button" class="button secondary" data-edit="${product.id}">Editar</button><button type="button" class="copy-button" data-toggle="${product.id}">${product.visible ? 'Ocultar' : 'Publicar'}</button><button type="button" class="copy-button" data-delete="${product.id}">Eliminar</button></div></article>`).join('');
}
async function refresh() {
  const result = await readCatalog();
  catalog = result.catalog;
  etag = result.etag;
  render();
}
function logout(text = '') {
  session = null;
  clearOrders();
  catalog = null;
  etag = null;
  el('dashboard').hidden = true;
  el('login-panel').hidden = false;
  el('admin-products').replaceChildren();
  el('password').value = '';
  el('product-form').reset();
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  el('login-feedback').textContent = text;
}
async function commit(next) {
  if (busy) return false;
  setBusy(true);
  try {
    catalog = await saveCatalog(next, etag, session);
    etag = null;
    render();
    message('Cambios guardados. Ya están disponibles en la web pública.');
    try { await refresh(); }
    catch { message('Cambios guardados. No se ha podido recargar la revisión: pulsa Recargar antes de volver a editar.'); }
    return true;
  } catch (error) {
    message(error.message);
    el('editor-feedback').textContent = error.message;
    if (!session || session.expiresAt <= Date.now()) logout('La sesión ha caducado. Vuelve a iniciar sesión.');
    return false;
  } finally { setBusy(false); }
}

function edit(product = null) {
  el('editor-title').textContent = product ? 'Editar material' : 'Añadir material';
  el('product-id').value = product?.id || nextProductId(catalog.products);
  for (const [field, key, fallback] of [
    ['name', 'name', ''], ['plural', 'plural', ''], ['description', 'description', ''],
    ['price', 'price', 0], ['stock', 'max', 0], ['kind', 'kind', 'board'],
    ['position', 'position', Object.keys(catalog.products).length], ['replacement', 'replacementValue', 0],
  ]) el(`product-${field}`).value = product?.[key] ?? fallback;
  el('product-visible').checked = product?.visible ?? true;
  el('product-review').checked = product?.review ?? false;
  el('editor-feedback').textContent = '';
  el('editor').showModal();
  el('product-name').focus();
}

el('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  el('login-button').disabled = true;
  el('login-feedback').textContent = 'Comprobando acceso…';
  try {
    session = await authenticate(el('username').value.trim(), el('password').value);
    await refresh();
    await mountOrders(session,refresh);
    el('login-panel').hidden = true;
    el('dashboard').hidden = false;
    el('login-feedback').textContent = '';
    message('Sesión iniciada. Por seguridad, se cierra al recargar o después de una hora.');
  } catch (error) { session = null; el('login-feedback').textContent = error.message; }
  finally { el('password').value = ''; el('login-button').disabled = false; }
});

el('logout').addEventListener('click', () => logout('Sesión cerrada.'));
el('reload-catalog').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  try { await refresh(); message('Inventario actualizado.'); }
  catch (error) { message(error.message); }
  finally { setBusy(false); }
});
el('new-product').addEventListener('click', () => {
  if (Object.keys(catalog.products).length >= 100) { message('El catálogo admite hasta 100 artículos.'); return; }
  edit();
});
el('close-editor').addEventListener('click', () => { if (!busy) el('editor').close(); });
el('editor').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
el('product-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  try {
    const product = validateProduct({
      id: el('product-id').value, name: el('product-name').value.trim(), plural: el('product-plural').value.trim(),
      description: el('product-description').value.trim(), price: Number(el('product-price').value), max: Number(el('product-stock').value),
      kind: el('product-kind').value, position: Number(el('product-position').value), replacementValue: Number(el('product-replacement').value),
      visible: el('product-visible').checked, review: el('product-review').checked,
    });
    const next = structuredClone(catalog);
    next.products[product.id] = product;
    next.revision++;
    if (await commit(next)) el('editor').close();
  } catch (error) { el('editor-feedback').textContent = error.message; }
});
el('admin-products').addEventListener('click', async event => {
  if (busy) return;
  const editButton = event.target.closest('[data-edit]');
  const toggleButton = event.target.closest('[data-toggle]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) edit(catalog.products[editButton.dataset.edit]);
  if (toggleButton) {
    const next = structuredClone(catalog);
    next.products[toggleButton.dataset.toggle].visible = !next.products[toggleButton.dataset.toggle].visible;
    next.revision++;
    await commit(next);
  }
  if (deleteButton) {
    if (Object.keys(catalog.products).length === 1) { message('Mantén al menos un artículo. Puedes ocultarlo si no está disponible.'); return; }
    deleteId = deleteButton.dataset.delete;
    el('delete-description').textContent = catalog.products[deleteId].name;
    el('delete-dialog').showModal();
  }
});
el('cancel-delete').addEventListener('click', () => el('delete-dialog').close());
el('delete-dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
el('confirm-delete').addEventListener('click', async () => {
  if (busy || !deleteId) return;
  const next = structuredClone(catalog);
  delete next.products[deleteId];
  next.revision++;
  if (await commit(next)) { el('delete-dialog').close(); deleteId = null; }
});
setInterval(() => { if (session && Date.now() >= session.expiresAt) logout('La sesión ha caducado. Vuelve a iniciar sesión.'); }, 30000);
