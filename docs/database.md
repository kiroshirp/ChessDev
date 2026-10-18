# Persistencia Cloudflare D1

D1 utiliza SQLite. `packages/database/src/schema.ts` define el esquema Drizzle; `d1-migrations/` contiene SQL y snapshots. Las cuentas no necesitan contraseña ni correo: Discord aporta un identificador único y un nombre visible con scope `identify`.

| Tabla           | Contenido y restricciones                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- |
| users           | UUID propio, Discord ID único, nombre, perfil privado, marca de identidad de desarrollo, fecha |
| user_sessions   | UUID, FK usuario con cascade, hash SHA-256 de token único, expiración de 8 horas               |
| login_states    | Hash de estado OAuth, caducidad de 5 minutos, consumo atómico una vez                          |
| login_exchanges | Hash del código de retorno de un solo uso, FK usuario, caducidad de 60 segundos                |
| request_limits  | Contador atómico por origen de red/ruta/minuto, caducidad y limpieza                           |
| chess_results   | UUID de partida único, FK blancas/negras con set null, PGN, resultado, motivo y fecha          |

Tokens Discord se utilizan para obtener `/users/@me` y se descartan. No se guardan access/refresh tokens Discord. Los tokens de sesión se almacenan solo como hash; la cuenta no se enlaza por nombres ni correos.

Local: `.local/pixelspace.sqlite`, ignorado por Git. El adaptador aplica migraciones pendientes dentro de transacciones. D1: `wrangler d1 migrations apply DB --local/--remote --config apps/api/wrangler.jsonc`. No usar `--remote` contra una base no confirmada. No modificar SQL ya aplicado; añadir migraciones. El esquema de la Fase 0 PostgreSQL se sustituyó antes de contener datos reales.

El cron del Worker limpia sesiones/estados/códigos y contadores caducados cada día. Los resultados se guardan de forma idempotente; si falla la API, el servidor muestra el fallo y reintenta cada 30 segundos mientras vive la sala. No hay cola duradera: un fallo de proceso antes del guardado puede perder el resultado. Partidas en curso no se restauran tras reinicio.

Antes de beta pública: política de retención definitiva, exportación/borrado de cuentas, backups D1 y simulacro de restauración; control de registros de menores por territorios de lanzamiento. No se han implementado esas puertas por el mero hecho de existir una base de datos.
