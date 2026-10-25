# ChessDev · Hecho por TopChess

Web de alquiler urgente de ajedrez con administración privada del inventario.

**TopChess · 613 133 823. Solo mensajes. No atendemos llamadas.**

## Desarrollo y publicación

Node.js 22 o superior. No requiere dependencias de producción.

```sh
npm run dev
npm run check
npm run build
```

Vista local: http://127.0.0.1:4173/ChessDev/. Publicación: https://kiroshirp.github.io/ChessDev/.

El build genera directorios reales para `/material/`, `/como-funciona/`, `/solicitud/` y `/admin/`, todos bajo `/ChessDev/`. Funcionan al abrir directamente o recargar. La navegación pública utiliza History API sin fragmentos. El historial del navegador conserva las rutas.

## Administración

Acceso en https://kiroshirp.github.io/ChessDev/admin/. Permite añadir, editar, publicar, ocultar y eliminar material; gestionar cantidades, alquiler, reposición a nuevo, tipo, descripción y orden. El borrado pide confirmación. No se puede eliminar el último artículo: puede ocultarse.

Las credenciales se validan con Firebase Authentication, no con una comparación de contraseña en JavaScript. La contraseña se configura mediante el `.env` local, ignorado por Git y excluido del despliegue. Tiene permisos de Windows restringidos al usuario actual y SYSTEM. El fichero público `firebase-config.mjs` identifica el servicio de Firebase; su API key es configuración pública, no una contraseña ni un permiso para editar.

Para mantener la cuenta desde un equipo autorizado, preparar `.env` a partir de `.env.example`, tener la herramienta oficial Firebase CLI instalada y la sesión del propietario iniciada, y ejecutar `node scripts/seed-admin.mjs`. Este proceso importa un hash con salt y elimina el fichero temporal. No ejecutar para cambiar la contraseña sin autorización. FIREBASE_CLI_PATH permite indicar la ruta del ejecutable JavaScript de Firebase CLI cuando no se usa la instalación estándar de Windows.

Las sesiones se guardan solo en memoria y caducan al recargar o tras una hora. No se guardan contraseñas, tokens ni datos de clientes en localStorage. La base de datos rechaza las escrituras de cualquier usuario distinto del UID administrador.

## Inventario compartido

Nuevo proyecto Firebase `chessdev-topchess`, Realtime Database en `europe-west1` y Authentication con email/contraseña. El identificador de acceso interno usa un dominio reservado `.invalid`, no un buzón de contacto. Sin Cloud Functions, servicios de pago ni cambios a los proyectos anteriores. El servicio está sujeto a las cuotas gratuitas de Firebase.

El catálogo se lee de Firebase al abrir la web y se vuelve a comprobar antes de preparar una solicitud. Un cambio de revisión exige revisar el nuevo presupuesto. Si falla la conexión no se presenta el inventario inicial como disponibilidad actual. La administración evita sobrescribir cambios concurrentes con ETag e If-Match.

Máximo: 100 artículos, con 7 identificadores iniciales y 93 posiciones adicionales. Reglas de autorización y validación: `database.rules.json`; detalles en `SECURITY.md`. La cuota disponible es manual: enviar un WhatsApp no reserva ni descuenta material automáticamente.

Para actualizar las reglas o la configuración de acceso usar la sesión autorizada de Firebase y desplegar únicamente `database,auth` al proyecto nuevo. No abrir reglas de escritura pública.

## Solicitudes y condiciones

Nombre y apellidos y club o entidad son campos separados y obligatorios. El cliente revisa y envía el resumen en WhatsApp. La web no confirma reservas ni cobra.

50 € de gestión urgente + material por unidad para hasta 48 horas. Más de 48 horas requiere presupuesto específico. Precio final e impuestos a confirmar. No se cobra fianza. Las condiciones de reposición a nuevo por pérdida, no devolución o daño irreparable imputable al cliente se acuerdan antes de contratar. Daños reparables: coste de reparación; desgaste normal excluido.

El contrato descargable es un modelo pendiente de completar con los datos fiscales, los valores de reposición y las condiciones particulares y de revisar antes de usar. El transporte es presencial y la dirección se acuerda por mensaje.

## Comprobaciones

`npm run check` comprueba sintaxis y pruebas de cálculo, inventario, esquema, límites y rutas. `npm run build` genera solo los recursos públicos y revisa que no haya credenciales, archivos privados ni navegación con #. El flujo GitHub Actions comprueba y publica automáticamente al actualizar main.

Las pruebas del servicio real se realizan con material temporal oculto y lo eliminan al finalizar. Nunca emplear material o solicitudes de clientes como datos de prueba.
