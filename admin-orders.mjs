import { readState,mutateState } from './operations-api.mjs';
import { changeBooking,newBooking,STATES,requestTotal,displayDate,COMMERCIAL } from './orders.mjs';
import { escapeHTML } from './inventory.mjs';
import { euros } from './rental.mjs';
import { downloadOrderPDF } from './order-pdf.mjs';

const el=id=>document.getElementById(id),safe=escapeHTML;
let session=null,state=null,refreshInventory=null,selected=null,shownAt=0,working=false;
const getOrder=id=>state.bookings?.[id]||newBooking(state.requests[id]);
const stateLabel=b=>STATES[b.status]||'Solicitud pendiente';
function feedback(text){el('orders-feedback').textContent=text;}
async function refresh(){state=(await readState(session)).state;renderList();}
function renderList() {
  const ids=[...new Set([...Object.keys(state.requests||{}),...Object.keys(state.bookings||{})])];
  const filter=el('order-filter').value,query=el('order-search').value.toLowerCase().trim();
  const orders=ids.map(getOrder).sort((a,b)=>b.createdAt-a.createdAt).filter(b=>(!filter||b.status===filter)&&(!query||`${b.reference} ${b.customer} ${b.organization}`.toLowerCase().includes(query)));
  el('orders-count').textContent=`${ids.length} solicitudes · ${Object.values(state.bookings||{}).filter(b=>b.status==='confirmed').length} reservas confirmadas`;
  el('orders-list').innerHTML=orders.map(b=>`<article class="admin-item"><div><span class="tag">${safe(stateLabel(b))}${b.status==='collected'&&b.returnAt<Date.now()?' · Devolución vencida':''}</span><h3>${safe(b.reference)} · ${safe(b.customer)}</h3><p>${safe(b.organization)} · ${safe(b.contact)}</p><p>${safe(displayDate(b.pickupAt))} → ${safe(displayDate(b.returnAt))}</p><p>${euros(requestTotal(b))} · IVA incluido · ${Object.values(b.items).reduce((n,i)=>n+i.quantity,0)} unidades</p></div><button type="button" class="button secondary" data-open-order="${b.id}">Gestionar ↗</button></article>`).join('')||'<p>No hay solicitudes con estos filtros.</p>';
}
function orderDetails() {
  const b=getOrder(selected);shownAt=b.changedAt;
  el('order-title').textContent=b.reference;
  el('order-info').textContent=`${b.customer} / ${b.organization} / ${b.contact}. ${displayDate(b.pickupAt)} → ${displayDate(b.returnAt)}. ${stateLabel(b)}.`;
  el('order-notes').textContent=b.notes||'Sin observaciones del solicitante.';
  el('order-customer-document').value=b.customerDocument||'';
  el('order-lines').innerHTML=Object.entries(b.items).map(([id,i])=>`<div class="order-line"><strong>${safe(i.name)} · ${i.quantity} ud.</strong><span>Alquiler: ${euros(b.status==='draft'?(state.catalog.products[id]?.price??i.unitPrice):i.unitPrice)}/ud. (IVA incluido)</span><label>Reposición acordada €/ud.<input data-replacement="${id}" type="number" min="0.01" max="10000" step="0.01" value="${i.replacementValue}" ${b.status==='draft'?'':'readonly'}></label></div>`).join('');
  const total=b.status==='draft'?b.managementFee+Object.entries(b.items).reduce((sum,[id,i])=>sum+i.quantity*(state.catalog.products[id]?.price??i.unitPrice),0):requestTotal(b);
  el('order-total').textContent=`Presupuesto para este pedido: ${euros(total)} · IVA incluido. Gestión: ${euros(b.managementFee)}.`;
  el('order-actions').innerHTML=b.status==='draft'?'<label class="check-label"><input id="client-accepted" type="checkbox"> El cliente acepta el presupuesto mostrado, la reposición y las condiciones.</label><button class="button secondary" data-order-action="review">Guardar presupuesto actualizado</button><button class="button primary" data-order-action="confirm">Confirmar y bloquear material</button>':'';
  if(['draft','confirmed'].includes(b.status))el('order-actions').innerHTML+='<button class="copy-button" data-order-action="cancel">Cancelar sin cargos</button>';
  if(['confirmed','collected','returned','incident'].includes(b.status)&&b.payment.status==='pending')el('order-actions').innerHTML+='<button class="button secondary" data-order-action="payment">Registrar transferencia recibida</button>';
  if(b.status==='cancelled'&&b.payment.status==='received')el('order-actions').innerHTML+='<button class="button secondary" data-order-action="refund">Registrar reembolso por transferencia</button>';
  el('handover-section').hidden=b.status!=='confirmed';
  el('return-section').hidden=!['collected','incident'].includes(b.status);
  el('missing-button').hidden=!(b.status==='collected'&&b.returnAt<=Date.now());
  el('resolve-button').hidden=b.status!=='incident';
  el('return-lines').innerHTML=Object.entries(b.items).map(([id,i])=>`<div class="order-line"><strong>${safe(i.name)} · ${i.quantity} entregadas</strong><div class="field-grid"><label>Total devueltas acumuladas<input data-returned="${id}" type="number" min="${b.returnRecord.items?.[id]?.returned||0}" max="${i.quantity}" step="1" value="${b.returnRecord.items?.[id]?.returned??i.quantity}"></label><label>De las devueltas, dañadas<input data-damaged="${id}" type="number" min="0" max="${i.quantity}" step="1" value="${b.returnRecord.items?.[id]?.damaged||0}"></label></div><label>Estado / incidencias<input data-return-note="${id}" maxlength="300" value="${safe(b.returnRecord.items?.[id]?.note||'')}"></label></div>`).join('');
  for(const id of ['contract-signed','handover-signed','return-signed','material-restored'])el(id).checked=false;
  for(const id of ['handover-note','return-note','operation-note','transfer-reference'])el(id).value='';
  el('order-document-feedback').textContent='';
  const history=Object.entries(b.returnHistory||{});
  el('return-history').innerHTML=history.map(([key,r])=>`<button type="button" class="copy-button" data-return-pdf="${key}">Acta de devolución: ${safe(displayDate(r.at))} ↓</button>`).join('');
  el('order-saved-events').textContent=`Pago: ${b.payment.status==='received'?'transferencia recibida':b.payment.status==='refunded'?'reembolsado':'pendiente'}.${b.handover.at?` Entrega registrada ${displayDate(b.handover.at)}.`:''}${b.returnRecord.at?` Última devolución ${displayDate(b.returnRecord.at)}.`:''}${b.incident.note?` Incidencia: ${b.incident.note}`:''}`;
}
async function openOrder(id){await refresh();selected=id;orderDetails();el('order-dialog').showModal();}
function busy(value){working=value;for(const b of el('order-dialog').querySelectorAll('button'))b.disabled=value;}
async function act(action) {
  if(working)return;
  const b=getOrder(selected),payload={note:el('operation-note').value,reference:el('transfer-reference').value};
  if(action==='review'||action==='confirm') {
    payload.customerDocument=el('order-customer-document').value;
    payload.replacements=Object.fromEntries([...el('order-lines').querySelectorAll('[data-replacement]')].map(input=>[input.dataset.replacement,Number(input.value)]));
    payload.clientAccepted=el('client-accepted')?.checked||false;
    if(action==='confirm'&&!payload.clientAccepted){el('order-document-feedback').textContent='Confirma primero la aceptación del cliente.';return;}
  }
  if(action==='identity')payload.customerDocument=el('order-customer-document').value;
  if(action==='collect'){payload.paperSigned=el('handover-signed').checked;payload.contractSigned=el('contract-signed').checked;payload.note=el('handover-note').value;}
  if(action==='return') {
    payload.paperSigned=el('return-signed').checked;payload.note=el('return-note').value;
    payload.items=Object.fromEntries(Object.keys(b.items).map(id=>[id,{returned:Number(el('return-lines').querySelector(`[data-returned="${id}"]`).value),damaged:Number(el('return-lines').querySelector(`[data-damaged="${id}"]`).value),note:el('return-lines').querySelector(`[data-return-note="${id}"]`).value}]));
  }
  if(action==='resolve')payload.materialRestored=el('material-restored').checked;
  if(action==='cancel'&&!el('cancel-order-confirm').checked){el('order-document-feedback').textContent='Marca la confirmación de cancelación antes de continuar.';return;}
  busy(true);
  try {
    const expected=shownAt,prices=Object.fromEntries(Object.keys(b.items).map(id=>[id,state.catalog.products[id]?.price]));
    const result=await mutateState(session,root=>{
      const live=root.bookings?.[selected]||newBooking(root.requests[selected]);
      if(live.changedAt!==expected)throw Error('Este pedido ha cambiado. Cierra y vuelve a abrirlo antes de continuar.');
      if(action==='confirm') {
        if(Object.keys(prices).some(id=>root.catalog.products[id]?.price!==prices[id]))throw Error('Los precios han cambiado. Reabre el pedido y revisa el presupuesto con el cliente.');
        changeBooking(root,selected,'review',payload);
      }
      changeBooking(root,selected,action,payload);
    });
    state=result.state;renderList();orderDetails();el('order-document-feedback').textContent='Operación guardada. El inventario por fechas se ha actualizado.';
    await refreshInventory?.();
  } catch(error){el('order-document-feedback').textContent=error.message;}
  finally{busy(false);}
}
export async function mountOrders(auth,onInventoryRefresh) {
  session=auth;refreshInventory=onInventoryRefresh;await refresh();
  const settings=state.settings||{};el('provider-name').value=settings.legalName||'';el('provider-tax-id').value=settings.taxId||'';el('provider-payment').value=settings.paymentInstructions||'';
}
export function clearOrders(){session=null;state=null;selected=null;el('orders-list').replaceChildren();}
document.addEventListener('click',async event=>{
  const tab=event.target.closest('[data-admin-view]');
  if(tab){const view=tab.dataset.adminView;for(const name of ['inventory','orders','settings']){el(`view-${name}`).hidden=name!==view;document.querySelector(`[data-admin-view="${name}"]`).setAttribute('aria-selected',String(name===view));}if(view==='orders'&&session)try{await refresh();}catch(error){feedback(error.message);}}
  const open=event.target.closest('[data-open-order]');if(open)try{await openOrder(open.dataset.openOrder);}catch(error){feedback(error.message);}
  const action=event.target.closest('[data-order-action]');if(action)await act(action.dataset.orderAction);
  const pdf=event.target.closest('[data-order-pdf]');
  if(pdf&&selected)try{await downloadOrderPDF(getOrder(selected),pdf.dataset.orderPdf,state.settings||{});}catch(error){el('order-document-feedback').textContent=error.message;}
  const historical=event.target.closest('[data-return-pdf]');
  if(historical&&selected)try{const b=getOrder(selected);await downloadOrderPDF({...b,returnRecord:b.returnHistory[historical.dataset.returnPdf],incident:{...b.incident,note:''}},'return',state.settings||{});}catch(error){el('order-document-feedback').textContent=error.message;}
});
el('close-order').addEventListener('click',()=>{if(!working)el('order-dialog').close();});
el('order-dialog').addEventListener('cancel',event=>{if(working)event.preventDefault();});
el('order-filter').addEventListener('change',()=>{if(state)renderList();});el('order-search').addEventListener('input',()=>{if(state)renderList();});
el('refresh-orders').addEventListener('click',async()=>{try{await refresh();feedback('Gestión actualizada.');}catch(error){feedback(error.message);}});
el('provider-form').addEventListener('submit',async event=>{
  event.preventDefault();if(working)return;working=true;
  try{const settings={legalName:el('provider-name').value.trim(),taxId:el('provider-tax-id').value.trim(),paymentInstructions:el('provider-payment').value.trim()};const result=await mutateState(session,root=>{root.settings=settings;});state=result.state;el('provider-feedback').textContent='Datos guardados. Se usarán en los documentos de los pedidos.';await refreshInventory?.();}
  catch(error){el('provider-feedback').textContent=error.message;}finally{working=false;}
});
