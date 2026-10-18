import { Container, getContainer } from '@cloudflare/containers';
interface GatewayEnv {
  WORLD: DurableObjectNamespace<WorldContainer>;
  WORLD_SECRET: string;
  INTERNAL_SECRET: string;
  API_URL: string;
  FRONTEND_ORIGIN: string;
}
export class WorldContainer extends Container<GatewayEnv> {
  defaultPort = 2567;
  sleepAfter = '10m';
  enableInternet = true;
  envVars = {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    WORLD_PORT: '2567',
    WORLD_SECRET: this.env.WORLD_SECRET,
    INTERNAL_SECRET: this.env.INTERNAL_SECRET,
    API_URL: this.env.API_URL,
    ALLOWED_ORIGINS: this.env.FRONTEND_ORIGIN,
  };
}
export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    if (
      !env.API_URL ||
      env.API_URL.includes('REPLACE') ||
      !env.API_URL.startsWith('https://') ||
      !env.WORLD_SECRET ||
      env.WORLD_SECRET.length < 32 ||
      !env.INTERNAL_SECRET ||
      env.INTERNAL_SECRET.length < 32
    )
      return Response.json({ error: 'World infrastructure not configured' }, { status: 503 });
    const origin = request.headers.get('Origin');
    if (origin && origin !== env.FRONTEND_ORIGIN)
      return new Response('Origin not allowed', { status: 403 });
    return getContainer(env.WORLD, 'academy-v1').fetch(request);
  },
};
