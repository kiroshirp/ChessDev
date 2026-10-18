# Primera prueba pública sin facturación

El usuario pide explícitamente no recibir cargos todavía. **No vincular tarjeta, activar Blaze, contratar Containers ni seleccionar instancias de pago.** Firebase `pixelspace-93730` permanece en Spark; el despliegue de Colyseus allí se aplaza porque Cloud Run requiere facturación vinculada.

Arquitectura aceptada por el usuario: GitHub Pages para la web, Cloudflare Workers Free + D1 Free para API/cuentas/resultados y **Render Free para Colyseus**. El usuario autoriza publicar cuando esté todo conectado. No hace falta contratar una base en Render. El estado real de despliegue se registra en `verification.md`.

## Configuración preparada

`render.yaml` define solo un Web Service Docker, `plan: free`, región Frankfurt, salud `/health`, variables públicas y tres valores solicitados de forma privada. No crea bases, discos ni servicios de pago. Los despliegues automáticos están desactivados para evitar reiniciar partidas con cada push.

Si el usuario acepta Render, iniciar sesión o crear su cuenta revisando sus términos. Sin método de pago, seleccionar workspace gratuito y servicio **Free**. Si el proveedor exige tarjeta, detener el alta: no introducirla ni actualizar de plan. Revisar el resumen antes de crear recursos. Se puede conectar solo el repositorio PixelSpace o usar su URL pública en alta manual (esta última evita otorgar acceso a GitHub).

En Blueprint usar este repositorio y `render.yaml`. Alternativa manual: Web Service, Public Git Repository `https://github.com/kiroshirp/PixelSpace`, Dockerfile `infrastructure/world.Dockerfile`, contexto raíz, plan Free, `/health`, autodeploy desactivado y variables del YAML. `PORT` lo asigna Render y ya lo admite el servidor.

`API_URL` debe ser el HTTPS real del Worker Cloudflare. `WORLD_SECRET` e `INTERNAL_SECRET` son dos secretos aleatorios distintos de 32+ caracteres, iguales a sus respectivos valores del Worker. Introducirlos privadamente en el panel, no en Git ni en el chat. Discord Client Secret solo pertenece al Worker.

Antes de desplegar, comprobar también que Cloudflare usa Workers Free/D1 Free. Configurar D1, OAuth y secretos según `deployment.md` y `discord-setup.md`. No crear recursos pagados para superar cuotas. Al disponer de la URL real de Render, guardarla como `VITE_WORLD_URL`; Worker como `VITE_API_URL`, recompilar Pages y probar dos cuentas Discord reales.

## Límites que afectan a esta prueba

Render Free duerme tras 15 minutos sin tráfico entrante (incluidos mensajes WebSocket); volver a arrancar puede tardar alrededor de un minuto. Dispone de 750 horas por workspace/mes, compartidas con otros servicios Free. Sin método de pago, agotar las cuotas puede suspender servicios o nuevos builds en vez de facturar. No añadir tarjeta; con tarjeta, ciertos excesos sí pueden generar cargos. No crear pings artificiales para evitar el reposo.

Puede reiniciarse en cualquier momento. Se perderán presencia y partidas en curso; los resultados ya guardados permanecen en D1. Una instancia, sin prueba de carga ni garantía de disponibilidad. Adecuado para demostración inicial, no prometer continuidad de producción. Vaciar salas antes de despliegues manuales. Comprobar arranque en frío y reconexión remota además de movimiento, dos clientes y ajedrez.

Fuentes verificadas el 18 de octubre de 2026: [Render Free](https://render.com/docs/free), [WebSockets](https://render.com/docs/websocket), [servicios y repositorio público](https://render.com/docs/web-services), [referencia Blueprint](https://render.com/docs/blueprint-spec). Las políticas pueden cambiar; revisar el resumen de coste real al crear el servicio.
