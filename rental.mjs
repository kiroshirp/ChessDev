export const MANAGEMENT_FEE = 50;
export const CONTACT = Object.freeze({ name: 'TopChess', phone: '613 133 823', whatsapp: '34613133823', address: 'Eugenio Salazar 54, 28002 Madrid', metro: 'Concha Espina (línea 9) y Prosperidad (línea 4)' });
export const PRODUCTS = Object.freeze([
  { id: 'boards', name: 'Tablero normal', plural: 'Tableros normales', price: 5, max: 15, kind: 'board', description: 'La base de una buena partida.' },
  { id: 'pieces', name: 'Juego de piezas', plural: 'Juegos completos de piezas', price: 5, max: 12, kind: 'pieces', description: 'Juego completo. Recuento previo.', review: true },
  { id: 'dgt', name: 'Reloj DGT Easy', plural: 'Relojes DGT Easy', price: 10, max: 6, kind: 'clock', description: 'Que cada segundo cuente.' },
  { id: 'leap', name: 'Reloj Leap', plural: 'Relojes Leap', price: 10, max: 7, kind: 'clock', description: 'Listo para la siguiente ronda.' },
  { id: 'folding', name: 'Set plegable', plural: 'Sets plegables', price: 10, max: 5, kind: 'folding', description: 'Tablero y piezas. Revisión previa.', review: true },
  { id: 'mural', name: 'Tablero mural', plural: 'Tableros murales', price: 25, max: 1, kind: 'mural', description: 'Para que todos sigan la jugada.' },
  { id: 'giant', name: 'Ajedrez gigante', plural: 'Ajedreces gigantes', price: 60, max: 1, kind: 'giant', description: 'Una partida a lo grande.' },
]);

export const euros = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

export const MIN_NOTICE_HOURS = 10;
export const MAX_RENTAL_HOURS = 48;
const HOUR = 3600000;
const madridFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function madridDateTime(timestamp = Date.now()) {
  const p = Object.fromEntries(madridFormatter.formatToParts(timestamp).map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function madridTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Indica fecha y hora de recogida y devolución.');
  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  const utc = Date.UTC(year, month - 1, day, hour, minute);
  const candidates = [60, 120].map(offset => utc - offset * 60000).filter(timestamp => madridDateTime(timestamp) === value);
  if (candidates.length === 0) throw new Error('Fecha u hora no válida en Madrid. Elige otra hora.');
  if (candidates.length > 1) throw new Error('Esa hora se repite por el cambio de horario en Madrid. Elige una hora fuera del cambio.');
  return candidates[0];
}

export function minimumPickup(now = Date.now()) {
  return madridDateTime(Math.ceil((now + MIN_NOTICE_HOURS * HOUR) / 60000) * 60000);
}

export function rentalWindow(pickup, returns, now = Date.now()) {
  const pickupAt = madridTimestamp(pickup);
  const returnAt = madridTimestamp(returns);
  if (!Number.isFinite(now)) throw new Error('No se ha podido comprobar la hora actual.');
  if (pickupAt - now < MIN_NOTICE_HOURS * HOUR) throw new Error('Necesitamos al menos 10 horas de antelación antes de la recogida. No aceptamos solicitudes con menos margen.');
  if (returnAt <= pickupAt) throw new Error('La devolución debe ser posterior a la recogida.');
  if (returnAt - pickupAt > MAX_RENTAL_HOURS * HOUR) throw new Error('La duración máxima del alquiler es de 48 horas. Elige una devolución dentro de ese plazo.');
  return { pickupAt, returnAt, hours: (returnAt - pickupAt) / HOUR };
}

export function calculate(quantities, products = PRODUCTS) {
  let units = 0;
  let material = 0;
  const selected = [];
  for (const product of products) {
    const quantity = quantities[product.id] ?? 0;
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > product.max) {
      throw new Error(`La cantidad de ${product.name.toLowerCase()} debe estar entre 0 y ${product.max}.`);
    }
    if (quantity) selected.push({ ...product, quantity });
    units += quantity;
    material += quantity * product.price;
  }
  return { units, material, total: MANAGEMENT_FEE + material, selected };
}

export function prepareRequest({ quantities, pickup, returns, customer = '', club = '', notes = '' }, now = Date.now(), products = PRODUCTS) {
  const quote = calculate(quantities, products);
  if (!quote.units) throw new Error('Selecciona al menos una unidad de material.');
  const window = rentalWindow(pickup, returns, now);
  if (!customer.trim()) throw new Error('Indica tu nombre y apellidos.');
  if (!club.trim()) throw new Error('Indica la entidad organizadora: club, federación, empresa u otra entidad.');
  if (customer.length > 100 || club.length > 160 || notes.length > 1000) throw new Error('El nombre, el club o las observaciones son demasiado largos.');
  const dateLabel = value => { const [date, time] = value.split('T'); return `${date.split('-').reverse().join('/')} a las ${time} (hora de Madrid)`; };
  return [
    `Hola ${CONTACT.name}, me gustaría solicitar material con ChessDev.`,
    '', `Nombre y apellidos: ${customer.trim()}`, `Entidad organizadora: ${club.trim()}`, `Recogida: ${dateLabel(pickup)}`, `Devolución: ${dateLabel(returns)}`,
    `Duración solicitada: ${Number(window.hours.toFixed(2))} h (máximo 48 h).`,
    `Solicitud preparada: ${dateLabel(madridDateTime(now))}.`,
    'TopChess debe recibir la solicitud al menos 10 horas antes de la recogida. Comprobará el margen al recibir el mensaje y confirmará el horario; no se aceptan solicitudes con menos antelación.',
    '', 'Material solicitado:', ...quote.selected.map(product => `- ${product.quantity} × ${product.name} (${euros(product.price)}/ud. para hasta 48 h)`),
    '', `Gestión urgente: ${euros(MANAGEMENT_FEE)}`,
    `Material: ${euros(quote.material)}`, `Total estimado: ${euros(quote.total)}`,
    'IVA incluido. Disponibilidad y horario pendientes de confirmación. Pago solo por transferencia tras confirmar y antes de entregar el material. Cancelación sin cargos antes de la entrega.',
    'Reposición: pérdida, no devolución o daño irreparable imputable al cliente implica abonar el coste íntegro de un producto nuevo equivalente, con valor documentado y acordado antes de contratar. Daños reparables: coste de reparación. Se excluye el desgaste normal.',
    ...(notes.trim() ? ['', `Observaciones: ${notes.trim()}`] : []),
    '', `Recogida en ${CONTACT.name}: ${CONTACT.address}.`, `Metros cercanos: ${CONTACT.metro}.`,
    'Por favor, confirmad el presupuesto, los valores de reposición a nuevo, las condiciones y la hora de recogida por mensaje.',
  ].join('\n');
}

export function whatsappUrl(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}
