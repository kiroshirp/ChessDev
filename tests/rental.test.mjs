import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCTS, calculate, prepareRequest, rentalDays, whatsappUrl, localDate } from '../rental.mjs';

test('ejemplos comerciales: un tablero, cinco tableros y cinco relojes', () => {
  assert.equal(calculate({ boards: 1 }).total, 55);
  assert.equal(calculate({ boards: 5 }).total, 75);
  assert.equal(calculate({ dgt: 5 }).total, 100);
  assert.equal(calculate({ boards: 10 }).total, 100);
  assert.equal(calculate({ boards: 5, pieces: 5, leap: 5 }).total, 150);
  assert.equal(calculate({ boards: 5, leap: 5 }).total, 125);
});
test('una única gestión por solicitud y todo el inventario', () => {
  const quantities = Object.fromEntries(PRODUCTS.map(product => [product.id, product.max]));
  const quote = calculate(quantities);
  assert.equal(quote.units, 47);
  assert.equal(quote.material, 400);
  assert.equal(quote.total, 450);
});
test('cantidades negativas, decimales, no finitas o superiores al inventario se rechazan', () => {
  for (const amount of [-1, .5, NaN, Infinity, 16, '1']) assert.throws(() => calculate({ boards: amount }));
  assert.throws(() => calculate({ mural: 2 }));
});
test('fechas: mismo día, 48 horas y cambio de horario sin desfase', () => {
  assert.equal(rentalDays('2026-10-25', '2026-10-25'), 0);
  assert.equal(rentalDays('2026-10-24', '2026-10-26'), 2);
  assert.equal(rentalDays('2026-03-28', '2026-03-30'), 2);
  assert.throws(() => rentalDays('2026-10-26', '2026-10-25'));
  assert.throws(() => rentalDays('2026-02-30', '2026-03-03'));
  assert.throws(() => rentalDays('', '2026-10-25'));
  assert.equal(localDate(new Date(2026, 9, 25, 0, 5)), '2026-10-25');
});
const valid = { quantities: { boards: 5, leap: 5 }, pickup: '2026-10-26', returns: '2026-10-27', customer: 'Persona de prueba', club: 'Club de ajedrez', notes: 'A partir de las 17:00' };
test('solicitud con material, fechas, observaciones y confirmación pendiente', () => {
  const text = prepareRequest(valid, '2026-10-25');
  assert.match(text, /5 × Tablero normal/);
  assert.match(text, /125,00/);
  assert.match(text, /26\/10\/2026/);
  assert.match(text, /17:00/);
  assert.match(text, /Nombre y apellidos: Persona de prueba/);
  assert.match(text, /Club o entidad: Club de ajedrez/);
  assert.match(text, /coste íntegro de un producto nuevo equivalente/);
  assert.doesNotMatch(text, /fianza/i);
  assert.match(text, /pendientes de confirmación/);
  const url = new URL(whatsappUrl(text));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/34613133823');
  assert.equal(url.searchParams.get('text'), text);
});
test('más de 48 horas solicita presupuesto sin prometer un total incorrecto', () => {
  const text = prepareRequest({ ...valid, returns: '2026-10-30' }, '2026-10-25');
  assert.match(text, /presupuesto específico/);
  assert.doesNotMatch(text, /Total estimado/);
});
test('no se preparan solicitudes vacías, pasadas, sin nombre o con fechas invertidas', () => {
  for (const data of [{ quantities: {} }, { customer: '   ' }, { club: '' }, { club: '   ' }, { club: 'x'.repeat(161) }, { pickup: '2026-10-24' }, { returns: '2026-10-25' }, { pickup: '' }]) {
    assert.throws(() => prepareRequest({ ...valid, ...data }, '2026-10-25'));
  }
});
test('la web publica contacto por mensajes y recursos relativos compatibles con Pages', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Solo mensajes\. No llamadas\./);
  assert.match(html, /613 133 823/);
  assert.match(html, /Hecho por TopChess/);
  assert.doesNotMatch(html, /href="tel:/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
  assert.doesNotMatch(html, /fianza/i);
  assert.match(html, /id="customer"[^>]*required/);
  assert.match(html, /id="club"[^>]*required/);
});
