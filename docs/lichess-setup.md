# Acceso con Lichess

ChessDev usa [OAuth Authorization Code con PKCE S256 de Lichess](https://lichess.org/api#section/Authentication). No requiere registrar una aplicación ni guardar un client secret. El usuario autoriza su identidad; no se solicitan scopes de correo, mensajes, estudios privados ni juego en su cuenta.

Configuración pública del Worker: `LICHESS_CLIENT_ID=chessdev`, `LICHESS_REDIRECT_URI=https://pixelspace-world.onrender.com/api/auth/lichess/callback`. Desarrollo: `http://127.0.0.1:3001/auth/lichess/callback`.

1. `/auth/lichess` crea state y verifier aleatorios. Cookie HttpOnly durante cinco minutos, state ligado a verifier y consumido una vez en D1.
2. Redirige a `https://lichess.org/oauth` con challenge S256 y scopes vacíos.
3. El callback intercambia código con verifier en `/api/token`; consulta `/api/account` y descarta el token de Lichess sin persistirlo ni enviarlo al frontend.
4. Crea/recupera la identidad `lichess:<id>` y emite un código local de un solo uso, válido 60 segundos, para la sesión propia de ChessDev.

La migración 0002 conserva cuentas y resultados previos, renombra la columna de identidad a `provider_id` y revoca sesiones del proveedor retirado. No vincula cuentas antiguas y nuevas por nombre. Las migraciones históricas conservan nombres de columnas necesarios para actualizar instalaciones existentes.

Verificar state incorrecto, verifier manipulado, callback reutilizado, código local de un uso y ausencia de tokens de proveedor persistidos. El consentimiento real en Lichess corresponde al usuario; las pruebas con proveedor simulado no lo sustituyen.
