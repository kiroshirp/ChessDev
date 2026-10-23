import type { Identity } from '@pixelspace/auth';
const local = import.meta.env.DEV && ['127.0.0.1', 'localhost'].includes(location.hostname);
export const API_URL = (
  import.meta.env.VITE_API_URL || (local ? 'http://127.0.0.1:3001' : '')
).replace(/\/$/, '');
export const WORLD_URL = import.meta.env.VITE_WORLD_URL || (local ? 'http://127.0.0.1:2567' : '');
let token: string | null = null;
export async function api<T>(path: string, body?: unknown): Promise<T> {
  if (!API_URL) throw new Error('BACKEND_NOT_CONFIGURED');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = {
    credentials: 'include',
    headers,
    signal: AbortSignal.timeout(
      ['/capabilities', '/auth/lichess/start'].includes(path) ? 90000 : 15000,
    ),
  };
  if (body !== undefined) {
    init.method = 'POST';
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok)
    throw new Error(((await response.json()) as { error?: string }).error ?? 'CONNECTION_FAILED');
  return response.json() as Promise<T>;
}
export async function login(path: string, body: unknown) {
  const result = await api<{ token: string; user: Identity }>(path, body);
  token = result.token;
  return result.user;
}
export async function logout() {
  await api('/auth/logout', {});
  token = null;
}
export function clearToken() {
  token = null;
}
