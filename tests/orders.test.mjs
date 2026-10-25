import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PRODUCTS,madridDateTime} from '../rental.mjs';
import {createRequest,newBooking,changeBooking,requestTotal,peakHeld,assertCatalogChange,availabilityFor,COMMERCIAL} from '../orders.mjs';
const now=Date.UTC(2026,10,1,8);
function state() {return {catalog:{revision:1,products:Object.fromEntries(PRODUCTS.map((p,i)=>[p.id,{...p,max:p.id==='boards'?2:p.max,review:!!p.review,visible:true,position:i,replacementValue:50}]))},requests:{},bookings:{}};}
function request(id='clientA',quantity=2,start=now+12*3600000,end=start+24*3600000) {
  return createRequest({pickup:madridDateTime(start),returns:madridDateTime(end),customer:'Persona de prueba',club:'Entidad de prueba',contact:'600000000',notes:'Prueba',quantities:{boards:quantity}},Object.values(state().catalog.products),id,`CD-${id==='clientA'?'AAAAAAAAAAAA':'BBBBBBBBBBBB'}`,now);
}
function reviewConfirm(s,id){changeBooking(s,id,'review',{replacements:{boards:50}},now+1);changeBooking(s,id,'confirm',{clientAccepted:true},now+2);}
test('se registra presupuesto con IVA y se conservan sus precios al confirmar',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');assert.equal(requestTotal(s.bookings.clientA),60);s.catalog.products.boards.price=100;assert.equal(requestTotal(s.bookings.clientA),60);assert.equal(s.bookings.clientA.terms.tax,'IVA incluido');assert.match(COMMERCIAL.payment,/transferencia/);
});
test('dos reservas solapadas no pueden utilizar las mismas unidades',()=>{
  const s=state();s.requests.clientA=request();s.requests.clientB=request('clientB',1);reviewConfirm(s,'clientA');assert.throws(()=>reviewConfirm(s,'clientB'),/suficientes unidades/);assert.equal(s.bookings.clientB.status,'draft');
});
test('reservas consecutivas permiten reutilizar material a partir de la devolución',()=>{
  const s=state();s.requests.clientA=request();s.requests.clientB=request('clientB',2,s.requests.clientA.returnAt,s.requests.clientA.returnAt+3600000);reviewConfirm(s,'clientA');reviewConfirm(s,'clientB');assert.equal(s.bookings.clientB.status,'confirmed');
});
test('no se suma el stock de intervalos que no coinciden entre sí',()=>{
  const blocks={a:{pickupAt:10,returnAt:20,items:{boards:2}},b:{pickupAt:20,returnAt:30,items:{boards:2}}};assert.equal(peakHeld(blocks,'boards',10,30),2);
});
test('se impide reducir o eliminar material bloqueado',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');const next=structuredClone(s.catalog);next.products.boards.max=1;assert.throws(()=>assertCatalogChange(s,next,now),/reservadas/);delete next.products.boards;assert.throws(()=>assertCatalogChange(s,next,now),/reservadas/);
});
test('la entrega exige transferencia recibida y ambas actas/contrato firmados',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');assert.throws(()=>changeBooking(s,'clientA','collect',{paperSigned:true,contractSigned:true},now+3),/transferencia/);changeBooking(s,'clientA','payment',{reference:'prueba-transferencia'},now+4);assert.throws(()=>changeBooking(s,'clientA','collect',{},now+5),/firmas/);changeBooking(s,'clientA','collect',{paperSigned:true,contractSigned:true,note:'Comprobado'},s.requests.clientA.pickupAt);assert.equal(s.bookings.clientA.status,'collected');
});
test('una entrega vencida bloquea también reservas posteriores hasta devolver',()=>{
  const b=newBooking(request());b.status='collected';const hold=availabilityFor(b,b.returnAt-1);assert.equal(peakHeld({a:hold},'boards',b.returnAt+3600000,b.returnAt+7200000,'',b.returnAt+1),2);
});
test('no se entrega antes del inicio reservado ni se devuelve antes de la entrega',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');changeBooking(s,'clientA','payment',{reference:'prueba'},now+3);
  assert.throws(()=>changeBooking(s,'clientA','collect',{paperSigned:true,contractSigned:true},now+11*3600000),/hora de recogida/);
  const at=s.requests.clientA.pickupAt;changeBooking(s,'clientA','collect',{paperSigned:true,contractSigned:true},at);
  assert.throws(()=>changeBooking(s,'clientA','return',{paperSigned:true,items:{boards:{returned:2,damaged:0,note:''}}},at-1),/anterior/);
});
test('una devolución parcial o dañada conserva bloqueadas solo las unidades afectadas',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');changeBooking(s,'clientA','payment',{reference:'prueba'},now+3);changeBooking(s,'clientA','collect',{paperSigned:true,contractSigned:true},s.requests.clientA.pickupAt);changeBooking(s,'clientA','return',{paperSigned:true,items:{boards:{returned:1,damaged:0,note:'Una pendiente'}}},s.requests.clientA.pickupAt+3600000);assert.equal(s.bookings.clientA.status,'incident');assert.equal(s.availability.clientA.items.boards,1);assert.equal(Object.keys(s.bookings.clientA.returnHistory).length,1);assert.throws(()=>changeBooking(s,'clientA','resolve',{},now+6),/repuesto/);changeBooking(s,'clientA','resolve',{materialRestored:true,note:'Unidad repuesta'},now+7);assert.equal(s.bookings.clientA.status,'resolved');assert.equal(Object.keys(s.availability).length,0);
});
test('cancelar libera el material y registra el reembolso sin cargo adicional',()=>{
  const s=state();s.requests.clientA=request();reviewConfirm(s,'clientA');changeBooking(s,'clientA','payment',{reference:'prueba'},now+3);changeBooking(s,'clientA','cancel',{},now+4);assert.equal(Object.keys(s.availability).length,0);changeBooking(s,'clientA','refund',{reference:'reembolso-prueba'},now+5);assert.equal(s.bookings.clientA.payment.status,'refunded');assert.equal(requestTotal(s.bookings.clientA),60);
});
test('las reglas mantienen las solicitudes privadas y solo permiten crearlas a su propietario',async()=>{
  const r=JSON.parse(await readFile(new URL('../database.rules.json',import.meta.url),'utf8')).rules;
  assert.match(r['.read'],/chessdev-admin/);assert.equal(r.availability['.read'],true);assert.match(r.requests.$uid['.read'],/auth.uid === \$uid/);assert.match(r.requests.$uid['.write'],/!data.exists\(\)/);assert.match(r.requests.$uid['.validate'],/36000000/);assert.equal(r.requests.$uid.$other['.validate'],false);assert.equal(r.bookings.$uid.$other['.validate'],false);assert.equal(r.$other['.validate'],false);assert.match(r.catalog['.validate'],/managementRevision/);
});
