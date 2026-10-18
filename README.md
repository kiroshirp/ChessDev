# PixelSpace

Primera publicación sin cargos: frontend en Pages, API/cuentas en Cloudflare Workers Free + D1 y Colyseus ya desplegado en Render Free. Firebase está aplazado porque requiere Blaze. Configuración y límites: `docs/free-hosting.md`; resultados comprobados y pendientes: `docs/verification.md`.

Academia virtual pixel art con **movimiento y ajedrez multijugador reales**. React, TypeScript, Vite, Phaser, Node y Colyseus. Documento funcional permanente: [especificación maestra](docs-specification.es.md); decisiones posteriores: [decisions](docs/decisions.md). `AGENTS.md` indica a futuros colaboradores cómo aplicarlos.

## Primera versión técnica

- Vestíbulo, aula, cafetería y sala de juego, con mapa y gráficos originales.
- Avatares con nombres, animación, WASD/flechas, colisiones en servidor, cámara y zoom.
- Presencia compartida por Colyseus, interpolación y reconexión con reserva de asiento durante 20 segundos.
- Mesa 01 interactiva: dos asientos, espectadores, jugadas legales en servidor mediante chess.js, promoción seleccionable, rendición, tablas, PGN y resultados persistidos.
- Partidas **amistosas, sin reloj ni rating**. No motor de análisis, torneos, pagos, chat, audio o editor.
- Público: acceso obligatorio con Discord. La primera autorización crea la cuenta; no hay contraseña PixelSpace. Perfil privado, sesiones revocables y solo scope `identify`.
- Destino: GitHub Pages para frontend; Cloudflare Worker + D1 para cuentas/resultados; Cloud Run del proyecto Firebase `pixelspace-93730` para Node/Colyseus. Cloud Run pendiente de facturación Blaze y despliegue; ver `docs/firebase-colyseus.md`. Discord se configura siguiendo `docs/discord-setup.md`.

El aula y la cafetería son zonas navegables; no se simulan clases o comunicación. La segunda mesa es decorativa y no muestra una interacción disponible.

## Ejecutar localmente

Requisitos: Node **24.x**, npm **11.x**. No requiere Docker ni cuentas cloud para la prueba local.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

macOS/Linux: `cp .env.example .env`. Si ya tienes `.env`, consérvalo y añade solo las variables que necesites. Abre [localhost:5173](http://127.0.0.1:5173/). API en 3001, Colyseus en 2567. Ctrl+C detiene los procesos.

Para comprobar dos personas: abre dos perfiles de navegador o ventanas privadas independientes. Usa **Acceso local de desarrollo** con nombres distintos. Son identidades de pruebas explícitas, guardadas en `.local/pixelspace.sqlite`; este acceso no existe en producción. Después usa **Sala de juego → Abrir mesa**, elige blancas en un navegador y negras en el otro. También puedes caminar hasta la mesa y pulsar E.

La API local aplica las mismas migraciones SQLite utilizadas por D1. Producción usa bindings D1, sin SQLite en un disco del contenedor. `npm run db:migrate` aplica las migraciones locales; `npm run db:generate` genera cambios desde el esquema Drizzle.

## Verificar

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm run worker:check
npx wrangler d1 migrations apply DB --local --config apps/api/wrangler.jsonc
npm run format:check
```

E2E arranca API, Colyseus y frontend en 5174. Comprueba dos contextos de navegador, una partida con mate y guardado, móvil, colisiones y ataques al protocolo/reconexión. [Resultados realmente ejecutados](docs/verification.md).

## Discord y Cloudflare

El flujo OAuth está implementado y probado con un proveedor simulado; **necesita tu aplicación Discord y secretos antes de activar el acceso real**. No pongas secretos en variables `VITE_*`, GitHub Pages ni el repositorio. [Guía de configuración y despliegue](docs/deployment.md).

GitHub Pages publica solo archivos estáticos. Configura `VITE_API_URL` y `VITE_WORLD_URL` como **variables del repositorio**, apuntando a los dos Workers HTTPS. Sin backend configurado, la página pública muestra el estado de preparación y no permite entrar al mundo ni usar identidades de desarrollo.

## Módulos

`shared` contratos; `map-engine` mapas genéricos; `world-engine` simulación; `realtime` estado sincronizado; `auth` identidad y tickets; `database` D1/SQLite; `chess-core` reglas y estados de la mesa. La representación está en `apps/web`, OAuth en `apps/api` y networking en `apps/world-server`. `apps/gateway` conserva la alternativa anterior de Containers, sin desplegar. El núcleo de mapas/movimiento no depende de chess.js.

Licencia original MIT conservada. [Procedencia de gráficos y bibliotecas](docs/asset-licenses.md). El proyecto aún no es una beta de producción: consulta los límites de seguridad, persistencia y despliegue antes de admitir usuarios reales.
