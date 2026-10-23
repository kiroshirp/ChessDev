# ChessDev — especificación vigente

La petición del 23 de octubre de 2026 sustituye el producto anterior PixelSpace por una plataforma centrada en ajedrez. Esta especificación reemplaza la del mundo virtual. Las decisiones posteriores se registran en `docs/decisions.md`.

## Producto

Web en español inspirada funcionalmente en ChessFlare, con identidad visual propia de ChessDev: fondo antracita, marfil, verdes apagados, tarjetas con borde, sombras y tipografía marcada. Navegación lateral en escritorio y menú adaptable en móvil. No copiar código, marcas o imágenes de los referentes.

Panel, juego, perfil, estudios PGN, cursos introductorios, entrenador de aperturas, problemas, repaso, Woodpecker, tablero de análisis y estadísticas reales. Cada acción visible debe funcionar. No inventar Elo, personas, resultados, notificaciones, precisión ni evaluaciones de motor.

La primera entrega contiene cuatro líneas introductorias y tres problemas originales. El repaso y Woodpecker permiten repetir esta colección; no se presenta como una biblioteca completa ni repetición espaciada automática. El tablero de análisis explora jugadas legales e importa/exporta PGN; no incluye motor. Los estudios y progreso se guardan localmente, con exportación PGN y mensajes ante errores de almacenamiento.

La mesa multijugador usa el servidor autoritativo existente con acceso directo desde Jugar. Partidas amistosas sin reloj ni rating, dos asientos, espectadores, rendición, tablas y resultados persistidos. Se conserva el historial previo. Discord obligatorio para juego público y perfil; herramientas locales accesibles sin cuenta. Desarrollo local limitado a loopback.

## Repositorio y despliegue

Sustituir la experiencia y documentación principal anteriores en `kiroshirp/PixelSpace`, manteniendo historial Git y las URLs para que la sustitución sea recuperable. Reutilizar módulos de reglas, autenticación, persistencia y red. La UI de mundo virtual queda retirada. No borrar repositorios ajenos, cuentas, bases ni secretos.

Sin cargos: Pages, Render Free, Workers/D1 Free. No Blaze ni servicios pagados. API pública a través de Render `/api`; Worker sigue controlando D1 y OAuth. No publicar rutas internas. Ver `docs/free-hosting.md`.

Antes de publicar: TypeScript, lint, pruebas unitarias, build y E2E con dos clientes; comprobar móvil y rutas de Pages. Registrar lo no verificado. No afirmar compatibilidad total con ChessFlare o Lichess ni análisis por IA sin implementarlo y probarlo.
