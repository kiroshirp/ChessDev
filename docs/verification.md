# ChessDev — verificación del 23 de octubre de 2026

Sustitución de la web de mundo virtual por ChessDev. TypeScript, lint y frontera de dependencias aprobados; 29 pruebas unitarias aprobadas. Cinco E2E aprobados: protocolo autoritativo/reconexión, partida con dos contextos hasta mate y persistencia, estudios PGN y almacenamiento, tres problemas y una línea completa, adaptación móvil sin desbordamiento. Build de web/API/servidor aprobado. Capturas locales de escritorio y móvil revisadas. Comprobación de producción bajo `/PixelSpace/` aprobada con los servicios públicos configurados y sin acceso de desarrollo.

Colección inicial: cuatro líneas de aperturas y tres problemas. Sin evaluación de motor, rating ni sincronización de estudios entre equipos. OAuth Discord real con dos cuentas remotas sigue pendiente.

Publicación en curso: Render responde 404 en `/api/health` antes de desplegar el proxy preparado. El cambio se sube a una rama sin publicación automática de Pages para poder desplegar y verificar primero el servidor. No se activa facturación ni se crea infraestructura nueva.

---

# Informe de verificación — primera versión técnica

## Estado más reciente del despliegue

18 de octubre de 2026: usuario confirma Render Free y publicación de Pages al completar la configuración. Cloudflare Workers Free comprobado en panel (plan actual 0 USD), D1 `pixelspace` creada en WEUR (`55457fe3-9dc9-4b2d-9282-e029ed09c16d`), ambas migraciones remotas aplicadas. API publicada en `https://pixelspace-api.kiroshirp.workers.dev`, con Discord Client ID y callback reales; los tres secretos están guardados en Cloudflare y solo las claves internas compartidas en Render. Copia temporal del secreto Discord eliminada tras confirmar su almacenamiento.

Render `pixelspace-world`, servicio `srv-dbagmmu7bikc73eilhn0`, plan Free 0 USD, Frankfurt, Docker, health `/health`, despliegues automáticos desactivados. Primer despliegue `dep-dbagmnm7bikc73eiljs0` desde `a551281` finalizado Live. `/health` público 200 en `https://pixelspace-world.onrender.com`. Ticket firmado de diagnóstico con sesión inexistente rechazado como `SESSION_EXPIRED`: comprueba comunicación Render → Worker → D1, sin crear usuarios de prueba ni abrir acceso de desarrollo.

Discord callback guardado y confirmado por el portal: `https://pixelspace-api.kiroshirp.workers.dev/auth/discord/callback`. Aún pendiente prueba de autorización Discord real y partida remota con dos cuentas. Desde la red local el dominio workers.dev agota el tiempo de conexión; Render sí consigue acceder. Se añaden comprobaciones públicas en GitHub Actions antes de publicar el frontend conectado. Las verificaciones históricas de abajo distinguen pruebas locales de despliegues pendientes en aquel momento.

