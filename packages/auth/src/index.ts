import { z } from 'zod';
export const identitySchema = z
  .object({
    userId: z.string().uuid(),
    name: z.string().min(1).max(32),
    sessionId: z.string().uuid(),
    development: z.boolean(),
  })
  .strict();
export type Identity = z.infer<typeof identitySchema>;
const ticketSchema = identitySchema
  .extend({ nonce: z.string().uuid(), expires: z.number().int() })
  .strict();
const encoder = new TextEncoder();
function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
function unbase64(value: string) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
    c.charCodeAt(0),
  );
}
export async function digest(value: string) {
  return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
export function randomToken() {
  return base64(crypto.getRandomValues(new Uint8Array(32)));
}
async function key(secret: string) {
  if (secret.length < 32) throw new Error('WORLD_SECRET requires 32 characters');
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
export async function signTicket(identity: Identity, secret: string, now = Date.now()) {
  const payload = base64(
    encoder.encode(
      JSON.stringify({ ...identity, nonce: crypto.randomUUID(), expires: now + 60000 }),
    ),
  );
  return `${payload}.${base64(new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload))))}`;
}
export async function verifyTicket(token: string, secret: string, now = Date.now()) {
  if (token.length > 2048) throw new Error('Invalid ticket');
  const [payload, signature, extra] = token.split('.');
  if (
    !payload ||
    !signature ||
    extra ||
    !(await crypto.subtle.verify(
      'HMAC',
      await key(secret),
      unbase64(signature),
      encoder.encode(payload),
    ))
  )
    throw new Error('Invalid ticket');
  const identity = ticketSchema.parse(JSON.parse(new TextDecoder().decode(unbase64(payload))));
  if (identity.expires <= now || identity.expires > now + 60000) throw new Error('Expired ticket');
  return identity;
}
