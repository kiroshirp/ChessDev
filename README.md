> Estado actual (31/10/2026): pedidos, reservas, administración y conexiones desactivados por petición del usuario. Catálogo estático informativo; Firebase deniega lecturas/escrituras y proveedores de acceso deshabilitados. Datos y credenciales conservados. No reactivar sin autorización. El resto describe la implementación anterior.

# ChessDev · Hecho por TopChess

Web de alquiler urgente de ajedrez con administración privada del inventario.

**TopChess · 613 133 823. Solo mensajes. No atendemos llamadas.**

## Desarrollo y publicación

Node.js 22 o superior. No requiere instalar dependencias. El generador PDF incluye una copia local de pdf-lib con su licencia en assets/vendor.

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

Nuevo proyecto Firebase `chessdev-topchess`, Realtime Database en `europe-west1` y Authentication con email/contraseña para administración y acceso anónimo temporal para registrar solicitudes privadas. El identificador de acceso interno usa un dominio reservado `.invalid`, no un buzón de contacto. Sin Cloud Functions, servicios de pago ni cambios a los proyectos anteriores. El servicio está sujeto a las cuotas gratuitas de Firebase.

El catálogo se lee de Firebase al abrir la web y se vuelve a comprobar antes de preparar una solicitud. Un cambio de revisión exige revisar el nuevo presupuesto. Si falla la conexión no se presenta el inventario inicial como disponibilidad actual. La administración evita sobrescribir cambios concurrentes con ETag e If-Match.

Máximo: 100 artículos, con 7 identificadores iniciales y 93 posiciones adicionales. Reglas de autorización y validación: `database.rules.json`; detalles en `SECURITY.md`. Las reservas confirmadas bloquean unidades por fechas. Las entregas vencidas y las incidencias mantienen bloqueadas las unidades afectadas hasta su devolución o reposición. Las solicitudes pendientes no bloquean material. Las operaciones privadas actualizan catálogo, reservas y disponibilidad mediante una transacción con ETag y reintentos para evitar confirmaciones simultáneas incompatibles.

Para actualizar las reglas o la configuración de acceso usar la sesión autorizada de Firebase y desplegar únicamente `database,auth` al proyecto nuevo. No abrir reglas de escritura pública.

## Solicitudes y condiciones

Nombre y apellidos, entidad organizadora y teléfono para mensajes son obligatorios. El cliente registra una solicitud privada, recibe una referencia y puede abrir su resumen en WhatsApp para enviarlo allí. La web no confirma reservas ni cobra. Administración permite revisar presupuestos, confirmar y cancelar reservas, registrar transferencias y reembolsos, entregas, devoluciones parciales e incidencias. No realiza operaciones bancarias ni firmas electrónicas.

50 € de gestión urgente + material por unidad. Duración máxima: 48 horas reales entre recogida y devolución. Las solicitudes deben recibirse con un mínimo de 10 horas de antelación a la recogida. No se aceptan plazos superiores a 48 horas ni solicitudes con menos de 10 horas de margen. El formulario solicita fecha y hora, valida en Europe/Madrid y rechaza horas ambiguas o inexistentes en los cambios de horario. IVA incluido. Solo transferencia tras confirmar y antes de entregar. Cancelación sin cargos antes de entregar; si se abonó, devolución por transferencia. Esta política queda pendiente de futuras actualizaciones. No se calculan penalizaciones automáticas por retraso. No se cobra fianza. Las condiciones de reposición a nuevo por pérdida, no devolución o daño irreparable imputable al cliente se acuerdan antes de contratar. Daños reparables: coste de reparación; desgaste normal excluido.

Cada pedido genera contrato y actas de entrega y devolución con artículos, cantidades, precios y valores de reposición concretos. Se conservan los precios y condiciones aceptados, los datos del prestador y el historial de devoluciones. Completar razón social, NIF e instrucciones de transferencia en «Datos para documentos» antes de usarlos. Las firmas se recogen en papel en el local; los marcadores del panel solo registran que se comprobaron. El contrato genérico descargable es un modelo pendiente de completar con los datos fiscales, los valores de reposición y las condiciones particulares y de revisar antes de usar. La recogida y devolución son presenciales en TopChess, Eugenio Salazar 54, 28002 Madrid. Metros cercanos: Concha Espina (línea 9) y Prosperidad (línea 4). La hora se confirma por mensaje.

## Comprobaciones

`npm run check` comprueba sintaxis y pruebas de cálculo, inventario, esquema, límites y rutas. `npm run build` genera solo los recursos públicos y revisa que no haya credenciales, archivos privados ni navegación con #. El flujo GitHub Actions comprueba y publica automáticamente al actualizar main.

Las pruebas del servicio real usan registros ficticios identificados y retiran únicamente sus propios datos al terminar, conservando el catálogo y la configuración. Nunca emplear solicitudes de clientes como datos de prueba.
