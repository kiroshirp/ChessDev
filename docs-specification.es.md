# ChessDev — especificación vigente

La petición del 23 de octubre de 2026 sustituye el producto anterior PixelSpace por una plataforma centrada en ajedrez. Esta especificación reemplaza la del mundo virtual. Las decisiones posteriores se registran en `docs/decisions.md`.

## Producto

Web en español inspirada funcionalmente en ChessFlare, con identidad visual propia de ChessDev: fondo antracita, marfil, verdes apagados, tarjetas con borde, sombras y tipografía marcada. Navegación lateral en escritorio y menú adaptable en móvil. No copiar código, marcas o imágenes de los referentes.

Panel, juego, perfil, estudios PGN, aprendizaje de estudios propios, entrenador de aperturas, problemas, repaso, Woodpecker, tablero de análisis y estadísticas reales. Cada acción visible debe funcionar. No inventar Elo, personas, resultados, notificaciones, precisión ni evaluaciones de motor.

La entrega del 25 de octubre retira el catálogo de cuatro secuencias y los tres problemas predeterminados. El editor importa/exporta PGN con variantes, comentarios, NAG y FEN. Se entrena un color de las líneas propias, con respuestas automáticas y repetición espaciada SM2. Los problemas se obtienen del diario de Lichess, CSV público CC0 o revisiones propias; los ciclos Woodpecker conservan colección, tiempo y errores. Stockfish.js 19 Lite se ejecuta como Worker local (sin servicio pagado) para posiciones y revisiones completas de línea principal. Los errores y estadísticas se derivan de evaluaciones guardadas, mostrando profundidad y criterio; no se inventa precisión ni Elo. Los estudios y entrenamiento siguen en el navegador, exportables como PGN; la sincronización de entrenamiento entre dispositivos sigue pendiente. Consultar `docs/chessflare-parity.md` para diferencias verificables.

La mesa multijugador usa el servidor autoritativo existente con acceso directo desde Jugar. Partidas amistosas sin reloj ni rating, dos asientos, espectadores, rendición, tablas y resultados persistidos. Se conserva el historial previo. Lichess obligatorio para juego público y perfil; herramientas locales accesibles sin cuenta. Desarrollo local limitado a loopback.

## Repositorio y despliegue

Sustituir la experiencia y documentación principal anteriores en `kiroshirp/ChessDev`, manteniendo historial Git para que la sustitución sea recuperable; la URL pública pasa a https://kiroshirp.github.io/ChessDev/. Reutilizar módulos de reglas, autenticación, persistencia y red. La UI de mundo virtual queda retirada. No borrar repositorios ajenos, cuentas, bases ni secretos.

Sin cargos: Pages, Render Free, Workers/D1 Free. No Blaze ni servicios pagados. API pública a través de Render `/api`; Worker sigue controlando D1 y OAuth. No publicar rutas internas. Ver `docs/free-hosting.md`.

Antes de publicar: TypeScript, lint, pruebas unitarias, build y E2E con dos clientes; comprobar móvil y rutas de Pages. Registrar lo no verificado. No afirmar compatibilidad total con ChessFlare o Lichess ni análisis por IA sin implementarlo y probarlo.
