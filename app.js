import { PRODUCTS, calculate, euros, localDate, prepareRequest, rentalDays, whatsappUrl } from './rental.mjs';

const byId = id => document.getElementById(id);
const quantities = Object.fromEntries(PRODUCTS.map(product => [product.id, 0]));
const form = byId('rental-form');
const pickup = byId('pickup');
const returns = byId('return');
const feedback = byId('form-feedback');

function productArt(product) {
  const board = `<g transform="translate(20 34) rotate(-10 65 43)"><rect x="-4" y="-4" width="138" height="94" rx="2" fill="#273c30"/><rect width="130" height="86" fill="url(#checks-${product.id})"/></g>`;
  const pawn = `<path d="M63 113h44l-3-10H66zM68 100h34l-9-38H77z"/><ellipse cx="85" cy="61" rx="16" ry="5"/><circle cx="85" cy="43" r="15"/>`;
  let art;
  if (product.kind === 'clock') {
    art = `<g transform="translate(12 40) rotate(-6 70 25)"><path d="M7 0h132l12 58H-5z" fill="${product.id === 'leap' ? '#485c71' : '#263a2e'}"/><rect x="8" y="12" width="128" height="29" rx="2" fill="#dbe1c6"/><path d="M71 15v24" stroke="#263a2e"/><text x="13" y="33" font-family="monospace" font-size="18" fill="#263a2e">05:00</text><text x="77" y="33" font-family="monospace" font-size="18" fill="#263a2e">05:00</text><path d="M18-6h40v7H18zM85-6h40v7H85z" fill="#f4f1e9"/></g>`;
  } else if (product.kind === 'mural') {
    art = `<path d="M40 130l42-117 40 117M82 61v69" fill="none" stroke="#2c3d31" stroke-width="4"/><g transform="translate(27 21)"><rect x="-3" y="-3" width="116" height="88" fill="#233a2d"/><rect width="110" height="82" fill="url(#checks-${product.id})"/><circle cx="47" cy="38" r="7" fill="#ed633d"/><circle cx="75" cy="62" r="7" fill="#ede9d8" stroke="#25382c"/></g>`;
  } else if (product.kind === 'pieces') {
    art = `<g fill="#314936" transform="translate(34 3) scale(.9)">${pawn}</g><g fill="#f2efdd" stroke="#c4c0a8" transform="translate(-28 17) scale(.85)">${pawn}</g>`;
  } else if (product.kind === 'giant') {
    art = `<ellipse cx="85" cy="120" rx="53" ry="9" fill="#c2c9b8"/><g fill="#f5f0dd" stroke="#b6b9a6" transform="translate(-20 -5) scale(1.25)">${pawn}</g>`;
  } else if (product.kind === 'folding') {
    art = board + `<path d="M87 24l15 84" stroke="#142c27" stroke-width="2"/><g fill="#edeee1" stroke="#afb7a3" transform="translate(25 40) scale(.5)">${pawn}</g>`;
  } else art = board;
  return `<svg viewBox="0 0 170 140" aria-hidden="true"><defs><pattern id="checks-${product.id}" width="32" height="24" patternUnits="userSpaceOnUse"><rect width="32" height="24" fill="#eee9d8"/><path d="M0 0h16v12H0zM16 12h16v12H16z" fill="${product.kind === 'folding' ? '#476583' : '#445b45'}"/></pattern></defs>${art}</svg>`;
}

function renderProducts() {
  byId('catalog').innerHTML = PRODUCTS.map(product => `<article class="product-card"><div class="product-visual"><span class="product-count">Hasta ${product.max} ${product.max === 1 ? 'unidad' : 'unidades'}</span>${productArt(product)}</div><div class="product-info"><h3>${product.name}</h3><span class="product-price">${product.price} € <small>/ ud.</small></span></div><div class="product-bottom"><p>${product.description}</p><button type="button" class="add-button" data-add="${product.id}" aria-label="Añadir ${product.name.toLowerCase()} a la solicitud">+</button></div></article>`).join('');
  byId('quantity-list').innerHTML = PRODUCTS.map(product => `<div class="quantity-row"><label class="quantity-name" for="qty-${product.id}">${product.plural}<small>${product.price} €/ud. · máximo ${product.max}${product.review ? ' · revisión previa' : ''}</small></label><div class="quantity-control"><button type="button" data-step="-1" data-product="${product.id}" aria-label="Quitar una unidad de ${product.name.toLowerCase()}">−</button><input id="qty-${product.id}" name="${product.id}" type="number" min="0" max="${product.max}" step="1" value="0" required inputmode="numeric"><button type="button" data-step="1" data-product="${product.id}" aria-label="Añadir una unidad de ${product.name.toLowerCase()}">+</button></div></div>`).join('');
}

