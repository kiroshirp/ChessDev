# Seguridad

OAuth Lichess con PKCE S256, state aleatorio ligado al verifier y al navegador mediante cookie HttpOnly, consumido una sola vez en D1. Scopes vacíos; acceso a identidad básica. Redirecciones a URLs fijas. El token de Lichess se usa para consultar `/api/account` y se descarta sin almacenarlo. [Detalle](lichess-setup.md).

Sesiones propias de ChessDev de ocho horas, solo hashes en D1, revocables. Cookies HttpOnly y Secure en HTTPS. El token local adicional reside únicamente en memoria para navegadores que bloqueen cookies entre dominios. Nunca guardar credenciales en localStorage; ese almacenamiento solo contiene estudios y progreso. Tras recargar con cookies bloqueadas puede ser necesario acceder de nuevo con Lichess.

API con validación de origen, límite por ruta, cuerpos acotados y secretos internos. Proxy Render limitado a rutas públicas explícitas. Tickets cortos para el servidor, sesión activa y rechazo de identidades de desarrollo en producción. Servidor autoritativo para asientos, turnos, jugadas y resultados. Sin confianza en coordenadas o identidades enviadas por clientes.

La migración al proveedor nuevo revoca sesiones heredadas, conserva cuentas/resultados y evita vincular identidades por nombre. No hay transferencia automática de partidas antiguas a una nueva cuenta de Lichess.

Sin pruebas de carga ni garantía de disponibilidad. Render Free puede dormir o reiniciar y perder partidas activas; los resultados persistidos permanecen en D1. Antes de orientar el servicio a menores, definir edad, jurisdicción y consentimiento; el proveedor de identidad no sustituye esas decisiones.
