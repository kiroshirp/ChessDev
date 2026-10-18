# PixelSpace — instrucciones permanentes

La especificación permanente es `docs-specification.es.md`; las decisiones posteriores en `docs/decisions.md` prevalecen cuando la modifican. Priorizar movimiento, multijugador autoritativo y ajedrez legal comprobados con dos clientes. Core no depende del ajedrez. No crear controles falsos ni declarar pruebas no ejecutadas. No implementar torneos avanzados, pagos, IA educativa o editor sin petición.

Acceso público obligatorio con Discord. Base de datos: Cloudflare D1. Colyseus necesita Node persistente (destino Cloudflare Containers). GitHub Pages aloja solo el frontend. Nunca subir secretos, bases locales ni credenciales. Identidades de desarrollo limitadas a loopback, nunca producción. Comprobar TypeScript, lint, tests, build y E2E antes de publicar; documentar infraestructura no verificada. No delegar a subagentes sin petición explícita.
