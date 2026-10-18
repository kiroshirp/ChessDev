# Procedencia y licencias

La licencia MIT original pertenece a KiroshiRP, 2026, y se conserva en `LICENSE`.

| Recurso                                | Procedencia                                         | Licencia / condiciones                  |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Mapa, mobiliario, avatar y texturas    | Código procedural propio en `apps/web/src/scene.ts` | Licencia MIT del repositorio            |
| Avatar de interfaz y marca tipográfica | CSS y texto originales de esta entrega              | Licencia MIT del repositorio            |
| Tipografía                             | Pila de fuentes del sistema                         | No se distribuyen archivos tipográficos |
| Iconos simples                         | Caracteres Unicode y CSS                            | No se distribuye colección externa      |

No se usan assets de Gather o Lichess. No hay imágenes descargadas ni generadas por terceros.

Dependencias consultadas en npm: React, React DOM, Vite, Phaser, Fastify y Colyseus MIT; Drizzle ORM Apache-2.0; **chess.js 1.4.0 BSD-2-Clause**; adaptador Cloudflare Containers MIT OR Apache-2.0. PGlite/PostgreSQL ya no se utilizan. Las herramientas y transitivas conservan sus avisos. `package-lock.json` registra versiones resueltas; revisar licencias al distribuir, sin asumir una sola licencia para todo el árbol.

El tablero de React es propio y representa piezas mediante glifos Unicode de fuentes del sistema, sin distribuir archivos de fuentes o diseños Lichess. Stockfish y chessground no se incluyen. A propuesta del usuario se consultó el [índice oficial de código fuente Lichess](https://lichess.org/source); no se copió código. Antes de reutilizar un componente habrá que revisar su licencia exacta y sus obligaciones (incluidas GPL/AGPL cuando corresponda). Puzzles y contenidos educativos futuros requieren procedencia/permiso explícitos.
