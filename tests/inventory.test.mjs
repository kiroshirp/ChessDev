import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCTS, calculate, prepareRequest } from '../rental.mjs';
import { validateCatalog, validateProduct, catalogProducts, PRODUCT_ID, PRODUCT_FIELDS, nextProductId, escapeHTML } from '../inventory.mjs';
import { sectionForPath } from '../routing.mjs';
const initial = () => ({ revision: 1, products: Object.fromEntries(PRODUCTS.map((p, i) => [p.id, { ...p, review: !!p.review, visible: true, position: i, replacementValue: 0 }])) });
test('inventario editable: precios y unidades actuales en el presupuesto', () => {
  const catalog = initial(); catalog.products.boards.price = 7.5; catalog.products.boards.max = 2;
  const products = catalogProducts(catalog, { publicOnly: true });
  assert.equal(calculate({ boards: 2 }, products).total, 65);
  assert.throws(() => calculate({ boards: 3 }, products));
  const request = prepareRequest({ quantities: { boards: 2 }, pickup: '2026-10-26T12:00', returns: '2026-10-27T12:00', customer: 'Persona', club: 'Club' }, Date.UTC(2026, 9, 25, 8), products);
  assert.match(request, /65,00/);
});
test('ocultar y ordenar material se refleja en el catálogo público', () => {
  const c = initial(); c.products.boards.visible = false; c.products.giant.position = 0;
  const p = catalogProducts(c, { publicOnly: true });
  assert.equal(p.length, 6); assert.ok(!p.some(v => v.id === 'boards')); assert.equal(p[0].id, 'giant');
});
test('el esquema rechaza campos extra, precios y unidades inválidos', () => {
  for (const change of [{ max: -1 }, { max: .5 }, { price: -2 }, { price: 2.345 }, { price: Infinity }, { kind: 'script' }, { visible: 1 }, { name: '  ' }, { extra: 'campo' }, { id: 'item-93' }]) {
    assert.throws(() => validateProduct({ ...initial().products.boards, ...change }));
  }
  const c = initial(); delete c.products.boards.name; assert.throws(() => validateCatalog(c));
  assert.throws(() => validateCatalog({ ...initial(), secret: true }));
});
test('las reglas exigen esquema exacto, administrador y máximo de 100 claves', async () => {
  const rules = JSON.parse(await readFile(new URL('../database.rules.json', import.meta.url), 'utf8')).rules;
  const root = rules.catalog, item = root.products.$id;
  assert.match(root['.write'], /auth\.uid === 'chessdev-admin'/);
  assert.equal(rules['.write'], false);
  assert.equal(root.$other['.validate'], false); assert.equal(item.$other['.validate'], false);
  assert.equal(Object.keys(item).filter(k => !k.startsWith('.') && k !== '$other').length, PRODUCT_FIELDS.length);
  assert.match(root['.validate'], /hasChildren\(\['revision', 'products'\]\)/);
  for (const field of PRODUCT_FIELDS) assert.ok(item['.validate'].includes(`'${field}'`));
  const slots = Object.keys(initial().products);
  for (let i = 0; i < 1000; i++) if (PRODUCT_ID.test(`item-${String(i).padStart(2, '0')}`)) slots.push(`item-${String(i).padStart(2, '0')}`);
  assert.equal(slots.length, 100); assert.equal(new Set(slots).size, 100);
  const rulePattern = new RegExp(item['.validate'].match(/matches\(\/(.*?)\/\)/)[1]);
  for (const id of [...slots, 'item-93', 'item-100', 'not-permitted']) assert.equal(rulePattern.test(id), PRODUCT_ID.test(id));
  assert.equal(nextProductId(initial().products), 'item-00');
});
test('los textos de materiales no pueden insertar HTML', () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('rutas sin fragmentos funcionan al entrar directamente', () => {
  assert.equal(sectionForPath('/ChessDev/material/', '/ChessDev/'), 'material');
  assert.equal(sectionForPath('/ChessDev/solicitud', '/ChessDev/'), 'solicitud');
  assert.equal(sectionForPath('/ChessDev/como-funciona/', '/ChessDev/'), 'funciona');
  assert.equal(sectionForPath('/otro/material/', '/ChessDev/'), null);
});
