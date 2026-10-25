export const MANAGEMENT_FEE = 50;
export const CONTACT = Object.freeze({ name: 'TopChess', phone: '613 133 823', whatsapp: '34613133823' });
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

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayNumber(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('Elige fechas válidas.');
  const [year, month, day] = iso.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  if (new Date(timestamp).toISOString().slice(0, 10) !== iso) throw new Error('Elige fechas válidas.');
  return timestamp / 86400000;
}

export function rentalDays(pickup, returns) {
  const days = dayNumber(returns) - dayNumber(pickup);
  if (days < 0) throw new Error('La devolución no puede ser anterior a la recogida.');
  return days;
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

export function prepareRequest({ quantities, pickup, returns, customer = '', club = '', notes = '' }, today = localDate(), products = PRODUCTS) {
  const quote = calculate(quantities, products);
  if (!quote.units) throw new Error('Selecciona al menos una unidad de material.');
  const days = rentalDays(pickup, returns);
  if (dayNumber(pickup) < dayNumber(today)) throw new Error('La recogida no puede ser en una fecha pasada.');
  if (!customer.trim()) throw new Error('Indica tu nombre y apellidos.');
  if (!club.trim()) throw new Error('Indica tu club o entidad.');
  if (customer.length > 100 || club.length > 160 || notes.length > 1000) throw new Error('El nombre, el club o las observaciones son demasiado largos.');
  const dateLabel = iso => iso.split('-').reverse().join('/');
  const custom = days > 2;
  return [
    `Hola ${CONTACT.name}, me gustaría solicitar material con ChessDev.`,
    '', `Nombre y apellidos: ${customer.trim()}`, `Club o entidad: ${club.trim()}`, `Recogida: ${dateLabel(pickup)}`, `Devolución: ${dateLabel(returns)}`,
    '', 'Material solicitado:', ...quote.selected.map(product => `- ${product.quantity} × ${product.name} (${euros(product.price)}/ud. para hasta 48 h)`),
    '', `Gestión urgente: ${euros(MANAGEMENT_FEE)}`,
    ...(custom ? ['Duración superior a 48 horas: solicito presupuesto específico.'] : [`Material: ${euros(quote.material)}`, `Total estimado: ${euros(quote.total)}`]),
    'Importe, impuestos, disponibilidad y horario pendientes de confirmación.',
    'Reposición: pérdida, no devolución o daño irreparable imputable al cliente implica abonar el coste íntegro de un producto nuevo equivalente, con valor documentado y acordado antes de contratar. Daños reparables: coste de reparación. Se excluye el desgaste normal.',
    ...(notes.trim() ? ['', `Observaciones: ${notes.trim()}`] : []),
    '', 'Por favor, confirmad el presupuesto, los valores de reposición a nuevo, las condiciones y la dirección de recogida por mensaje.',
  ].join('\n');
}

export function whatsappUrl(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}
