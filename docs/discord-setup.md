# Activar inicio de sesión con Discord

Esta aplicación usa **OAuth2**, no un bot. Discord identifica al usuario y PixelSpace crea o recupera su cuenta en Cloudflare D1. No se necesitan contraseñas propias, correo, permisos de servidor ni lectura de mensajes. Scope único `identify`.

Estado: el propietario ya creó **PixelSpace**, Client ID público `1561437644226044104`, comprobado en OAuth2 y configurado en Wrangler. No volver a crear otra aplicación. Faltan el callback del Worker real y el secreto privado. Los pasos de creación siguientes quedan como referencia.

## Crear la aplicación

1. Entrar en [Discord Developer Portal](https://discord.com/developers/applications) con la cuenta propietaria de PixelSpace.
2. Pulsar **New Application**, nombre **PixelSpace**. El propietario debe revisar y aceptar los términos que muestre Discord.
3. Abrir **OAuth2**. Copiar el **Client ID** (es público; puede compartirse para configurar el proyecto).
4. En **Redirects**, añadir la URL **exacta del Worker de API** terminada en `/auth/discord/callback`, y guardar cambios. Ejemplo de formato: `https://TU-API.workers.dev/auth/discord/callback`. El dominio exacto sigue pendiente del despliegue de ese Worker. **No usar Pages, Firebase ni la URL de Colyseus como callback.**
5. Obtener el **Client Secret** de OAuth2 de forma privada. Si Discord ofrece Reset Secret, debe hacerlo el propietario. Guardarlo directamente con el prompt privado de Wrangler, nunca en el chat ni en Git. No hace falta crear ni compartir un Bot Token.

## Configurar la API

Con la aplicación y Worker reales, verificar `DISCORD_CLIENT_ID` ya configurado en `wrangler.jsonc` y establecer `DISCORD_CLIENT_SECRET` y `DISCORD_REDIRECT_URI`:

```powershell
npx wrangler secret put DISCORD_CLIENT_SECRET --config apps/api/wrangler.jsonc
npx wrangler secret put DISCORD_REDIRECT_URI --config apps/api/wrangler.jsonc
```

Wrangler solicita cada valor interactivamente. Confirmar `FRONTEND_URL=https://kiroshirp.github.io/PixelSpace/`, `ENVIRONMENT=production`, D1 y los secretos compartidos con Colyseus según `deployment.md`. Después publicar el Worker y recompilar Pages con su `VITE_API_URL` real y la URL del alojamiento elegido para Colyseus como `VITE_WORLD_URL` (propuesta Render Free para empezar sin facturación).

La URL de OAuth se genera desde el servidor con estado aleatorio vinculado al navegador; no se necesita el generador de invitación de bots ni copiar enlaces manualmente. Los usuarios acceden con **Continuar con Discord** en PixelSpace.

## Comprobación real

- `/capabilities` debe devolver `discordConfigured: true` y `developmentAuth: false`.
- Entrar por Discord, autorizar `identify`, volver a Pages y ver nombre/cuenta.
- Volver a entrar conserva el mismo usuario e historial. Probar cerrar sesión.
- Abrir otro navegador con otra cuenta Discord, entrar al mismo mundo y completar una partida.
- No activar el acceso de desarrollo para resolver fallos de OAuth. Si Discord indica redirect inválido, comparar carácter por carácter Redirects y `DISCORD_REDIRECT_URI` (protocolo, host, ruta y ausencia de barra adicional).

Para pruebas locales se puede añadir otro redirect `http://127.0.0.1:3001/auth/discord/callback` y configurar el `.env` ignorado. No sobrescribir secretos existentes ni publicar ese callback como destino de producción.

Fuente: [OAuth2 de Discord](https://docs.discord.com/developers/topics/oauth2).
