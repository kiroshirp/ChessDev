# Decisiones vigentes

23 de octubre de 2026: el usuario sustituye PixelSpace por una plataforma de ajedrez inspirada funcionalmente en ChessFlare y visualmente en chesshub.kiroshirp.workers.dev. Confirma el nombre **ChessDev** y el acceso exclusivo con **Lichess**, retirando el proveedor anterior.

Mantener repositorio, historial recuperable, URLs técnicas y módulos reutilizables de reglas, autenticación, D1 y Colyseus. Retirar UI de mundo virtual. Herramientas locales sin cuenta; Lichess obligatorio para juego público. OAuth PKCE S256, sin client secret ni scopes de acciones. Conservar resultados y cuentas anteriores; revocar sesiones del proveedor retirado y no vincular cuentas por nombre.

Sin cargos ni facturación. GitHub Pages para frontend, Cloudflare Workers/D1 Free para cuentas/resultados y Render Free para Colyseus. Firebase Cloud Run aplazado en Spark. No Blaze, Containers o servicios de pago.

API pública por `https://pixelspace-world.onrender.com/api`, upstream del servidor en Cloudflare. No publicar `/internal`. Callback público `/api/auth/lichess/callback`. La red local no alcanza workers.dev directamente.

El usuario autoriza publicar una vez conectado y verificado el conjunto. TypeScript, lint, tests, build y E2E antes de publicar. No funciones ni cifras simuladas. Sin motor de evaluación, Elo, tienda, pagos o entrenadores IA en esta entrega.
