# Informe de verificación — primera versión técnica

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

Los primeros E2E detectaron una incompatibilidad real al copiar posiciones con accesores de Schema; el motor ahora copia explícitamente x/y y cuenta con regresión. El test de salida se corrigió para volver al panel de mundo antes de consultar su lista de presencia. GitHub Pages se cambió mediante su configuración oficial a Source: GitHub Actions; publicación del código validado en curso al cerrar este informe local.

## Lo que no se ha probado o activado

- Discord real: faltan aplicación/client ID/secret y redirect de producción. OAuth probado con proveedor simulado, no una cuenta real.
- Cloudflare remoto: la sesión Wrangler disponible estaba caducada. No se creó D1 remoto, no se subieron secretos ni se desplegaron Worker/Container.
- Docker/Container: Docker no está instalado. El gateway se comprueba con TypeScript; la imagen no se ha construido ni arrancado aquí.
- No prueba de carga ni promesa de concurrencia. Límite 24 es configuración, no capacidad medida.
- No relojes, rating, clases, audio/vídeo, integración Lichess, chat, torneos avanzados, pagos o editor.
- Presencia/partidas activas son efímeras; resultados terminados persistidos, sin cola duradera durante caída del proceso.

Consulta `deployment.md` para habilitar Discord/Cloudflare y repetir las pruebas entre equipos. La página de GitHub Pages puede publicarse como acceso en preparación sin afirmar que su backend ya está disponible.
