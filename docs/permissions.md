# Autorización de esta entrega

Acceso público al mundo: Discord obligatorio. La primera autorización crea el usuario. El entorno Node de desarrollo permite nombres de pruebas exclusivamente en loopback y con modo local explícito. El Worker de producción no permite ese endpoint y el mundo en `NODE_ENV=production` rechaza identidades de desarrollo.

La API resuelve identidad desde token opaco de sesión verificado con hash/expiración en base de datos. `/world/ticket` exige sesión; Colyseus verifica ticket y vuelve a confirmar sesión. Comprobación periódica revoca conexiones a más tardar en el siguiente ciclo de 30 segundos cuando la API está disponible.

Las operaciones de resultados y consulta interna de sesión necesitan un secreto entre servicios distinto del secreto de firma. El usuario no puede guardar resultados directamente desde la web. Historial `/games` solo devuelve partidas del usuario autenticado.

En el mundo, portales y mesa pública disponibles para todos los miembros autenticados. Distancia y disponibilidad de asiento se validan en servidor. Cualquier espectador ve tablero e historial público de esa mesa; no recibe identificadores de Discord, correos o tokens. Los UUID de PixelSpace y asientos no son secretos.

Roles de profesor, moderación, clubes y aulas privadas están pendientes. Las cuatro zonas de este mapa son públicas dentro del mundo; caminar a un aula no concede privilegios docentes. Antes de permitir nuevas acciones sensibles se añadirán permisos por recurso y pruebas negativas.
