import { FIREBASE } from './firebase-config.mjs';
import { rebuildAvailability, changeBooking, createRequest } from './orders.mjs';

function url(path='',token=''){return `${FIREBASE.databaseURL}/${path}.json${token?`?auth=${encodeURIComponent(token)}`:''}`;}
export async function readState(session) {
  if(!session||session.expiresAt<=Date.now())throw Error('La sesión ha caducado. Vuelve a entrar.');
  const response=await fetch(url('',session.token),{cache:'no-store',headers:{'X-Firebase-ETag':'true'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('No se ha podido cargar la gestión privada.');
  return {state:await response.json(),etag:response.headers.get('etag')};
}
export async function mutateState(session,callback) {
  for(let attempt=0;attempt<4;attempt++) {
    const {state,etag}=await readState(session);
    const result=callback(state);
    state.managementRevision=(state.managementRevision||0)+1;
    state.catalog.revision++;
    state.availability=rebuildAvailability(state);
    // Firebase elimina objetos vacíos. No mantener campos vacíos en la raíz.
    for(const key of ['availability','bookings','requests'])if(state[key]&&!Object.keys(state[key]).length)delete state[key];
    const response=await fetch(url('',session.token),{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(state),signal:AbortSignal.timeout(20000)});
    if(response.status===412)continue;
    if(!response.ok)throw Error('No se ha podido guardar la operación. Comprueba la sesión y recarga antes de reintentar.');
    return {state:await response.json(),result};
  }
  throw Error('Hay cambios simultáneos. Recarga la gestión y vuelve a intentarlo.');
}
export function bookingAction(session,id,action,payload={}) {
  return mutateState(session,state=>changeBooking(state,id,action,payload));
}
export async function readAvailability() {
  const response=await fetch(url('availability'),{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('No se ha podido comprobar la disponibilidad por fechas.');
  return await response.json()||{};
}
let anonymous=null;
export async function submitRequest(data,products) {
  if(!anonymous||anonymous.expiresAt<=Date.now()) {
    const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('No se ha podido iniciar el envío seguro. Inténtalo de nuevo.');
    const auth=await response.json();anonymous={id:auth.localId,token:auth.idToken,expiresAt:Date.now()+Number(auth.expiresIn)*1000};
  }
  const reference=`CD-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;
  const request=createRequest(data,products,anonymous.id,reference);
  const response=await fetch(url(`requests/${anonymous.id}`,anonymous.token),{method:'PUT',headers:{'Content-Type':'application/json','if-match':'null_etag'},body:JSON.stringify(request),signal:AbortSignal.timeout(15000)});
  if(response.status===412) {
    const previous=await fetch(url(`requests/${anonymous.id}`,anonymous.token),{cache:'no-store'});
    if(previous.ok)return {request:await previous.json(),existing:true};
  }
  if(!response.ok)throw Error('No se ha podido registrar la solicitud. Comprueba las 10 horas de antelación, el material y la conexión. Si ya pulsaste enviar, recarga la gestión o consúltanos antes de repetir.');
  return {request:await response.json(),existing:false};
}
