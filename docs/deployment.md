# Arranque y despliegue

**Restricción vigente: empezar sin cargos.** No activar Blaze ni Containers. Cloud Run queda aplazado; alternativa Render Free preparada y pendiente de aceptar/configurar en [free-hosting.md](free-hosting.md). Las instrucciones de infraestructuras pagadas más abajo son referencia, no autorización para ejecutarlas.

## Local

Node 24.x, npm 11.x. `npm ci`, copiar `.env.example` a `.env` sin sobrescribir configuración previa y `npm run dev`. Web 5173, API 3001, Colyseus 2567. La API local migra `.local/pixelspace.sqlite` automáticamente. En dos navegadores independientes, nombres locales diferentes y mesa 01. Ctrl+C detiene los procesos. `npm run build` genera frontend y ESM de los procesos Node; `npm start -w @pixelspace/api` y `@pixelspace/world-server` prueban los builds.

Docker opcional: `docker compose up --build`. Volumen `local_data` conserva SQLite; todos los puertos publicados se enlazan a 127.0.0.1. No ejecutar esta imagen de desarrollo como API pública. Docker no está instalado en el entorno de trabajo y estos contenedores no se han ejecutado aquí.

## GitHub Pages

Repositorio `kiroshirp/PixelSpace`. Source: **GitHub Actions**. `pages.yml` compila con base `/PixelSpace/`, ejecuta comprobaciones y prueba el acceso público antes de publicar `apps/web/dist`. Se activa en push a main o manualmente. El frontend sin backend muestra academia en preparación y obliga a autenticación; nunca conecta visitantes a localhost.

Variables del repositorio (no secretos): `VITE_API_URL=https://TU-API.workers.dev`, `VITE_WORLD_URL=https://TU-SERVICIO.run.app` (URL real de Cloud Run). Se leen al compilar; después de modificarlas hay que repetir publicación. Secretos Discord, D1 o HMAC nunca llevan prefijo VITE.

Prueba de subruta local en PowerShell:

```powershell
$env:VITE_BASE_PATH='/PixelSpace/'
npm run build -w @pixelspace/web
Remove-Item Env:VITE_BASE_PATH
npm run test:pages
```

`test:pages` comprueba assets, acceso obligatorio y ausencia del acceso de desarrollo. Las pruebas de movimiento/partida están en E2E con backend real.

## Cloudflare D1 y API

1. Renovar acceso mediante **`npx wrangler login`**; comprobar `npx wrangler whoami`. La sesión disponible al trabajar estaba caducada. No pegar tokens en el chat.
2. Crear D1: `npx wrangler d1 create pixelspace`. Copiar el `database_id` real a `apps/api/wrangler.jsonc`, que contiene un UUID de relleno deliberado. No sustituir una base existente sin comprobarla.
3. Aplicar `npx wrangler d1 migrations apply DB --remote --config apps/api/wrangler.jsonc`.
4. Crear una aplicación en [Discord Developer Portal](https://discord.com/developers/applications). Registrar callback exacto `https://TU-API.workers.dev/auth/discord/callback`. No se necesita bot, permisos de servidor, email o lectura de mensajes.
5. Configurar `FRONTEND_URL=https://kiroshirp.github.io/PixelSpace/` y `ENVIRONMENT=production`. Establecer `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `WORLD_SECRET` e `INTERNAL_SECRET` con `npx wrangler secret put NOMBRE --config apps/api/wrangler.jsonc`. Los dos últimos deben ser distintos, aleatorios y de 32+ caracteres; se compartirán solo con gateway/servidor.
6. Verificar `npm run worker:check`; publicar `npx wrangler deploy --config apps/api/wrangler.jsonc`. Comprobar `/health`, `/capabilities`, que `/auth/dev` devuelve 404 y que `/world/ticket` anónimo devuelve 401.

OAuth se comprobó con proveedor simulado, no con credenciales reales. El scope solicitado es `identify`. La primera autorización crea la cuenta por Discord ID único; los accesos siguientes actualizan el nombre y conservan identidad/resultados.

## Firebase / Cloud Run para Colyseus — destino elegido

Proyecto `pixelspace-93730`, manteniendo API y D1 en Cloudflare. Seguir [firebase-colyseus.md](firebase-colyseus.md) para construcción remota, Secret Manager, parámetros del servicio y verificación. La consola muestra plan Spark: requiere facturación vinculada/Blaze antes de usar Cloud Run. No se ha cambiado el plan ni desplegado este backend. Alta de Discord explicada paso a paso en [discord-setup.md](discord-setup.md); el callback sigue siendo el Worker de API.

## Cloudflare Containers / Colyseus — alternativa anterior

No es el destino seleccionado. Se conserva la configuración sin desplegar como alternativa; no ejecutar estos pasos para el despliegue en Firebase.

Requiere cuenta con Containers habilitado y Docker para construir la imagen. **Containers tiene coste; no se contrató ningún plan ni se crearon recursos facturables en esta sesión.**

Configurar `API_URL` real en `apps/gateway/wrangler.jsonc` y `FRONTEND_ORIGIN=https://kiroshirp.github.io`. Establecer mediante Wrangler secrets los mismos `WORLD_SECRET` e `INTERNAL_SECRET` del API, esta vez con `--config apps/gateway/wrangler.jsonc`.

`npx wrangler deploy --config apps/gateway/wrangler.jsonc` construye `infrastructure/world.Dockerfile` desde la raíz. El gateway dirige HTTP y WebSockets al Container estable `academy-v1`, puerto 2567. Máximo una instancia configurada; no hacer balanceo aleatorio entre procesos sin persistencia/matchmaking compartido. Los resultados terminados van a D1, no al disco del contenedor.

Comprobar arranque, autorización, dos usuarios de Discord en equipos diferentes, desconexión/reconexión, jugada ilegal rechazada, partida terminada guardada y logout. Las pruebas locales no demuestran esas verificaciones remotas. Reiniciar un contenedor pierde partidas en curso.

## Antes de una beta pública

Resolver políticas de menores, retención/borrado/exportación, límites de coste/tráfico y backups/restauración. Revisar avisos de dependencias, secretos y origen de requests. La infraestructura preparada no equivale a una beta de producción auditada.
