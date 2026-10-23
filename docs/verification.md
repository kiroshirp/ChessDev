# ChessDev — verificación del 23 de octubre de 2026

Nueva web de ajedrez con identidad ChessDev. TypeScript, lint, build y 29 pruebas iniciales aprobados. Cinco E2E aprobados: protocolo/reconexión, partida con dos clientes hasta mate y resultado persistido, PGN/almacenamiento, problemas/aperturas y móvil sin desbordamiento. Capturas de escritorio y móvil revisadas. Smoke de producción bajo `/PixelSpace/` aprobado.

Infraestructura existente: Render Free `pixelspace-world`, despliegue `dep-dbdp3kbrjlhs73ft620g` desde fcd4b37; Worker actualizado en versión `d7afe405-1b06-4d0b-8586-f4c58b9e2cc0`. La comprobación pública previa a sustituir el proveedor de acceso confirmó health 200, rechazo de identidades de desarrollo y tickets anónimos. Sin facturación ni servicios nuevos.

Cambio posterior solicitado: acceso con Lichess mediante OAuth PKCE S256, sin client secret ni scopes de acciones. Pruebas de state, verifier manipulado, callback repetido y código local de un solo uso aprobadas con proveedor simulado. Se añade prueba de migración que conserva cuentas/resultados y revoca sesiones heredadas. Pendiente repetir checks, E2E y producción tras este cambio y completar consentimiento OAuth con una cuenta real.

GitHub: CI aprobado para la rama de preparación fcd4b37 (run 39990788535). La actualización de la variable pública de Actions exigió reautenticación y no se confirmó; las URLs correctas se declaran ahora en el workflow versionado. Main/Pages pendientes de verificar y publicar la nueva autenticación.

Límites: cuatro líneas introductorias, tres problemas; sin motor de evaluación, rating, repetición espaciada automática o sincronización de estudios entre equipos. No se ha probado carga ni juego con dos cuentas remotas. Resultados finalizados persistidos en D1; partidas activas efímeras en Render.
