# Seguridad y límites

Implementado: OAuth Authorization Code confidencial con state ligado a cookie HttpOnly y consumido una vez, scope `identify`, retorno a URL fija, token Discord descartado tras consultar identidad. El código de retorno solo sirve durante 60 segundos y una vez. Se elimina del fragmento del navegador al consumirlo.

La sesión de PixelSpace dura 8 horas, se guarda con hash en D1 y admite revocación. Cookie HttpOnly, Secure/SameSite=None en HTTPS; token de sesión adicional guardado **solo en memoria de la página** permite funcionar cuando el navegador bloquea cookies de terceros entre Pages y Workers. No se usa localStorage/sessionStorage para credenciales. Tras refrescar con cookies bloqueadas puede ser necesario volver a Discord; un dominio propio común evita esa limitación.

Origen permitido explícito para API/WS; POST público requiere Origin; tickets HMAC de corta duración y nonces no reutilizables. Operaciones entre servicios con secreto propio. Zod, SQL parametrizado, límite de mensajes/payload y límite atómico en D1 por IP/ruta/minuto. El contador usa `CF-Connecting-IP` proporcionado por Cloudflare; localmente el presupuesto es compartido entre pruebas de ese minuto.

Secretos solo en `.env` local, `.dev.vars` o Wrangler secrets. Esos archivos, SQLite local y estados Wrangler se excluyen de Git y Docker. Los valores locales conocidos no son secretos de producción y nunca se usan como fallback en el contenedor de producción.

La API local Fastify limita cuerpos a 64 KiB. El Worker valida forma/tamaño de campos; antes de beta debe completarse auditoría de límites HTTP/streaming, protección de coste en el gateway, monitorización, backups, permisos administrativos, exportación/borrado y retención. No se ha realizado auditoría externa ni prueba de carga.

No hay chat, mensajes privados, voz o grabaciones. Aún hay que decidir países, edad mínima y consentimiento antes de habilitar registros de menores. Discord por sí solo no sustituye esas decisiones. No desplegar como academia educativa pública para menores hasta resolverlas.

La dependencia histórica de drizzle-kit requiere un override limitado de esbuild 0.25.12 en `@esbuild-kit/core-utils` (GHSA-67mh-4wv8-2f99). Se comprueba generación de migraciones con esa resolución. Revisar avisos y retirar el override cuando upstream lo resuelva; no ejecutar `audit fix --force` automáticamente.
