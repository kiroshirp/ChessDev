# Lichess

**Pendiente — Fase 8.** No hay OAuth, token, petición a Lichess ni perfil externo en esta entrega. PixelSpace no dependerá de esta integración para funcionar.

Antes de implementar: revisar [API oficial](https://lichess.org/api), scopes, modalidades Board API, límites y condiciones vigentes. OAuth Authorization Code + PKCE, state verificado, redirect allowlist y tokens cifrados en backend. No exponer tokens al frontend ni almacenar credenciales Lichess.

Primera entrega: vínculo opcional de perfil, ratings con fuente/modalidad/fecha y revocación. No confundirlos con rating interno. Imports PGN autorizados y acotados. Cola por credencial, una solicitud activa cuando corresponda, backoff y gestión de 429/caídas. No scraping ni automatización de la web.

Pruebas de aceptación: éxito/denegación OAuth, state/PKCE inválidos, expiración, revocación, 429 y datos incompletos. Revisar los scopes de nuevo al añadir desafíos; no pedir permisos de juego para mostrar estadísticas.
