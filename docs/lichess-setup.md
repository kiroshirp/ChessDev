# Acceso con Lichess

ChessDev usa [OAuth Authorization Code con PKCE S256](https://lichess.org/api#section/Authentication). No requiere registrar una aplicación ni client secret. Scopes vacíos: identidad básica, sin correo, mensajes o acciones en la cuenta de Lichess.

Producción: `LICHESS_CLIENT_ID=chessdev`, `LICHESS_REDIRECT_URI=https://kiroshirp.github.io/ChessDev/`, igual a `FRONTEND_URL`. Desarrollo: la URL del frontend local, normalmente `http://127.0.0.1:5173/`.

1. El navegador genera state y verifier, guardados temporalmente en **sessionStorage de esa pestaña**, con un máximo de 15 minutos. Son datos transitorios del protocolo; nunca tokens de cuenta o sesión.
2. `POST /auth/lichess/start` recibe state y challenge S256. D1 guarda únicamente el hash conjunto y la caducidad. Devuelve la URL fija de autorización Lichess. La navegación usa la misma pestaña.
3. Lichess devuelve `code` y `state` al frontend de Pages. La página los retira inmediatamente de la URL, compara el state con el de su pestaña y elimina los datos transitorios.
4. `POST /auth/lichess/complete` verifica y consume el challenge almacenado, intercambia el código con el verifier, consulta `/api/account` y descarta el token de Lichess. Devuelve una sesión propia de ChessDev.

El flujo no necesita cookies de Render para validar OAuth. Las sesiones propias siguen usando cookies HttpOnly cuando el navegador las admite y token solo en memoria para el resto. No hay tokens de cuenta ni sesión en almacenamiento web. Un refresco con cookies entre dominios bloqueadas puede requerir entrar de nuevo.

El enlace antiguo `/auth/lichess` lleva al frontend para iniciar el flujo actual. El callback anterior muestra una instrucción de reinicio sin aceptar una sesión ni devolver un error JSON sin contexto. Las rutas nuevas están enumeradas en el proxy público. No se expone `/internal`.

Pruebas: state/verifier incorrectos, caducidad, concurrencia, repetición, retorno sin cookies, capacidades lentas, otra pestaña y ausencia de tokens persistidos. Proveedor simulado en pruebas; no sustituye una autorización con una cuenta real.
