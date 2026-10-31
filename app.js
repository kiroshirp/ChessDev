import { CATALOG } from './catalog-static.mjs';
import { escapeHTML } from './inventory.mjs';
import { startRoutes } from './routing.mjs';
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

const euros=value=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value);
document.getElementById('catalog').innerHTML=CATALOG.map(p=>({...p,name:escapeHTML(p.name),description:escapeHTML(p.description)})).map(product=>`<article class="product-card"><div class="product-visual">${productArt(product)}</div><div class="product-info"><h3>${product.name}</h3><span class="product-price">${euros(product.price)} <small>/ ud.</small></span></div><div class="product-bottom"><p>${product.description}</p></div></article>`).join('');
const example=CATALOG.find(p=>p.kind==='board');
document.getElementById('single-item-example').textContent=example?`Como referencia, ${example.name} (${euros(example.price)}) más la gestión de 50 € suman ${euros(example.price+50)}. No se tramitan pedidos desde esta web.`:'El sistema de pedidos está desactivado.';
startRoutes();
