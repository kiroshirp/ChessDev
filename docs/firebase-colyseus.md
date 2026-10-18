# Colyseus en Firebase / Cloud Run

**Aplazado:** el usuario pide empezar sin cargos. No activar Blaze ni ejecutar los pasos de creación/despliegue siguientes. Se conserva esta preparación como alternativa futura; ver `free-hosting.md` para la propuesta inicial gratuita.

Destino confirmado: proyecto `pixelspace-93730`. Solo Colyseus se mueve a Google; usuarios, sesiones, OAuth y resultados siguen en Cloudflare Worker + D1. Frontend en GitHub Pages. No crear Firestore ni Firebase Authentication para esta arquitectura.

## Estado comprobado

18 de octubre de 2026: consola abierta con sesión del propietario; proyecto PixelSpace visible y **plan Spark**. Cloud Run exige facturación vinculada (Blaze), aun dentro de su cuota gratuita. No se cambió el plan ni se crearon recursos de pago. La CLI Firebase existente accede a otra cuenta sin este proyecto. `gcloud` y Docker no están instalados. No hay URL de Cloud Run asignada todavía.

## Preparación local

`world-server` escucha `PORT` proporcionado por Cloud Run y enlaza a `0.0.0.0` en producción. Conserva `WORLD_PORT` y loopback para desarrollo. El contenedor existente `infrastructure/world.Dockerfile` empaqueta el servidor Node 24; Cloud Build permite construirlo remotamente sin instalar Docker local.

`npm run build -w @pixelspace/world-server` y `npm run test:cloudrun` comprueban el bundle Node en modo producción con un puerto asignado dinámicamente, salud, CORS y rechazo de entrada sin ticket. No equivalen a probar el contenedor o Cloud Run real.

## Acceso y costes antes de desplegar

El propietario debe vincular facturación en Firebase si acepta Blaze. Crear una alerta de presupuesto; una alerta **no impone un tope de gasto**. Cloud Run, Cloud Build, Artifact Registry, Secret Manager y tráfico pueden generar cargos. Conexiones WebSocket abiertas mantienen la instancia activa. No prometer alojamiento gratuito ni un coste mensual fijo.

Instalar Google Cloud CLI desde el proveedor oficial, iniciar sesión y verificar el proyecto explícitamente. Los comandos siguientes son preparación documentada: no se han ejecutado. Región propuesta `europe-west1`; confirmar antes de crear recursos.

```powershell
gcloud auth login
gcloud projects describe pixelspace-93730
gcloud billing projects describe pixelspace-93730
```

No cambiar a la cuenta de otros proyectos ni otorgar permisos globales. Las operaciones siguientes requieren permisos concretos en este proyecto.

## Construcción y despliegue, tras autorizar facturación

Crear/habilitar únicamente los servicios necesarios:

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project=pixelspace-93730
gcloud artifacts repositories create pixelspace --repository-format=docker --location=europe-west1 --project=pixelspace-93730
gcloud builds submit . --config=infrastructure/cloudbuild.world.yaml --project=pixelspace-93730
```

Si el repositorio ya existe, inspeccionarlo y reutilizarlo. El archivo Cloud Build solo construye/publica la imagen; no despliega. `.gcloudignore` excluye secretos, Git, bases locales y dependencias. Ejecutar `gcloud meta list-files-for-upload` y revisar antes de subir. Para publicaciones sucesivas usar `_TAG` con el SHA de Git y desplegar la imagen por digest verificado, sin reutilizar `manual` como identificador inmutable.

Crear cuenta de servicio `pixelspace-world` sin roles de base de datos. Crear secretos `pixelspace-world-secret` y `pixelspace-internal-secret`, con los mismos valores aleatorios de 32+ caracteres configurados en el Worker, distintos entre sí. Introducirlos mediante Secret Manager de forma privada; no pasarlos como argumentos, variables VITE o mensajes. Dar `roles/secretmanager.secretAccessor` a esa cuenta **solo en esos dos secretos**. No se necesitan credenciales de Discord en Colyseus, ni claves JSON de servicio.

Tras verificar URL del Worker, imagen y cuenta de servicio, adaptar los valores de relleno:

```powershell
gcloud run deploy pixelspace-world --project=pixelspace-93730 --region=europe-west1 --image=europe-west1-docker.pkg.dev/pixelspace-93730/pixelspace/world@sha256:REEMPLAZAR_DIGEST --service-account=pixelspace-world@pixelspace-93730.iam.gserviceaccount.com --port=8080 --cpu=1 --memory=512Mi --concurrency=80 --min=0 --max=1 --min-instances=0 --max-instances=1 --timeout=3600 --session-affinity --no-use-http2 --allow-unauthenticated --set-env-vars=NODE_ENV=production,HOST=0.0.0.0,API_URL=https://REEMPLAZAR-API.workers.dev,ALLOWED_ORIGINS=https://kiroshirp.github.io --set-secrets=WORLD_SECRET=pixelspace-world-secret:1,INTERNAL_SECRET=pixelspace-internal-secret:1
```

El transporte HTTP debe ser accesible desde navegadores; `--allow-unauthenticated` se refiere a IAM de Google. La aplicación sigue exigiendo ticket firmado y sesión Discord activa para entrar al mundo. No publicar con la URL de API de relleno. La concurrencia 80 incluye HTTP y WebSockets; no es una capacidad de jugadores demostrada (sala actual 24, sin prueba de carga).

## Conectar Pages y validar

Obtener URL real de `gcloud run services describe pixelspace-world --project=pixelspace-93730 --region=europe-west1 --format=value(status.url)`. Guardarla como variable de repositorio `VITE_WORLD_URL`; `VITE_API_URL` apunta al Worker. Recompilar Pages. El cliente usa directamente HTTPS/WSS de Cloud Run, sin proxy de Firebase Hosting.

Verificar `/health`, CORS de Pages, entrada anónima rechazada, dos usuarios Discord distintos en la misma sala, movimiento, colisiones, reconexión, partida legal y resultado guardado en D1. Verificar logout y expiración de sesión. No declarar este paso completo hasta probarlo remotamente.

Cloud Run corta cada WebSocket al alcanzar el timeout (máximo actual 60 minutos); el cliente Colyseus ya incluye reconexión, que debe comprobarse contra ese cierre real. Afinidad es orientativa. Mantener una instancia y una revisión recibiendo tráfico; antes de actualizar, vaciar salas y avisar de mantenimiento. Los límites no garantizan exclusión absoluta durante despliegues/reinicios; esta primera versión no sincroniza salas entre procesos ni persiste partidas activas. No dividir tráfico entre revisiones ni ofrecer actualizaciones sin interrupción. Antes de escalar, añadir presencia/matchmaking compartidos y recuperación de partidas.

Fuentes: [Cloud Run desde Firebase y requisito de facturación](https://firebase.google.com/docs/hosting/cloud-run), [WebSockets, reconexión y costes](https://docs.cloud.google.com/run/docs/triggering/websockets), [opciones de despliegue](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy).
