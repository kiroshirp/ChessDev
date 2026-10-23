# Persistencia de ChessDev

Cloudflare D1 (SQLite), esquema Drizzle en `packages/database/src/schema.ts`, SQL y snapshots en `d1-migrations`. Identidad propia UUID y `provider_id` único con prefijo `lichess:`; los nombres no vinculan cuentas. Perfiles privados y marca de desarrollo.

Sesiones de ocho horas con hash SHA-256 de token; estado OAuth ligado al challenge del verifier con quince minutos; códigos locales de retorno de un uso y 60 segundos. El token Lichess solo se usa para obtener `/api/account`, se descarta y no se persiste. Los contadores de peticiones son atómicos y caducan. El cron limpia los registros expirados.

`chess_results` conserva UUID de partida, jugadores, PGN, resultado, motivo y fecha. Guardado idempotente; el servidor reintenta mientras vive la sala. No hay cola duradera para fallos del proceso ni restauración de partidas activas.

La migración 0002 renombra la columna de identidad heredada, conserva cuentas/resultados, separa identidades con prefijo `legacy:` y revoca sesiones del proveedor retirado. Las migraciones históricas no se reescriben. No se transfieren resultados por coincidencia de nombre a una cuenta Lichess nueva.

Local: `.local/pixelspace.sqlite`, ignorado. El adaptador aplica migraciones pendientes en transacciones. D1 existente: `npx wrangler d1 migrations apply DB --remote --config apps/api/wrangler.jsonc`. Verificar cuenta y base antes de migrar. Nunca borrar o recrear la base para cambiar de proveedor.

Pendientes de producto: política de retención, exportación/borrado de cuenta y simulacro de restauración. Estudios y progreso se guardan solo en el navegador; exportación PGN disponible.
