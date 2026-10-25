export const KINDS = Object.freeze(['board', 'pieces', 'clock', 'folding', 'mural', 'giant']);
export const PRODUCT_FIELDS = Object.freeze(['id', 'name', 'plural', 'price', 'max', 'kind', 'description', 'review', 'visible', 'position', 'replacementValue']);
export const PRODUCT_ID = /^(boards|pieces|dgt|leap|folding|mural|giant|item-(0[0-9]|[1-8][0-9]|9[0-2]))$/;

export function nextProductId(products) {
  for (let index = 0; index < 93; index++) {
    const id = `item-${String(index).padStart(2, '0')}`;
    if (!Object.hasOwn(products, id)) return id;
  }
  throw new Error('No quedan identificadores para nuevos artículos. Edita un material existente.');
}

export function validateProduct(product) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) throw new Error('Material inválido.');
  if (Object.keys(product).length !== PRODUCT_FIELDS.length || PRODUCT_FIELDS.some(key => !Object.hasOwn(product, key))) throw new Error('Completa todos los campos del material.');
  if (!PRODUCT_ID.test(product.id)) throw new Error('Identificador de material inválido.');
  for (const key of ['name', 'plural', 'description']) {
    if (typeof product[key] !== 'string' || !product[key].trim() || product[key].length > (key === 'description' ? 400 : 100)) throw new Error('Revisa el nombre y la descripción.');
  }
  for (const key of ['price', 'replacementValue']) {
    if (typeof product[key] !== 'number' || !Number.isFinite(product[key]) || product[key] < 0 || product[key] > 10000 || Math.abs(product[key] * 100 - Math.round(product[key] * 100)) > 0.000001) throw new Error('Los precios deben estar entre 0 y 10.000 €, con hasta dos decimales.');
  }
  if (!Number.isInteger(product.max) || product.max < 0 || product.max > 10000) throw new Error('La cantidad disponible debe ser un entero entre 0 y 10.000.');
  if (!Number.isInteger(product.position) || product.position < 0 || product.position > 10000) throw new Error('Orden de material inválido.');
  if (!KINDS.includes(product.kind) || typeof product.review !== 'boolean' || typeof product.visible !== 'boolean') throw new Error('Revisa el tipo y el estado de publicación.');
  return product;
}

export function validateCatalog(value) {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 2 || !Number.isInteger(value.revision) || value.revision < 1 || !value.products || typeof value.products !== 'object' || Array.isArray(value.products)) throw new Error('El catálogo no tiene un formato válido.');
  const items = Object.entries(value.products);
  if (items.length < 1 || items.length > 100) throw new Error('El catálogo debe contener entre 1 y 100 artículos.');
  for (const [key, product] of items) {
    validateProduct(product);
    if (key !== product.id) throw new Error('Identificador de catálogo inconsistente.');
  }
  return value;
}

export function catalogProducts(value, { publicOnly = false } = {}) {
  validateCatalog(value);
  return Object.values(value.products).filter(product => !publicOnly || product.visible).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