Publicación conectada `ede716c`: [Pages](https://github.com/kiroshirp/PixelSpace/actions/runs/39153416053) aprobado, incluidos health 200 de API/Render, Discord habilitado, /auth/me 401, /auth/dev 404, /world/ticket 401 y navegador de producción. CI detectó un timeout en una captura rutinaria después de mate y resultado guardado; las capturas rutinarias se limitan ahora a verificación local, conservando en CI todas las aserciones de juego, historial/logout, trazas y contexto de fallos. Se añade espera del health de Render antes de emitir el ticket de 60 segundos para tolerar arranque en frío; el mensaje ES/EN explica la espera. No se afirma que este cambio se haya probado esperando un reposo real de 15 minutos.

Fecha: 18 de octubre de 2026. Windows, Node 24.14.0, npm 11.9.0 y Git. Documento maestro conservado y registrado como instrucción permanente en `AGENTS.md`.

## Resultados comprobados

- Instalación de dependencias con versiones verificadas en npm y lockfile.
- TypeScript estricto, incluido el gateway con tipos de Cloudflare.
- Lint y frontera Core/Chess.
- Batería unitaria de movimiento/colisiones, tickets, cuentas, sesiones, OAuth simulado y ajedrez. Incluye regresión de posiciones con accesores de Colyseus.
- Dos contextos Chromium distintos: ambos entran, ven nombres/presencia, observan movimiento desde el otro navegador y juegan una partida hasta mate. Ambos tableros sincronizan; el resultado se guarda y aparece en el historial propio.
- Prueba móvil: cuatro zonas, movimiento, colisión real con mesa y guía ES/EN. Capturas de academia/tablero revisadas.
- SDK real: identidad ausente rechazada, coordenadas/ID ajenos rechazados, secuencias duplicadas ignoradas, distancia de interacción verificada, ticket no reutilizable y reconexión conservando sesión.
- Worker API compilado con Wrangler dry-run; migraciones aplicadas con Wrangler sobre **D1 local**.
- Runtime real `workerd` en modo producción: `/health` 200, `/capabilities` declara Discord pendiente y desarrollo deshabilitado, `/auth/dev` 404, `/world/ticket` anónimo 401.

Resultado final local: **23 pruebas unitarias aprobadas en 4 archivos; 3 pruebas de integración/E2E aprobadas**. TypeScript, lint, build de web/ambos servidores y Worker dry-run correctos. `npm ci` limpio correcto tras detener el runtime que mantenía un archivo abierto; npm informa **0 vulnerabilidades**. El build público `/PixelSpace/` supera la comprobación de assets y acceso obligatorio sin vía de desarrollo. Phaser queda separado en un bloque de ~319 KB gzip; bundle de interfaz/networking/tablero ~141 KB gzip. No se oculta el aviso de tamaño de Phaser.

Los primeros E2E detectaron una incompatibilidad real al copiar posiciones con accesores de Schema; el motor ahora copia explícitamente x/y y cuenta con regresión. El test de salida se corrigió para volver al panel de mundo antes de consultar su lista de presencia.

## Publicación comprobada

GitHub Pages se cambió mediante su configuración oficial a Source: GitHub Actions. El commit `7db37f7` se subió a `kiroshirp/PixelSpace` y finalizaron correctamente tanto [CI](https://github.com/kiroshirp/PixelSpace/actions/runs/39150344451) como [build y deploy de Pages](https://github.com/kiroshirp/PixelSpace/actions/runs/39150344531). Se abrió la [URL pública](https://kiroshirp.github.io/PixelSpace/) y se comprobó el frontend nuevo, con acceso en preparación y sin entrada de desarrollo. La guía se puede consultar sin autenticar; la sección de cuenta solo aparece tras iniciar sesión.

## Lo que no se ha probado o activado

- Discord real: faltan aplicación/client ID/secret y redirect de producción. OAuth probado con proveedor simulado, no una cuenta real.
- Cloudflare remoto: la sesión Wrangler disponible estaba caducada. No se creó D1 remoto, no se subieron secretos ni se desplegaron Worker/Container.
- Docker/Container: Docker no está instalado. El gateway se comprueba con TypeScript; la imagen no se ha construido ni arrancado aquí.
- No prueba de carga ni promesa de concurrencia. Límite 24 es configuración, no capacidad medida.
- No relojes, rating, clases, audio/vídeo, integración Lichess, chat, torneos avanzados, pagos o editor.
- Presencia/partidas activas son efímeras; resultados terminados persistidos, sin cola duradera durante caída del proceso.

Consulta `deployment.md` para habilitar Discord/Cloudflare y repetir las pruebas entre equipos. La página de GitHub Pages puede publicarse como acceso en preparación sin afirmar que su backend ya está disponible.

## Adaptación posterior a Firebase / Cloud Run

El usuario confirma Colyseus en Firebase y base de datos en Cloudflare. Consola del proyecto `pixelspace-93730` comprobada con sesión del propietario: plan **Spark**, sin Cloud Run desplegado. No se vinculó facturación ni se cambió a Blaze. Se preparó Cloud Build (solo construcción), exclusiones de subida y documentación; Docker/Cloud Build remoto continúan sin ejecutar.

El bundle de Colyseus admite `PORT` y enlace público en producción. `npm run test:cloudrun` aprobado: proceso Node real en modo producción, puerto dinámico prioritario frente a WORLD_PORT, salud 200, origen ajeno 403 y acceso sin ticket rechazado. TypeScript, lint, 23 pruebas unitarias, 3 pruebas E2E, build y formato aprobados después del cambio. El propietario completó la creación de la aplicación PixelSpace en Discord durante la sesión. Callback y secreto de producción siguen pendientes; no se ha probado OAuth real.

Restricción posterior: iniciar sin cargos. Blaze no autorizado y Cloud Run aplazado. Blueprint Render Free preparado, **no desplegado ni validado contra la API de Render**; requiere aceptar proveedor/configurar acceso. No se ha creado infraestructura de pago. Client ID público Discord comprobado y registrado en Wrangler; secreto no leído ni modificado.
