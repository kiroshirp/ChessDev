# Permisos

Herramientas de análisis, estudios y práctica accesibles sin cuenta. Juego público y perfil requieren Lichess. Primera autorización crea una cuenta propia de ChessDev. Sin scopes de correo, mensajes o modificación de la cuenta Lichess.

Desarrollo con identidades de pruebas solo en loopback. Producción rechaza ese acceso. Sesiones, tickets, asientos y jugadas se validan en servidor. Espectadores ven la mesa, nunca tokens, identificadores del proveedor ni secretos. Historial privado por cuenta.

El proxy de Render expone solo las rutas públicas enumeradas. Las rutas internas exigen secreto y no se publican en el proxy. Ningún secreto debe tener prefijo VITE.
