import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCTS, calculate, prepareRequest, rentalWindow, madridTimestamp, minimumPickup, whatsappUrl } from '../rental.mjs';

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
const now = Date.UTC(2026, 9, 25, 8, 0);
const valid = { quantities: { boards: 5, leap: 5 }, pickup: '2026-10-26T12:00', returns: '2026-10-27T12:00', customer: 'Persona de prueba', club: 'Club de ajedrez', notes: 'A partir de las 17:00' };

test('se aceptan exactamente 10 horas de margen y 48 horas de alquiler', () => {
  assert.equal(rentalWindow('2026-10-25T19:00', '2026-10-27T19:00', now).hours, 48);
  assert.equal(rentalWindow('2026-10-25T19:00', '2026-10-25T20:00', now).hours, 1);
  assert.equal(minimumPickup(now + 1000), '2026-10-25T19:01');
});
test('se rechazan 9 h 59 min de margen, más de 48 h y devoluciones no posteriores', () => {
  assert.throws(() => rentalWindow('2026-10-25T18:59', '2026-10-26T18:59', now), /10 horas/);
  assert.throws(() => rentalWindow('2026-10-25T19:00', '2026-10-27T19:01', now), /48 horas/);
  assert.throws(() => rentalWindow('2026-10-25T19:00', '2026-10-25T19:00', now), /posterior/);
  assert.throws(() => rentalWindow('2026-10-25T19:00', '2026-10-25T18:00', now), /posterior/);
  assert.throws(() => rentalWindow('2026-10-25T19:00', '2026-10-26T19:00', now + 1000), /10 horas/);
});
test('los límites cuentan horas reales durante los cambios de horario de Madrid', () => {
  const beforeFall = Date.UTC(2026, 9, 23, 8);
  assert.throws(() => rentalWindow('2026-10-24T12:00', '2026-10-26T12:00', beforeFall), /48 horas/);
  assert.equal(rentalWindow('2026-10-24T12:00', '2026-10-26T11:00', beforeFall).hours, 48);
  assert.equal(rentalWindow('2026-03-28T12:00', '2026-03-30T13:00', Date.UTC(2026,2,27,8)).hours, 48);
  for (const value of ['2026-03-29T02:30','2026-10-25T02:30','2026-02-30T12:00','2026-10-26','']) assert.throws(() => madridTimestamp(value));
});
test('solicitud con material, fechas, observaciones y confirmación pendiente', () => {
  const text = prepareRequest(valid, now);
  assert.match(text, /5 × Tablero normal/);
  assert.match(text, /125,00/);
  assert.match(text, /26\/10\/2026/);
  assert.match(text, /17:00/);
  assert.match(text, /12:00 \(hora de Madrid\)/);
  assert.match(text, /10 horas/);
  assert.match(text, /máximo 48 h/);
  assert.match(text, /Nombre y apellidos: Persona de prueba/);
  assert.match(text, /Entidad organizadora: Club de ajedrez/);
  assert.match(text, /coste íntegro de un producto nuevo equivalente/);
  assert.doesNotMatch(text, /fianza/i);
  assert.match(text, /pendientes de confirmación/);
  const url = new URL(whatsappUrl(text));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/34613133823');
  assert.equal(url.searchParams.get('text'), text);
});
test('la solicitud no permite alquileres superiores a 48 horas', () => {
  assert.throws(() => prepareRequest({ ...valid, returns: '2026-10-30T12:00' }, now), /48 horas/);
});
test('no se preparan solicitudes vacías, pasadas, sin nombre o con fechas invertidas', () => {
  for (const data of [{ quantities: {} }, { customer: '   ' }, { club: '' }, { club: '   ' }, { club: 'x'.repeat(161) }, { pickup: '2026-10-24T12:00' }, { returns: '2026-10-25T12:00' }, { pickup: '' }]) {
    assert.throws(() => prepareRequest({ ...valid, ...data }, now));
  }
});
test('la web publica contacto por mensajes y recursos relativos compatibles con Pages', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Solo mensajes\. No llamadas\./);
  assert.match(html, /613 133 823/);
  assert.match(html, /Hecho por TopChess/);
  assert.doesNotMatch(html, /href="tel:/);
  assert.match(html, /<base href="\/ChessDev\/">/);
  assert.doesNotMatch(html, /<a[^>]*href="#/);
  assert.doesNotMatch(html, /<(?:a|link|script)[^>]*(?:src|href)="\/(?!\/)/);
  assert.doesNotMatch(html, /fianza/i);
  assert.doesNotMatch(html, /<form/);
  assert.match(html, /Pedidos desactivados/);
});
