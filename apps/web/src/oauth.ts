import { api, login } from './api';
function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
function randomToken() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}
async function digest(value: string) {
  return base64Url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
  );
}
const storageKey = 'chessdev.oauth.pending';
const lifetime = 15 * 60 * 1000;
export async function beginLichessLogin() {
  const state = randomToken(),
    verifier = randomToken();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ state, verifier, created: Date.now() }));
  } catch {
    throw new Error('OAUTH_STORAGE_UNAVAILABLE');
  }
  try {
    const result = await api<{ url: string }>('/auth/lichess/start', {
      state,
      challenge: await digest(verifier),
    });
    const target = new URL(result.url);
    if (target.origin !== 'https://lichess.org' || target.pathname !== '/oauth')
      throw new Error('OAUTH_INVALID_TARGET');
    location.assign(target.href);
  } catch (error) {
    sessionStorage.removeItem(storageKey);
    throw error;
  }
}
export async function finishLichessLogin(code: string, state: string | null) {
  let pending: { state?: unknown; verifier?: unknown; created?: unknown } | null;
  try {
    pending = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
  } catch {
    throw new Error('OAUTH_STORAGE_UNAVAILABLE');
  }
  if (
    !pending ||
    typeof pending.state !== 'string' ||
    typeof pending.verifier !== 'string' ||
    typeof pending.created !== 'number'
  )
    throw new Error('OAUTH_SESSION_MISSING');
  if (state !== pending.state) throw new Error('OAUTH_STATE_MISMATCH');
  sessionStorage.removeItem(storageKey);
  if (Date.now() - pending.created > lifetime || Date.now() < pending.created)
    throw new Error('OAUTH_EXPIRED');
  return login('/auth/lichess/complete', { code, state, verifier: pending.verifier });
}
export function cancelLichessLogin() {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* No pending login to clear. */
  }
}
export function loginError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'OAUTH_STORAGE_UNAVAILABLE')
    return 'No se puede guardar el inicio de sesión en esta pestaña. Abre ChessDev directamente en Safari o Chrome y vuelve a entrar con Lichess.';
  if (['OAUTH_SESSION_MISSING', 'OAUTH_STATE_MISMATCH'].includes(code))
    return 'El acceso debe terminar en la misma pestaña y navegador donde lo empezaste. Pulsa Entrar con Lichess para iniciar uno nuevo.';
  if (code === 'OAUTH_EXPIRED' || code === 'Invalid or expired OAuth state')
    return 'El acceso ha caducado. Pulsa Entrar con Lichess para volver a intentarlo.';
  return 'No se ha podido completar el acceso con Lichess. Vuelve a intentarlo desde esta pestaña.';
}
