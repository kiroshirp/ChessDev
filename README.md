# ChessDev

Plataforma de ajedrez en español con la identidad visual de ChessDev: antracita, marfil, tipografía marcada y tarjetas con sombras. Sustituye la experiencia pública de PixelSpace. El repositorio conserva su nombre y su historial para mantener las URLs e infraestructura existentes.

## Funciones disponibles

- Panel con accesos a entrenamiento, estudios, partidas y cursos.
- Cuatro líneas introductorias de aperturas, legales y verificadas jugada a jugada.
- Colección original de tres problemas de mate, pistas, repaso y repetición Woodpecker.
- Tablero legal con selección de promoción, giro, importación/exportación PGN y reproducción de partidas. No incluye evaluación de motor.
- Estudios y progreso guardados en el navegador. Exportación PGN para copias de seguridad; no se sincronizan entre equipos.
- Partidas amistosas en mesa compartida: blancas, negras, espectadores, reglas autoritativas, tablas, rendición e historial persistido en D1. Sin reloj ni Elo.
- Lichess obligatorio para juego público; las herramientas locales se pueden explorar sin cuenta. Identidades de pruebas solo en loopback y desarrollo.

No se simulan usuarios conectados, clasificaciones, notificaciones ni estadísticas. No hay tienda, pagos, análisis automático ni entrenadores IA.

## Desarrollo

Node 24.x y npm 11.x. Ejecuta `npm ci`, copia `.env.example` a `.env` si no existe y arranca `npm run dev`. Web: http://127.0.0.1:5173; API: 3001; servidor de partidas: 2567.

Para jugar con dos clientes locales, abre dos contextos independientes, entra en Jugar con nombres de pruebas distintos, abre la mesa y elige un color en cada cliente.

## Validación

`npm run check`: TypeScript, lint, pruebas unitarias y builds.
`npm run test:e2e`: dos clientes, partida hasta mate, historial, PGN, persistencia local, entrenamiento y móvil.
`npm run test:pages`: comprobación de producción bajo `/PixelSpace/` después de compilar con `VITE_BASE_PATH=/PixelSpace/`.

## Infraestructura gratuita

GitHub Pages para frontend, Render Free para Colyseus y Cloudflare Worker/D1 Free para cuentas, OAuth e historial. API pública: `https://pixelspace-world.onrender.com/api`. No activar facturación. [Configuración](docs/free-hosting.md), [decisiones](docs/decisions.md), [verificaciones](docs/verification.md).

El servidor conserva los módulos de mapas y movimiento como infraestructura interna ya probada. La web nueva no carga Phaser ni muestra el mundo virtual. No se han borrado usuarios ni resultados existentes. Secretos solo en el servidor; nunca en Git o variables `VITE_*`.

[Especificación vigente](docs-specification.es.md). Licencias originales conservadas; no se reutilizan marcas ni recursos de ChessFlare.
