# Reglas de la mesa 01

chess.js 1.4.0 (BSD-2-Clause), tanto en cliente para mostrar destinos legales como en servidor para autoridad final. Partidas amistosas **sin reloj, rating, motor o consejos**. Se requiere que dos usuarios distintos elijan asientos; la segunda elección inicia la partida.

Movimientos legales, turnos, capturas, jaque/mate, ahogado, enroques, captura al paso y promociones q/r/b/n. Cada movimiento incluye revisión esperada; se rechazan ilegales, ajenos, repetidos, fuera de turno o después del resultado.

El adaptador no usa `isGameOver()` como política completa:

- Mate, ahogado e insuficiencia de material detectada por chess.js finalizan automáticamente.
- Cinco repeticiones y 75 movimientos sin captura/peón finalizan automáticamente. Mate tiene prioridad.
- Triple repetición y 50 movimientos habilitan reclamación al jugador de turno; no terminan automáticamente.
- Se puede ofrecer tablas y el otro asiento aceptarlas; una jugada cancela la oferta. Cerrar el panel sentado durante una partida exige confirmar rendición.

Limitaciones frente a un árbitro FIDE: insuficiencia según cobertura de chess.js, sin detector general de todas las posiciones muertas. Las reclamaciones se realizan sobre la posición actual, sin declarar por adelantado una jugada escrita. No hay pérdida por tiempo, pausa o compensación de latencia porque no se han implementado relojes. No anunciar conformidad FIDE completa.

Se exporta PGN con nombres, fecha y resultado. No hay importación arbitraria PGN/FEN, estudios ni edición de posiciones. Los tests cubren legalidad, duplicados, mate, repetición, enroque, captura al paso, subpromoción, ahogado, rendición y asientos. La partida E2E termina en mate y consulta el resultado persistido.
