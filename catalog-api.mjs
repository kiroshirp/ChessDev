import { FIREBASE } from './firebase-config.mjs';
import { validateCatalog } from './inventory.mjs';

export async function readCatalog() {
  const response = await fetch(`${FIREBASE.databaseURL}/catalog.json`, { cache: 'no-store', headers: { 'X-Firebase-ETag': 'true' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('No se ha podido cargar el material. Vuelve a intentarlo.');
  return { catalog: validateCatalog(await response.json()), etag: response.headers.get('etag') };
}

export async function authenticate(username, password) {
  // La comprobación real de la contraseña la realiza Firebase Authentication.
  if (username !== 'ChessDev') throw new Error('Usuario o contraseña incorrectos.');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE.apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chessdev@admin.invalid', password, returnSecureToken: true }), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || result.localId !== FIREBASE.adminUid) throw new Error(result.error?.message === 'TOO_MANY_ATTEMPTS_TRY_LATER' ? 'Demasiados intentos. Espera unos minutos.' : 'Usuario o contraseña incorrectos.');
  return { token: result.idToken, expiresAt: Date.now() + Number(result.expiresIn) * 1000 };
}

export async function saveCatalog(catalog, etag, session) {
  validateCatalog(catalog);
  if (!session || session.expiresAt <= Date.now()) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
  if (!etag) throw new Error('Recarga el catálogo antes de guardar.');
  const response = await fetch(`${FIREBASE.databaseURL}/catalog.json?auth=${encodeURIComponent(session.token)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'if-match': etag }, body: JSON.stringify(catalog), signal: AbortSignal.timeout(15000),
  });
  if (response.status === 412) throw new Error('Otro administrador ha cambiado el inventario. Recarga para revisar sus cambios antes de guardar.');
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'No tienes permiso o tu sesión ha caducado. Vuelve a iniciar sesión.' : 'No se ha podido guardar. Comprueba la conexión y recarga antes de reintentar.');
  // La respuesta al PUT contiene el catálogo confirmado. No hay optimismo local.
  return validateCatalog(await response.json());
}
