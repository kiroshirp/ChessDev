# ChessDev

Plataforma de ajedrez en español con la identidad visual de ChessDev: antracita, marfil, tipografía marcada y tarjetas con sombras. Sustituye la experiencia pública de PixelSpace. Repositorio ChessDev y web pública en https://kiroshirp.github.io/ChessDev/. Se conserva el historial y la infraestructura de cuentas y partidas existente.

## Funciones disponibles

- Editor de estudios PGN con variantes, comentarios, símbolos, FEN, reproducción y exportación.
- Aprendizaje del repertorio propio por color y repaso espaciado SM2 con fechas reales.
- Problemas del diario de Lichess, importación CSV CC0 y ejercicios obtenidos de errores propios; fuentes visibles.
- Ciclos Woodpecker con colección fija, tiempo y errores medidos.
- Stockfish.js 19 Lite en Web Worker: análisis de posición y partida completa, resumen, gráfico y revisión de errores. Profundidad y criterios explícitos; sin precisión inventada.
- Estudios y entrenamiento locales; exportación PGN, sin sincronización entre equipos.
- Mesa amistosa autoritativa, dos jugadores, espectadores, tablas, rendición e historial persistido en D1; sin reloj ni Elo.
- Lichess obligatorio para juego público; herramientas locales gratuitas sin cuenta. Identidades de prueba solo en loopback y desarrollo.

Sin tienda, pagos, clasificaciones simuladas ni entrenador conversacional. No hay catálogo de cursos completos. Ver [comparación funcional y límites](docs/chessflare-parity.md). Stockfish se distribuye sin modificar bajo GPL3 con [código correspondiente y licencia](apps/web/public/engine/SOURCE.txt).

## Desarrollo

Node 24.x y npm 11.x. Ejecuta `npm ci`, copia `.env.example` a `.env` si no existe y arranca `npm run dev`. Web: http://127.0.0.1:5173; API: 3001; servidor de partidas: 2567.

Para jugar con dos clientes locales, abre dos contextos independientes, entra en Jugar con nombres de pruebas distintos, abre la mesa y elige un color en cada cliente.

## Validación

`npm run check`: TypeScript, lint, pruebas unitarias y builds.
`npm run test:e2e`: dos clientes, partida hasta mate, historial, PGN, persistencia local, entrenamiento y móvil.
`npm run test:pages`: comprobación de producción bajo `/ChessDev/` después de compilar con `VITE_BASE_PATH=/ChessDev/`.

## Infraestructura gratuita

GitHub Pages para frontend, Render Free para Colyseus y Cloudflare Worker/D1 Free para cuentas, OAuth e historial. API pública: `https://pixelspace-world.onrender.com/api`. No activar facturación. [Configuración](docs/free-hosting.md), [decisiones](docs/decisions.md), [verificaciones](docs/verification.md).

El servidor conserva los módulos de mapas y movimiento como infraestructura interna ya probada. La web nueva no carga Phaser ni muestra el mundo virtual. No se han borrado usuarios ni resultados existentes. Secretos solo en el servidor; nunca en Git o variables `VITE_*`.

[Especificación vigente](docs-specification.es.md). Licencias originales conservadas; no se reutilizan marcas ni recursos de ChessFlare.
