# Integridad implementada

`ChessTable` vive en servidor; cada sala mantiene su propia mesa. Estados waiting → active → finished. No se aceptan dos asientos de una cuenta, asientos ocupados, jugadas de espectadores, turnos ajenos, revisiones antiguas o acciones de partida terminada.

No se transmite un motor de análisis ni recomendaciones: no se incorpora Stockfish. El cliente puede mostrar casillas legales para interfaz, pero el servidor revalida toda jugada. La identidad del cliente Colyseus autentica el asiento; no se recibe `playerId` para elegir a quién mover.

Rendición, tablas y finalización actualizan revisión; el resultado se guarda una vez por UUID. Hasta confirmar guardado, no se ofrece nueva partida como lista para iniciar. Al fallar se muestra estado de guardado pendiente y se reintenta. No existe rating competitivo.

Todavía no hay persistencia de cada jugada en curso, arbitraje, anticheat estadístico, torneos o medidas contra colaboración externa. No afirmar que estas herramientas existen.
