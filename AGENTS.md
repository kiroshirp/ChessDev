# ChessDev

Web pública de alquiler urgente de material de ajedrez, hecha por TopChess. Sustituye por petición expresa del usuario la anterior plataforma de entrenamiento. No restaurar el producto anterior ni sus servicios.

- Responder en español y mantener el frontend estático, accesible y sin dependencias de producción. La petición de administración autoriza Firebase Authentication y Realtime Database en el nuevo proyecto independiente chessdev-topchess, sin facturación.
- Publicación: GitHub Pages en https://kiroshirp.github.io/ChessDev/ mediante .github/workflows/pages.yml.
- Contacto confirmado: TopChess, 613 133 823. SOLO MENSAJES. NO LLAMADAS. Las solicitudes se preparan en WhatsApp; el visitante debe pulsar enviar allí.
- No inventar dirección, existencias en tiempo real, atención 24 h, disponibilidad garantizada ni confirmaciones automáticas.
- Precios: 50 € de gestión por solicitud confirmada + material; sin fianza. Pérdida, no devolución o daño irreparable imputable al cliente: reposición íntegra a nuevo equivalente, con valor documentado y acordado antes de contratar. Daños reparables: coste de reparación; desgaste normal excluido. Más de 48 h requiere presupuesto específico. Impuestos a confirmar en el presupuesto definitivo.
- Nombre y apellidos y club o entidad: dos campos separados y obligatorios, también en WhatsApp.
- Estética: paneles grafito, controles marfil con relieve y esquinas redondeadas, según referencia del usuario. Aplicar también al contrato PDF.
- Catálogo, precios y unidades: Firebase Realtime Database. rental.mjs conserva los datos iniciales y las funciones de cálculo; el frontend carga el catálogo remoto y lo verifica antes de preparar una solicitud. No usar datos iniciales como disponibilidad actual si falla la conexión.
- Rutas limpias con directorios reales en Pages y navegación History API, sin #. Panel: /ChessDev/admin/.
- Usuario administrador configurado en Firebase Authentication. La contraseña solo se encuentra en .env local, excluido de Git y de dist. No imprimirlo ni incluirlo en código, logs, pruebas, documentación o respuestas.
- Proteger escrituras por UID verificado y esquema de database.rules.json. Mantener los límites documentados en SECURITY.md. Tokens solo en memoria. No confiar en controles del navegador para autorización.
- El PDF es un modelo por completar y revisar, no un contrato definitivo aprobado.
- Validar con npm run check y npm run build. Las pruebas de navegador deben comprobar móvil, cantidades, fechas y texto del enlace WhatsApp sin enviar mensajes.
- No modificar credenciales, infraestructura anterior, servicios externos ni datos de clientes. No añadir analítica, pagos ni cuentas sin solicitud.
