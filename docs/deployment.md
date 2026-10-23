# Despliegue de ChessDev

Sin facturación: GitHub Pages, Render Free, Cloudflare Workers Free y D1 Free. No crear otra base, activar Blaze o cambiar planes. URLs y nombres técnicos existentes se mantienen.

## Desarrollo

Node 24 y npm 11. `npm ci`; copia `.env.example` a `.env` si no existe; `npm run dev`. Frontend 5173, API 3001 y servidor 2567. La API local aplica migraciones automáticamente. Dos contextos de navegador con nombres de pruebas diferentes permiten comprobar el juego. El acceso de desarrollo solo existe en loopback.

## API y base de datos existentes

`npm run worker:check`; `npx wrangler d1 migrations apply DB --remote --config apps/api/wrangler.jsonc`; `npx wrangler deploy --config apps/api/wrangler.jsonc`. Las migraciones preservan usuarios/resultados; la 0002 retira sesiones del antiguo proveedor y adapta la identidad a Lichess. [Autorización con Lichess](lichess-setup.md).

Solo `WORLD_SECRET` e `INTERNAL_SECRET`, distintos y de 32+ caracteres, se comparten entre API y servidor. No resetearlos ni exponerlos. Lichess no necesita client secret. No incluir tokens ni bases locales en Git.

## Render Free

Servicio existente `pixelspace-world`, `/health`, Dockerfile `infrastructure/world.Dockerfile`, `API_PROXY_ENABLED=true`. `API_URL` del servidor sigue apuntando al Worker. El navegador usa exclusivamente el proxy público `https://pixelspace-world.onrender.com/api`. Solo se permiten rutas explícitas; `/internal` no se reenvía. [Límites](free-hosting.md).

Desplegar primero el servidor desde un commit probado. Evitar partidas en curso al reiniciar. Confirmar health, capacidades, bloqueo de desarrollo y rechazo de tickets anónimos antes de actualizar Pages.

## GitHub Pages

`pages.yml` declara las URLs públicas confirmadas, compila con base `/PixelSpace/`, ejecuta TypeScript/lint/tests/build, E2E, infraestructura pública y smoke de producción antes del deploy. No depende de variables antiguas del repositorio. La rama de preparación no publica Pages; publicar main solo tras conectar API y servidor.

`npm run check`, `npm run test:e2e`, `npm run test:public` y `npm run test:pages` verifican cada capa. Los dos últimos necesitan las URLs y build de producción. No afirmar prueba real de OAuth o dos cuentas remotas si no se ha realizado.
