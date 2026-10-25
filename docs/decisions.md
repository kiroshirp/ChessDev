# Decisiones vigentes

23 de octubre de 2026: el usuario sustituye PixelSpace por una plataforma de ajedrez inspirada funcionalmente en ChessFlare y visualmente en chesshub.kiroshirp.workers.dev. Confirma el nombre **ChessDev** y el acceso exclusivo con **Lichess**, retirando el proveedor anterior.

Mantener repositorio, historial recuperable, URLs técnicas y módulos reutilizables de reglas, autenticación, D1 y Colyseus. Retirar UI de mundo virtual. Herramientas locales sin cuenta; Lichess obligatorio para juego público. OAuth PKCE S256, sin client secret ni scopes de acciones. Conservar resultados y cuentas anteriores; revocar sesiones del proveedor retirado y no vincular cuentas por nombre.

Sin cargos ni facturación. GitHub Pages para frontend, Cloudflare Workers/D1 Free para cuentas/resultados y Render Free para Colyseus. Firebase Cloud Run aplazado en Spark. No Blaze, Containers o servicios de pago.

API pública por `https://pixelspace-world.onrender.com/api`, upstream del servidor en Cloudflare. No publicar `/internal`. Callback público `/api/auth/lichess/callback`. La red local no alcanza workers.dev directamente.

El usuario autoriza publicar una vez conectado y verificado el conjunto. TypeScript, lint, tests, build y E2E antes de publicar. No funciones ni cifras simuladas. Sin motor de evaluación, Elo, tienda, pagos o entrenadores IA en esta entrega.

23 de octubre de 2026, cambio posterior: el usuario pide retirar PixelSpace de la URL pública. Renombrar el repositorio a **kiroshirp/ChessDev**, publicar en **https://kiroshirp.github.io/ChessDev/** y actualizar base de assets y FRONTEND_URL del Worker. Conservar historial y direcciones de servicios internos; el callback Lichess en Render no cambia.

Corrección móvil: piezas SVG originales compartidas por todos los tableros e ilustraciones, sin fuentes/emoji. El error Invalid or expired OAuth state obliga a sustituir el estado ligado a cookie de Render por PKCE ligado a la pestaña. Callback en la raíz del frontend, challenge de un solo uso en D1 y state/verifier en sessionStorage durante 15 minutos; ningún token de cuenta o sesión se persiste en almacenamiento web.

25 de octubre de 2026: el usuario rechaza las funciones reducidas o inventadas y reafirma que ChessDev es gratuito. Retirar las cuatro secuencias presentadas como cursos y los tres problemas usados para todas las modalidades. Sustituirlos por aprendizaje de PGN propios con variantes, SM2 real, problemas Lichess con procedencia y ciclos Woodpecker medidos. Esta decisión amplía el alcance anterior: se incorpora Stockfish.js 19 Lite gratuito en Web Worker, con licencia GPL3 y acceso al código correspondiente; no hay API de IA ni costes de inferencia. Revisiones y resumen se basan en evaluaciones reales y declaran su profundidad, sin simular porcentajes de precisión. Catálogo de cursos, entrenador conversacional, sincronización de entrenamiento y emparejamiento con reloj/rating continúan pendientes; el menú no los presenta como disponibles. El entrenamiento permanece local y la identidad/historial público conserva Lichess y D1. No cambiar infraestructura ni activar facturación.