function syncInputs() {
  for (const product of PRODUCTS) quantities[product.id] = Number(byId(`qty-${product.id}`).value);
}

function updateEstimate() {
  syncInputs();
  let quote;
  try { quote = calculate(quantities); }
  catch (error) {
    byId('grand-total').textContent = 'Revisa cantidades';
    byId('grand-total').classList.add('custom-quote');
    feedback.textContent = error.message;
    return;
  }
  feedback.textContent = '';
  byId('manual-copy').hidden = true;
  byId('unit-count').textContent = `(${quote.units} ud.)`;
  byId('material-total').textContent = euros(quote.material);
  let custom = false;
  returns.setCustomValidity('');
  if (pickup.value && returns.value) {
    try { custom = rentalDays(pickup.value, returns.value) > 2; }
    catch (error) { returns.setCustomValidity(error.message); }
  }
  byId('grand-total').classList.toggle('custom-quote', custom);
  byId('grand-total').textContent = custom ? 'A consultar' : euros(quote.total);
  byId('total-label').textContent = custom ? 'Presupuesto específico' : 'Total estimado';
  byId('duration-note').textContent = custom
    ? 'Más de 48 horas: el material requiere una tarifa específica. Los precios por unidad mostrados corresponden a hasta 48 horas. Importe e impuestos a confirmar.'
    : 'Hasta 48 horas, con horas de recogida y devolución a acordar. Importe e impuestos a confirmar en el presupuesto definitivo.';
  for (const product of PRODUCTS) {
    form.querySelector(`[data-product="${product.id}"][data-step="-1"]`).disabled = quantities[product.id] <= 0;
    form.querySelector(`[data-product="${product.id}"][data-step="1"]`).disabled = quantities[product.id] >= product.max;
    const add = document.querySelector(`[data-add="${product.id}"]`);
    add.disabled = quantities[product.id] >= product.max;
    add.setAttribute('aria-label', `Añadir ${product.name.toLowerCase()} a la solicitud${quantities[product.id] ? ` (${quantities[product.id]} seleccionados)` : ''}`);
  }
}

function changeQuantity(id, step) {
  const product = PRODUCTS.find(item => item.id === id);
  const input = byId(`qty-${id}`);
  const current = Number(input.value);
  input.value = Math.max(0, Math.min(product.max, (Number.isFinite(current) ? Math.trunc(current) : 0) + step));
  updateEstimate();
}

function validatedRequest() {
  const today = localDate();
  pickup.min = today;
  returns.min = pickup.value || today;
  updateEstimate();
  if (!form.reportValidity()) return null;
  try {
    return prepareRequest({ quantities, pickup: pickup.value, returns: returns.value, customer: byId('customer').value, club: byId('club').value, notes: byId('notes').value }, today);
  } catch (error) {
    feedback.textContent = error.message;
    if (!calculate(quantities).units) byId('qty-boards').focus();
    return null;
  }
}

renderProducts();
pickup.min = localDate();
returns.min = pickup.min;
updateEstimate();

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const step = event.target.closest('[data-step]');
  if (add) {
    changeQuantity(add.dataset.add, 1);
    feedback.textContent = 'Material añadido a tu solicitud.';
  }
  if (step) changeQuantity(step.dataset.product, Number(step.dataset.step));
});

form.addEventListener('input', event => {
  if (event.target.type === 'number' || event.target.type === 'date') {
    if (event.target === pickup) returns.min = pickup.value || localDate();
    updateEstimate();
  } else feedback.textContent = '';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = validatedRequest();
  if (!text) return;
  window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
  feedback.textContent = 'Solicitud preparada. Revísala y pulsa enviar en WhatsApp. La disponibilidad aún no está confirmada.';
});

byId('copy-request').addEventListener('click', async () => {
  const text = validatedRequest();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    feedback.textContent = 'Solicitud copiada. Pégala y envíala por mensaje a TopChess: 613 133 823. Todavía no se ha enviado.';
  } catch {
    byId('manual-copy').hidden = false;
    byId('request-text').value = text;
    byId('request-text').focus();
    byId('request-text').select();
    feedback.textContent = 'Copia el resumen y envíalo por mensaje a TopChess: 613 133 823. Todavía no se ha enviado.';
  }
});
