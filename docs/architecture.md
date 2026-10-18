# Arquitectura de la primera versión técnica

Restricción vigente: comenzar sin cargos. Cloud Run se aplaza porque Firebase está en Spark y requiere Blaze; Render Free es la alternativa preparada, aún pendiente de aceptar y desplegar. El diagrama refleja el destino Firebase previamente elegido, no un backend ya publicado. API/usuarios/resultados siguen en Cloudflare.

El documento maestro permanece en `docs-specification.es.md`. Las modificaciones solicitadas el 18 de octubre de 2026 figuran en `decisions.md`: Discord obligatorio y base de datos Cloudflare.

```text
GitHub Pages — React / Vite / Phaser
  ├─ HTTPS → API Worker — Discord OAuth / sesiones / Cloudflare D1
  └─ HTTPS/WSS → Cloud Run (Firebase pixelspace-93730) — Node / Colyseus
                         └─ HTTPS con secreto interno → API Worker
```

La misma API se ejecuta localmente detrás de Fastify usando SQLite de Node 24 como adaptador. Comparte repositorio SQL parametrizado y migraciones con D1. `node:sqlite` es experimental y se utiliza solo para desarrollo/pruebas; la API de producción es un Worker con binding D1.

## Separación de responsabilidades

- `map-engine`: geometría, zonas, puntos de aparición y objetos con identificadores de actividad. El mapa puede contener un objeto `activityId: chess` sin implementar reglas.
- `world-engine`: simulación pura, velocidad normalizada y colisiones. Acepta posiciones estructurales, incluyendo accesores de Schema; no depende de Phaser o ajedrez.
- `realtime`: esquemas de jugadores y colección sincronizada, sin datos privados ni reglas de actividad.
- `auth`: identidad general y tickets HMAC de corta duración.
- `database`: esquema Drizzle SQLite y repositorio compatible con D1/SQLite. No se persiste presencia por frame.
- `chess-core`: mesa con dos asientos, reglas chess.js, revisión monotónica, reclamaciones y resultado. No depende de Phaser ni Colyseus.
- `world-server`: orquesta entradas, presencia, objetos y actividad Chess; valida tickets y sesiones con API.
- `web`: representación e interfaz ES/EN. El tablero valida para ofrecer selección de casillas; la autoridad final es el servidor.

La inicialización de actividades usa mensajes genéricos `world:interact` / `activity:open`; nuevas actividades pueden añadir su componente y handlers sin cambiar la simulación o Phaser. La implementación actual registra solo Chess.

## Decisiones técnicas

Npm workspaces y un lockfile. React 19.3.1, Vite 8.3.4, Phaser 3.90.0, Colyseus core 0.18.19/SDK 0.18.5/schema 5.0.41, chess.js 1.4.0, Wrangler 4.151.1. Phaser 3 sigue fijado por compatibilidad comprobada aunque npm ofrece Phaser 4. No se presupone compatibilidad entre majors.

El backend se empaqueta con esbuild a ESM de Node 24; los módulos propios quedan incluidos y los proveedores de networking externos conservan su runtime. El Worker se empaqueta con Wrangler. TypeScript estricto comprueba también el gateway en un proyecto separado con tipos Workers.

D1 sustituye al PostgreSQL propuesto inicialmente por preferencia explícita del usuario. No hubo datos de producción que migrar. Las migraciones PostgreSQL iniciales se retiran para evitar dos esquemas contradictorios. El mapa se mantiene como datos TypeScript versionados; aún no hay editor ni mapas privados.

## Alcance operativo

Destino Cloud Run, una instancia y una revisión recibiendo tráfico como configuración inicial, salas Colyseus de 24 plazas como límite técnico **sin prueba de carga**. El gateway de Cloudflare Containers se conserva como alternativa anterior, sin desplegar. La base de datos continúa en D1 por confirmación del usuario. Los resultados terminados se guardan en D1; partidas en curso y presencia están en memoria y se pierden al reiniciar el proceso. Cloud Run limita la duración de cada WebSocket; hay que verificar reconexión remota y vaciar salas antes de desplegar revisiones nuevas. No se anuncia tolerancia a fallos o escalabilidad. Infraestructura y costes pendientes en `firebase-colyseus.md`.

Fuentes primarias: [Colyseus](https://docs.colyseus.io/server), [reconexión](https://docs.colyseus.io/room/reconnection), [Discord OAuth](https://docs.discord.com/developers/topics/oauth2), [Cloudflare Containers](https://developers.cloudflare.com/containers/api/container-class/), [D1](https://developers.cloudflare.com/d1/), [chess.js](https://github.com/jhlywa/chess.js). Versiones/licencias comprobadas además mediante npm y ejecución local.
