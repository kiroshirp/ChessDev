import { CONTACT, MANAGEMENT_FEE, madridTimestamp, madridDateTime, rentalWindow,euros } from './rental.mjs';
import { PRODUCT_ID } from './inventory.mjs';

export const TERMS_VERSION = '2026-10-25-reservas-iva-v1';
export const STATES = Object.freeze({ draft:'En revisión', confirmed:'Confirmada', collected:'Entregada', returned:'Devuelta', cancelled:'Cancelada', incident:'Con incidencia',resolved:'Incidencia cerrada' });
export const COMMERCIAL = Object.freeze({ tax:'IVA incluido', payment:'Solo transferencia bancaria, una vez confirmada la reserva y antes de entregar el material.', cancellation:'Cancelación sin cargos antes de la entrega. Si ya se ha abonado el alquiler, TopChess tramitará su devolución por transferencia.', delay:'No se aplican recargos automáticos por retraso. Debe comunicarse cualquier demora por mensaje. Las incidencias y los perjuicios acreditados se documentarán y, si procede, se reclamarán conforme a la normativa aplicable.' });
const text = (value, max, label, optional=false) => {
  if(typeof value!=='string' || value.length>max || (!optional && !value.trim()))throw Error(`Revisa ${label}.`);
  return value;
};
export const money = value => Math.round(value*100)/100;
export function requestTotal(request) {
  return money(request.managementFee + Object.values(request.items).reduce((sum,item)=>sum+item.quantity*item.unitPrice,0));
}
export function validateRequest(request) {
  if(!request || !/^[A-Za-z0-9_-]{1,128}$/.test(request.id))throw Error('Identificador de solicitud inválido.');
  if(!/^CD-[A-F0-9]{12}$/.test(request.reference))throw Error('Referencia inválida.');
  text(request.customer,100,'el nombre');text(request.organization,160,'la entidad');text(request.contact,30,'el teléfono');text(request.notes,1000,'las observaciones',true);
  if(!/^[+0-9 ()-]{7,30}$/.test(request.contact))throw Error('Indica un teléfono de contacto válido para mensajes.');
  if(!Number.isInteger(request.createdAt)||!Number.isInteger(request.pickupAt)||!Number.isInteger(request.returnAt)||request.returnAt<=request.pickupAt||request.returnAt-request.pickupAt>48*3600000)throw Error('Horarios de solicitud inválidos.');
  if(request.managementFee!==MANAGEMENT_FEE || typeof request.termsVersion!=='string'||!request.termsVersion||request.termsVersion.length>80)throw Error('Las condiciones no tienen un formato válido.');
  if(!request.items || typeof request.items!=='object' || !Object.keys(request.items).length || Object.keys(request.items).length>100)throw Error('Selecciona material para la solicitud.');
  for(const [id,item] of Object.entries(request.items)) {
    if(!PRODUCT_ID.test(id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10000)throw Error('Cantidad de material inválida.');
    text(item.name,100,'el nombre del material');
    for(const amount of [item.unitPrice,item.replacementValue])if(!Number.isFinite(amount)||amount<0||amount>10000||Math.abs(amount*100-Math.round(amount*100))>0.000001)throw Error('Importe de material inválido.');
  }
  return request;
}
export function createRequest(data, products, id, reference, now=Date.now()) {
  const period=rentalWindow(data.pickup,data.returns,now);
  const items={};
  for(const product of products) {
    const quantity=data.quantities[product.id]||0;
    if(!Number.isInteger(quantity)||quantity<0||quantity>product.max)throw Error('Revisa las cantidades solicitadas.');
    if(quantity)items[product.id]={name:product.name,quantity,unitPrice:product.price,replacementValue:product.replacementValue||0};
  }
  return validateRequest({id,reference,createdAt:now,pickupAt:period.pickupAt,returnAt:period.returnAt,customer:data.customer.trim(),organization:data.club.trim(),contact:data.contact.trim(),notes:(data.notes||'').trim(),items,managementFee:MANAGEMENT_FEE,termsVersion:TERMS_VERSION,status:'pending'});
}
export function newBooking(request, now=request?.createdAt||Date.now()) {
  validateRequest(request);
  return {...structuredClone(request),status:'draft',customerDocument:'',changedAt:now,clientAccepted:false,terms:structuredClone(COMMERCIAL),provider:{legalName:'',taxId:'',paymentInstructions:''},payment:{status:'pending',reference:'',at:0},handover:{at:0,note:'',paperSigned:false,contractSigned:false},returnRecord:{at:0,note:'',paperSigned:false,items:{}},incident:{open:false,note:'',resolvedAt:0}};
}
export function availabilityFor(booking, now=Date.now()) {
  const items={};
  if(['confirmed','collected'].includes(booking.status))for(const [id,item] of Object.entries(booking.items))items[id]=item.quantity;
  if(booking.status==='incident' && booking.incident.open)for(const [id,item] of Object.entries(booking.items)) {
    const record=booking.returnRecord.items?.[id];
    const held=record ? item.quantity-record.returned+record.damaged : item.quantity;
    if(held)items[id]=held;
  }
  if(!Object.keys(items).length)return null;
  const overdue=booking.status==='collected'&&booking.returnAt<=now;
  return {pickupAt:booking.pickupAt,returnAt:booking.returnAt,state:booking.status,indefinite:booking.status==='incident'||overdue,items};
}
export function peakHeld(availability, productId, start, end, excludeId='',now=Date.now()) {
  const events=[];
  for(const [id,block] of Object.entries(availability||{})) {
    if(id===excludeId||!block.items?.[productId])continue;
    const blockEnd=block.indefinite||(block.state==='collected'&&block.returnAt<=now)?Infinity:block.returnAt;
    if(block.pickupAt>=end||blockEnd<=start)continue;
    events.push([Math.max(start,block.pickupAt),block.items[productId]],[Math.min(end,blockEnd),-block.items[productId]]);
  }
  events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  let held=0,peak=0;for(const [,delta] of events){held+=delta;peak=Math.max(peak,held);}return peak;
}
export function availableProducts(products, availability, pickupAt, returnAt) {
  if(!Number.isFinite(pickupAt)||!Number.isFinite(returnAt)||returnAt<=pickupAt)return products;
  return products.map(p=>({...p,max:Math.max(0,p.max-peakHeld(availability,p.id,pickupAt,returnAt))}));
}
export function rebuildAvailability(state,now=Date.now()) {
  const result={};for(const [id,booking] of Object.entries(state.bookings||{})){const block=availabilityFor(booking,now);if(block)result[id]=block;}return result;
}
export function assertCapacity(state,now=Date.now()) {
  const blocks=rebuildAvailability(state,now);
  for(const [id,block] of Object.entries(blocks))for(const [productId,quantity] of Object.entries(block.items)) {
    const product=state.catalog.products[productId];
    if(!product)throw Error('No puedes eliminar material con reservas o incidencias abiertas. Ocúltalo temporalmente.');
    if(quantity+peakHeld(blocks,productId,block.pickupAt,block.indefinite?Infinity:block.returnAt,id,now)>product.max)throw Error(`No hay suficientes unidades de ${product.name} para esas fechas. Revisa las reservas y el inventario.`);
  }
  return blocks;
}
export function assertBookingCapacity(state,id,now=Date.now()) {
  const blocks=rebuildAvailability(state,now),block=blocks[id];if(!block)return;
  for(const [productId,quantity] of Object.entries(block.items)) {
    const p=state.catalog.products[productId];
    if(!p||quantity+peakHeld(blocks,productId,block.pickupAt,block.indefinite?Infinity:block.returnAt,id,now)>p.max)throw Error(`No hay suficientes unidades de ${p?.name||'un material solicitado'} para esas fechas. Revisa las reservas y el inventario.`);
  }
}
export function assertCatalogChange(state,next,now=Date.now()) {
  const blocks=rebuildAvailability(state,now);
  for(const [id,old] of Object.entries(state.catalog.products)) {
    const p=next.products[id];
    if((!p||p.max<old.max)&&peakHeld(blocks,id,-Infinity,Infinity,'',now)>(p?.max||0))throw Error(`No puedes reducir o eliminar ${old.name}: hay unidades reservadas, entregadas o con incidencias.`);
  }
}
export function changeBooking(state,id,action,payload={},now=Date.now()) {
  const current=state.bookings?.[id]||newBooking(state.requests?.[id]);
  const b=structuredClone(current);
  if(action==='review') {
    if(b.status!=='draft')throw Error('Solo se puede editar una solicitud en revisión.');
    b.customerDocument=text(payload.customerDocument||'',40,'el documento del cliente',true);
    for(const [productId,item] of Object.entries(b.items)) {
      const p=state.catalog.products[productId];if(!p)throw Error('Un artículo solicitado ya no está en el catálogo. Contacta con el cliente.');
      const replacement=payload.replacements?.[productId]??p.replacementValue;
      if(!Number.isFinite(replacement)||replacement<0||replacement>10000)throw Error('Valor de reposición inválido.');
      item.name=p.name;item.unitPrice=p.price;item.replacementValue=replacement;
    }
    b.clientAccepted=false;
    b.provider=structuredClone(state.settings||{legalName:'',taxId:'',paymentInstructions:''});b.terms=structuredClone(COMMERCIAL);b.termsVersion=TERMS_VERSION;
  } else if(action==='identity') {
    if(!['draft','confirmed'].includes(b.status))throw Error('La identificación queda conservada tras la entrega firmada. Registra cualquier rectificación como incidencia.');
    b.customerDocument=text(payload.customerDocument||'',40,'el documento del cliente',true);
    b.provider=structuredClone(state.settings||b.provider);
  } else if(action==='confirm') {
    if(b.status!=='draft'||!payload.clientAccepted)throw Error('Revisa el presupuesto y confirma que el cliente lo acepta antes de reservar.');
    if(b.pickupAt<=now)throw Error('La recogida ya ha pasado. No se puede confirmar esta solicitud.');
    if(Object.values(b.items).some(item=>item.replacementValue<=0))throw Error('Completa los valores de reposición antes de confirmar.');
    b.status='confirmed';b.clientAccepted=true;
  } else if(action==='payment') {
    if(!['confirmed','collected','returned','incident'].includes(b.status))throw Error('Confirma la reserva antes de registrar el pago.');
    b.payment={status:'received',reference:text(payload.reference||'',100,'la referencia de transferencia'),at:now};
  } else if(action==='collect') {
    if(b.status!=='confirmed'||b.payment.status!=='received')throw Error('La reserva debe estar confirmada y la transferencia recibida.');
    if(!payload.paperSigned||!payload.contractSigned)throw Error('Confirma las firmas del contrato y del acta de entrega en papel.');
    if(now-b.createdAt<10*3600000)throw Error('Deben transcurrir al menos 10 horas desde la solicitud antes de entregar.');
    if(now<b.pickupAt)throw Error('No se puede registrar la entrega antes de la hora de recogida reservada.');
    if(b.returnAt<=now||b.returnAt-now>48*3600000)throw Error('La entrega real debe permitir una devolución posterior y un alquiler de como máximo 48 horas.');
    b.status='collected';b.handover={at:now,note:text(payload.note||'',1000,'el estado de entrega',true),paperSigned:true,contractSigned:true};
  } else if(action==='return') {
    if(!['collected','incident'].includes(b.status)||!payload.paperSigned)throw Error('Registra la devolución y confirma el acta firmada en papel.');
    if(now<b.handover.at||now<(b.returnRecord.at||0))throw Error('La devolución no puede ser anterior a la entrega o a una devolución ya registrada.');
    const items={};let incident=false;
    for(const [productId,item] of Object.entries(b.items)) {
      const r=payload.items?.[productId];
      if(!r||!Number.isInteger(r.returned)||r.returned<0||r.returned>item.quantity||!Number.isInteger(r.damaged)||r.damaged<0||r.damaged>r.returned)throw Error('Revisa las cantidades devueltas y dañadas.');
      if(r.returned<(b.returnRecord.items?.[productId]?.returned||0))throw Error('El total acumulado devuelto no puede disminuir.');
      items[productId]={returned:r.returned,damaged:r.damaged,note:text(r.note||'',300,'el estado del material',true)};
      incident ||= r.returned<item.quantity||r.damaged>0;
    }
    b.returnRecord={at:now,note:text(payload.note||'',1000,'las observaciones de devolución',true),paperSigned:true,items};
    b.returnHistory||={};b.returnHistory[`r${now}`]=structuredClone(b.returnRecord);
    b.status=incident?'incident':'returned';b.incident={open:incident,note:incident?'Material pendiente o dañado; revisar y documentar.':'',resolvedAt:0};
  } else if(action==='missing') {
    if(b.status!=='collected'||now<b.returnAt)throw Error('Solo se puede registrar no devolución tras vencer el plazo de un alquiler entregado.');
    b.status='incident';b.incident={open:true,note:text(payload.note||'',1000,'la incidencia de no devolución'),resolvedAt:0};
  } else if(action==='resolve') {
    if(b.status!=='incident'||!payload.materialRestored)throw Error('Confirma que el material se ha repuesto o reparado antes de liberarlo.');
    b.status='resolved';b.incident={open:false,note:text(payload.note||'',1000,'la resolución'),resolvedAt:now};
  } else if(action==='cancel') {
    if(!['draft','confirmed'].includes(b.status))throw Error('La cancelación sin cargos se registra antes de entregar el material.');
    b.status='cancelled';b.incident.note=text(payload.note||'',1000,'la cancelación',true);
  } else if(action==='refund') {
    if(b.status!=='cancelled'||b.payment.status!=='received')throw Error('Solo se registra el reembolso de una reserva cancelada y abonada.');
    b.payment={status:'refunded',reference:text(payload.reference||'',100,'la referencia de reembolso'),at:now};
  } else throw Error('Operación no válida.');
  validateRequest(b);b.changedAt=now;
  const proposed={...state,bookings:{...(state.bookings||{}),[id]:b}};
  if(['confirm','collect'].includes(action))assertBookingCapacity(proposed,id,now);
  state.bookings=proposed.bookings;state.availability=rebuildAvailability(proposed,now);
  return b;
}
export function displayDate(timestamp) {
  const [date,time]=madridDateTime(timestamp).split('T');return `${date.split('-').reverse().join('/')} ${time} (Madrid)`;
}
export function registeredSummary(request) {
  return [`Hola TopChess, he registrado la solicitud ${request.reference}.`,'',`Nombre: ${request.customer}`,`Entidad organizadora: ${request.organization}`,`Teléfono para mensajes: ${request.contact}`,`Recogida: ${displayDate(request.pickupAt)}`,`Devolución: ${displayDate(request.returnAt)}`,'',...Object.values(request.items).map(i=>`${i.quantity} x ${i.name} / ${euros(i.unitPrice)}/ud.`),`Gestión: ${euros(request.managementFee)}`,`Total estimado: ${euros(requestTotal(request))} (IVA incluido).`,COMMERCIAL.payment,COMMERCIAL.cancellation,'Esta solicitud aún no confirma reserva. TopChess debe comprobar la disponibilidad y aceptar el pedido.',`Recogida en ${CONTACT.address}.`,...(request.notes?[`Observaciones: ${request.notes}`]:[])].join('\n');
}
