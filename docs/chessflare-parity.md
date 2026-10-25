# Funciones verificables y diferencias con ChessFlare

Revisión: 25 de octubre de 2026. Referencia funcional: [ChessFlare](https://chessflare.com/es), [aprendizaje de estudios](https://chessflare.com/es/como-aprender-un-estudio-de-ajedrez), [repaso espaciado](https://chessflare.com/es/repaso-espaciado-estudio-de-ajedrez). Estas referencias describen el objetivo; no se copia su contenido, diseño, cursos ni algoritmos privados.

ChessDev es gratuito. No hay tienda, suscripciones, créditos, pagos ni bloqueo premium. Esto no implica capacidad ilimitada de los proveedores gratuitos.

| Función                                        | ChessDev actual                                                               | Límite real                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Editor PGN                                     | Árbol legal, variantes, comentarios, NAG, FEN, importación y exportación      | Un estudio por PGN; 1 MB y 1.500 medias jugadas para proteger móviles                |
| Aprender estudios / aperturas                  | Líneas propias, elección de color y respuestas automáticas                    | No es un catálogo de cursos escritos por maestros                                    |
| Repaso espaciado                               | SM2, facilidad, fechas y resultados persistidos                               | Programación por variante y color, en este navegador                                 |
| Problemas                                      | Diario de Lichess, CSV CC0 y ejercicios de errores propios                    | CSV de hasta 500 posiciones / 5 MB; sin biblioteca precargada                        |
| Finales                                        | Filtro de temas endgame de la colección importada                             | No hay curso de finales ni tablebases integrado                                      |
| Woodpecker                                     | Colección elegida, 2–7 ciclos, tiempo, errores y objetivo de mitad de tiempo  | El plan se guarda en este navegador                                                  |
| Análisis                                       | Stockfish.js 19.0.1 Lite, WASM en Worker, mejor continuación y profundidad    | La versión ligera y el tiempo limitado no equivalen al análisis profundo de servidor |
| Resumen / revisión                             | Evaluaciones por posición, gráfico, pérdidas de centipeones y cambios de mate | Línea principal; criterio explícito de errores graves ≥200 cp o pérdida de mate      |
| Practicar errores                              | Posiciones y continuación calculadas al revisar tus partidas                  | La solución es la línea a la profundidad indicada; no una explicación conversacional |
| Estadísticas                                   | Sesiones, días, estudios, revisiones; pérdidas por partida                    | Sin Elo estimado, percentiles ni precisión inventada                                 |
| Juego online                                   | Mesa autoritativa de dos jugadores, espectadores y resultados persistidos     | Sin cola de emparejamiento, reloj, clasificación ni rating                           |
| Acceso y datos                                 | Lichess, historial de partidas en D1                                          | Estudios, problemas, repasos y ciclos locales; sincronización pendiente              |
| Cursos completos / rutinas / IA conversacional | Pendientes                                                                    | No se anuncian como implementados                                                    |

## Procedencia y licencias

- [Problemas Lichess](https://database.lichess.org/#puzzles): CC0. El CSV empieza con la jugada previa del rival; se aplica antes de presentar el ejercicio. El diario procede de `https://lichess.org/api/puzzle/daily`; cada problema enlaza al original. La muestra de pruebas `tests/fixtures/lichess-daily.json` reproduce una respuesta real con PGN y solución CC0, sin datos de cuenta ni credenciales.
- [Stockfish.js](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1): archivos oficiales ligeros de un hilo sin modificar. `apps/web/public/engine/COPYING.txt`, `SOURCE.txt` y `SHA256SUMS` incluyen licencia, enlaces al código correspondiente y hashes. WASM de aproximadamente 1,9 MB; no requiere cookies, cuenta, servicio pagado ni aislamiento de origen.
- Guardado: versión `chessdev.library.v1`; migra estudios anteriores sin borrar sus claves originales. Los antiguos contadores de tres ejemplos no se presentan como resultados de este nuevo entrenamiento.
- SM2: primer repaso al día, segundo a los seis días, siguientes según facilidad; fallos y pistas reinician la secuencia. Los tiempos son medidos, no simulados. La calidad expresa recuerdo de la línea, no fuerza ajedrecística.

La existencia de una sección no demuestra paridad completa. Esta tabla debe actualizarse al implementar y comprobar cada capacidad pendiente.
