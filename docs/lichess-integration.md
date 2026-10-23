# Integración con Lichess

La autenticación usa OAuth PKCE S256 para obtener la identidad básica del usuario, sin client secret ni scopes de acciones. [Configuración](lichess-setup.md).

Las partidas de ChessDev se juegan en su propio servidor autoritativo y se guardan en D1. No modifican Elo ni historial de Lichess. No hay importación automática de partidas externas: se pueden importar PGN manualmente. No se ejecutan jugadas ni mensajes en la cuenta Lichess del usuario.

Motor de evaluación, sincronización de estudios y consulta de estadísticas externas quedan fuera de esta entrega.
