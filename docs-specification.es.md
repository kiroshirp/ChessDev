# PIXELSPACE
## Plataforma de espacios virtuales multijugador
### Primer mundo oficial: PixelSpace Chess Academy

**Tipo de proyecto:** Aplicación web multijugador 2D, plataforma SaaS modular y entorno educativo de ajedrez.

**Objetivo:** Construir un producto real, funcional, escalable y extensible, no una demostración visual.

**Idioma inicial:** Español, con soporte preparado para inglés y otros idiomas.

**Plataforma:** Navegadores de escritorio, con adaptación progresiva a dispositivos móviles.

---

# 1. INSTRUCCIONES GENERALES PARA LA IA

Actúa como un equipo de desarrollo sénior compuesto por:

- Arquitecto principal de software.
- Desarrollador full-stack TypeScript.
- Ingeniero de networking y multijugador.
- Desarrollador de videojuegos 2D especializado en Phaser.
- Ingeniero de sistemas de audio y vídeo.
- Desarrollador especializado en motores de ajedrez.
- Diseñador UI/UX.
- Especialista en seguridad.
- Arquitecto de bases de datos.
- Ingeniero DevOps.
- Diseñador de experiencias educativas.
- Especialista en accesibilidad y protección de menores.

Debes desarrollar una aplicación llamada **PixelSpace**.

PixelSpace será una plataforma web donde los usuarios podrán acceder a espacios virtuales 2D con personajes pixel art, comunicarse, interactuar con objetos y participar en actividades.

El primer espacio oficial será **PixelSpace Chess Academy**, una academia y club de ajedrez virtual.

Debe combinar:

1. Un mundo virtual similar conceptualmente a Gather.
2. Una plataforma educativa de ajedrez.
3. Un club social multijugador.
4. Una aplicación para jugar y analizar partidas.
5. Herramientas de enseñanza colaborativa.
6. Integración opcional con Lichess.
7. Un motor de espacios extensible a otros sectores.

No copiar código, diseños, marcas, personajes ni recursos gráficos protegidos de Gather o Lichess.

No construir una simple landing page.

No utilizar elementos visuales que aparenten funcionar cuando todavía carecen de implementación real.

No inventar resultados de pruebas.

No intentar implementar todo de golpe.

**Trabaja por fases, entregando sistemas reales y verificables.**

---

# 2. CONCEPTO FUNDAMENTAL

PixelSpace no es una web de ajedrez.

PixelSpace es una plataforma de espacios virtuales.

Chess Academy es su primer módulo oficial.

Debe existir una separación clara entre:

## PixelSpace Core

Contiene:

- Cuentas.
- Usuarios.
- Perfiles.
- Avatares.
- Mundos.
- Mapas.
- Movimiento.
- Multijugador.
- Interacciones.
- Audio y vídeo.
- Permisos.
- Comunicación.
- Editor de espacios.
- Persistencia.
- Administración.

## PixelSpace Chess

Contiene:

- Tableros de ajedrez.
- Partidas.
- Reglas.
- Relojes.
- Torneos.
- Entrenamiento.
- Academia.
- Lecciones.
- Profesores.
- Alumnos.
- Puzzles.
- Estudios.
- Ratings internos.
- Estadísticas.
- Integración con Lichess.

Ningún componente fundamental del motor virtual debe depender del ajedrez.

La lógica del ajedrez será un módulo que utilice las capacidades generales de PixelSpace.

Esta separación es obligatoria.

---

# 3. VISIÓN DE EXPERIENCIA

Imagina que un usuario abre PixelSpace.

Aparece una página principal moderna donde puede explorar espacios disponibles.

El usuario selecciona:

**Chess Academy**

Entra a una academia virtual 2D.

Su avatar aparece en el vestíbulo.

Puede desplazarse utilizando WASD, flechas o controles táctiles.

Dentro encuentra:

- Vestíbulo.
- Cafetería.
- Sala de juego.
- Aulas.
- Biblioteca.
- Zona de entrenamiento.
- Sala de análisis.
- Salas privadas.
- Sala de torneos.
- Zona de espectadores.
- Panel de clasificaciones.
- Administración.

Otros usuarios están conectados en tiempo real.

Cada personaje tiene su nombre y estado.

Cuando el usuario se acerca a un objeto interactivo puede pulsar una tecla o botón para interactuar.

Si se acerca a una mesa de ajedrez, puede sentarse y jugar.

Si entra en un aula, puede asistir a una clase.

Si entra en una zona de entrenamiento, puede resolver puzzles.

Si entra en la cafetería, puede hablar con otros usuarios mediante audio por proximidad, si lo han habilitado.

La experiencia debe sentirse como un videojuego social y, al mismo tiempo, proporcionar herramientas educativas reales.

---

# 4. ARQUITECTURA DEL PROYECTO

Utilizar un monorepositorio.

Stack recomendado:

## Frontend

- React.
- TypeScript estricto.
- Vite.
- Tailwind CSS.
- Zustand.
- TanStack Query.
- React Router.
- Lucide Icons.

## Motor de mundos

- Phaser.
- Tilemaps.
- WebGL.
- Sistema de entidades.
- Sistema de colisiones.
- Sistema modular de interacciones.

## Backend

- Node.js.
- TypeScript.
- Fastify.
- Colyseus.
- WebSockets.
- Zod.

## Datos

- PostgreSQL.
- Drizzle ORM.
- Redis cuando resulte necesario.
- IndexedDB para preferencias y datos locales no sensibles.

## Comunicación

- WebRTC.
- LiveKit mediante una interfaz de adaptación.
- Audio por proximidad.
- Videollamadas.
- Pantalla compartida.

## Ajedrez

- chess.js para reglas y validación.
- chessground o un tablero equivalente compatible con su licencia.
- Stockfish mediante Web Workers para análisis autorizado.
- PGN.
- FEN.
- Lichess API.

Verificar siempre las versiones, documentación y licencias actuales.

No asumir que todos los componentes son compatibles sin comprobarlo.

## Estructura

Crear una organización parecida a:

```text
pixelspace/
├── apps/
│   ├── web/
│   ├── api/
│   └── world-server/
│
├── packages/
│   ├── shared/
│   ├── ui/
│   ├── database/
│   ├── auth/
│   ├── permissions/
│   │
│   ├── world-engine/
│   ├── map-engine/
│   ├── avatar-engine/
│   ├── interaction-engine/
│   ├── realtime/
│   ├── media/
│   │
│   ├── chess-core/
│   ├── chess-games/
│   ├── chess-training/
│   ├── chess-academy/
│   ├── chess-tournaments/
│   └── lichess-integration/
│
├── assets/
│   ├── maps/
│   ├── tilesets/
│   ├── avatars/
│   ├── furniture/
│   ├── chess/
│   └── audio/
│
├── infrastructure/
├── docs/
├── scripts/
└── tests/
```

Cada paquete debe tener responsabilidades claras.

No crear dependencias circulares.

---

# 5. DISEÑO E IDENTIDAD VISUAL

## Marca

Nombre general: PixelSpace.

Primer producto: PixelSpace Chess Academy.

Estilo:

- Pixel art de alta calidad.
- Inspiración en videojuegos RPG 2D.
- Interfaz oscura.
- Azul oscuro.
- Violeta.
- Acentos dorados para el ajedrez.
- Tipografía moderna.
- Iconos consistentes.
- Tarjetas elegantes.
- Animaciones discretas.

## Identidad de Chess Academy

El primer mundo debe parecer una academia de ajedrez acogedora y prestigiosa.

Diseñar:

- Suelos de madera.
- Paredes decoradas.
- Banderas.
- Estanterías.
- Trofeos.
- Mesas.
- Tableros.
- Relojes.
- Pizarras.
- Ventanas.
- Plantas.
- Salas de diferentes tamaños.

Los gráficos deben mantener:

- Escala consistente.
- Perspectiva superior 2D coherente.
- Animaciones compatibles.
- Paleta visual unificada.
- Colisiones lógicas.
- Buen rendimiento.

Utilizar recursos propios o con licencias apropiadas.

Mantener un registro de procedencia y atribución de assets.

---

# 6. PÁGINA PRINCIPAL DE PIXELSPACE

La página inicial debe presentar PixelSpace como una plataforma de espacios virtuales.

Elementos:

- Hero principal.
- Explicación del concepto.
- Vista previa del mundo.
- Botón para explorar espacios.
- Botón para crear cuenta.
- Sección de características.
- Espacios destacados.
- Preguntas frecuentes.
- Políticas y enlaces legales.

## Explorador de espacios

Crear una página con tarjetas.

Primera tarjeta oficial:

**Chess Academy**

Con:

- Imagen.
- Descripción.
- Usuarios conectados.
- Actividades disponibles.
- Botón Entrar.
- Etiqueta Espacio oficial.

Los demás espacios no deben anunciarse como disponibles hasta existir.

Preparar categorías futuras como:

- Educación.
- Trabajo.
- Comunidades.
- Juegos.
- Social.

---

# 7. CUENTAS Y PERFILES

Implementar:

- Registro.
- Inicio de sesión.
- Recuperación de contraseña.
- Verificación de correo.
- Cierre de sesión.
- Perfil.
- Avatar.
- Configuración.
- Idioma.
- Estado personal.
- Gestión de sesiones.
- Borrado de cuenta.
- Exportación de datos.

Cada usuario tendrá un perfil de PixelSpace independiente de Lichess.

## Perfil general

Campos:

- ID.
- Nombre visible.
- Nombre de usuario.
- Avatar.
- Biografía.
- Idioma.
- Fecha de registro.
- Estado.
- Preferencias.
- Privacidad.

## Perfil de ajedrez

Campos específicos:

- Nivel autodeclarado.
- Rating interno por modalidad, cuando corresponda.
- Estadísticas.
- Partidas.
- Cursos.
- Actividades.
- Logros internos.
- Clubes.
- Profesor asignado, si procede.
- Cuenta Lichess vinculada opcionalmente.

No mostrar títulos oficiales de ajedrez sin verificación.

Distinguir siempre entre ratings internos, ratings de Lichess y títulos federativos.

---

# 8. MOTOR MULTIJUGADOR

Desarrollar un motor real.

## Funciones

- Entrada a un espacio.
- Aparición de avatares.
- Movimiento.
- Colisiones.
- Animaciones.
- Sincronización.
- Entrada y salida de usuarios.
- Indicadores de conexión.
- Reconexión.
- Gestión de sesiones.
- Control de capacidad.

## Movimiento

Permitir:

- WASD.
- Flechas.
- Controles táctiles cuando estén soportados.

Velocidad consistente y validada.

El servidor debe ser autoritativo.

Los clientes no podrán modificar libremente posiciones de otros usuarios.

Implementar interpolación de jugadores remotos y reconciliación cuando sea necesario.

## Cámara

- Seguimiento de avatar.
- Zoom.
- Límites.
- Adaptación a pantalla.
- Vista del mapa.

## Presencia

Mostrar:

- Nombre.
- Avatar.
- Estado.
- Disponibilidad.
- Indicador de conversación.

Evitar enviar información privada a usuarios sin autorización.

---

# 9. SISTEMA UNIVERSAL DE ESPACIOS

Crear modelos genéricos:

```ts
type SpaceType =
  | "chess_academy"
  | "office"
  | "campus"
  | "social"
  | "community"
  | "custom";
```

Cada espacio tendrá:

- Propietario.
- Nombre.
- Descripción.
- Tipo.
- Mapa.
- Zonas.
- Objetos.
- Capacidad.
- Permisos.
- Configuración.
- Módulos activados.
- Reglas de acceso.

Los espacios deben poder contener múltiples zonas y, en el futuro, varias instancias.

Ejemplo:

```ts
interface SpaceDefinition {
  id: string;
  type: SpaceType;
  name: string;
  mapId: string;
  capacity: number;
  enabledModules: string[];
  accessPolicyId: string;
}
```

Los módulos disponibles determinarán las funcionalidades.

Ejemplo:

```ts
enabledModules: [
  "spatial-audio",
  "chess",
  "classrooms",
  "tournaments",
  "puzzles"
]
```

No introducir lógica de ajedrez directamente en el motor de mapas.

---

# 10. MAPA INICIAL: CHESS ACADEMY

Crear un mapa completo pero manejable.

No construir una ciudad gigantesca inicialmente.

La Academia tendrá las siguientes zonas.

## 10.1 Vestíbulo

Punto inicial del jugador.

Elementos:

- Bienvenida.
- Indicaciones.
- Usuarios conectados.
- Calendario de actividades.
- Próximos torneos.
- Panel de anuncios.
- Acceso a distintas salas.

## 10.2 Cafetería

Zona social.

Funciones:

- Audio por proximidad.
- Conversaciones.
- Estados.
- Búsqueda de compañeros.
- Invitaciones a partidas.
- Mesas decorativas.
- Reacciones.

## 10.3 Sala de juego

Varias mesas de ajedrez interactivas.

Cada mesa tendrá estados:

- Libre.
- Esperando rival.
- Partida en curso.
- Finalizada.
- Reservada.
- Fuera de servicio.

## 10.4 Aulas

Espacios donde los profesores impartirán clases.

Elementos:

- Tablero compartido.
- Profesor.
- Alumnos.
- Pizarra.
- Participantes.
- Audio y vídeo.
- Chat.
- Ejercicios.
- Material.

## 10.5 Biblioteca

Zona educativa.

Contiene:

- Cursos.
- Aperturas.
- Táctica.
- Finales.
- Estrategia.
- Estudios.
- Partidas históricas.
- Roadmaps.

## 10.6 Zona de entrenamiento

Funciones:

- Puzzles.
- Problemas temáticos.
- Ejercicios personalizados.
- Retos diarios.
- Pruebas de nivel.

## 10.7 Sala de análisis

Funciones:

- Importar PGN.
- Editar posiciones FEN.
- Reproducir partidas.
- Dibujar flechas.
- Resaltar casillas.
- Crear variantes.
- Comentar.
- Utilizar Stockfish en modos permitidos.

## 10.8 Sala de torneos

Funciones:

- Inscripciones.
- Emparejamientos.
- Rondas.
- Resultados.
- Clasificaciones.
- Tableros de espectadores.
- Historial.

## 10.9 Salas privadas

Para:

- Clases individuales.
- Tutorías.
- Reuniones de profesores.
- Estudio privado.
- Grupos reducidos.

## 10.10 Administración

Espacio disponible solo para personas autorizadas.

No utilizar la ubicación del avatar como único mecanismo de seguridad.

---

# 11. OBJETOS INTERACTIVOS

Crear un sistema de objetos reutilizable.

Tipos iniciales:

```ts
type InteractionType =
  | "sit"
  | "open_panel"
  | "join_activity"
  | "join_room"
  | "open_link"
  | "start_chess_game"
  | "join_chess_game"
  | "spectate_game"
  | "open_lesson"
  | "open_puzzle"
  | "open_analysis"
  | "use_portal";
```

Cada objeto tendrá:

- ID.
- Tipo.
- Posición.
- Estado.
- Configuración.
- Permisos.
- Capacidad.
- Interacciones disponibles.

## Reglas

La interacción solo debe permitirse cuando:

1. El usuario esté autorizado.
2. El objeto esté disponible.
3. La distancia sea válida, cuando proceda.
4. El estado permita la acción.
5. El servidor acepte la solicitud.

Las interacciones deben funcionar mediante teclado, ratón o controles accesibles.

No ejecutar scripts arbitrarios introducidos por usuarios.

---

# 12. SISTEMA DE AUDIO Y VÍDEO

## Audio por proximidad

El usuario podrá hablar con personas cercanas cuando habilite el micrófono.

Reglas:

- Micrófono apagado por defecto.
- Permiso explícito.
- Volumen ajustado por distancia.
- Indicador de hablante.
- Control de usuarios silenciados.
- Bloqueo de usuarios.
- Selección de dispositivos.
- Gestión de desconexiones.

## Salas privadas

Una sala privada tendrá aislamiento audiovisual.

Los usuarios externos no podrán escuchar su contenido.

## Clases

El profesor podrá:

- Hablar.
- Compartir cámara.
- Compartir pantalla.
- Silenciar su propio audio.
- Gestionar turnos de palabra.
- Autorizar intervenciones cuando el formato lo requiera.

Los alumnos podrán:

- Escuchar.
- Levantar la mano.
- Hablar según permisos.
- Participar en chat.
- Ver el tablero.
- Responder ejercicios.

Los controles de clase no deben conceder acceso no autorizado a dispositivos ajenos.

El usuario siempre debe controlar sus propios permisos de cámara y micrófono.

---

# 13. MOTOR DE AJEDREZ

Implementar un módulo independiente llamado chess-core.

Utilizar chess.js o biblioteca equivalente compatible.

El servidor debe validar las jugadas.

El frontend no debe ser la única autoridad.

## Reglas oficiales del ajedrez estándar

Implementar:

- Posición inicial.
- Movimiento legal de piezas.
- Turnos alternos.
- Capturas.
- Jaque.
- Jaque mate.
- Ahogado.
- Enroque corto.
- Enroque largo.
- En passant.
- Promoción de peones.
- Repetición de posiciones.
- Regla de las cincuenta jugadas.
- Regla de las setenta y cinco jugadas.
- Regla de las cinco repeticiones.
- Material insuficiente o posición muerta, según las reglas implementadas.
- Acuerdos de tablas.
- Rendición.
- Pérdida por tiempo.
- Abandono o desconexión según política.
- Resultado final.

## Reglas de tablas

Distinguir cuidadosamente:

- Tablas automáticas.
- Tablas que requieren reclamación.
- Tablas por acuerdo.

Para partidas estándar, respetar las reglas FIDE actuales aplicables o documentar claramente las diferencias de las modalidades online.

Las tablas por triple repetición y la regla de cincuenta jugadas requieren tratamiento distinto a las condiciones automáticas de cinco repeticiones y setenta y cinco jugadas.

## Relojes

Soportar:

- Tiempo inicial.
- Incremento por movimiento.
- Pausa solo donde esté autorizada.
- Sincronización.
- Compensación de latencia definida.
- Finalización por tiempo.

El servidor será la autoridad del reloj.

No confiar en el reloj del cliente.

## Formatos

Permitir:

- Importar PGN.
- Exportar PGN.
- Importar FEN.
- Exportar FEN.
- Notación algebraica.
- Historial de movimientos.

## Integridad

No permitir:

- Jugadas ilegales.
- Jugar fuera de turno.
- Duplicar movimientos.
- Alterar movimientos anteriores.
- Manipular el reloj.
- Enviar movimientos en partidas finalizadas.

---

# 14. PARTIDAS DE AJEDREZ EN PIXELSPACE

Al interactuar con una mesa:

El usuario podrá:

1. Crear partida.
2. Elegir modalidad.
3. Elegir ritmo.
4. Invitar rival.
5. Unirse como espectador.
6. Consultar reglas.
7. Abandonar la mesa.

## Modalidades iniciales

- Amistosa.
- Entrenamiento.
- Partida con reloj.

Más adelante:
- Clasificatoria interna.
- Torneo.
- Partida por equipos.
- Simultáneas.

## Máquina de estados

```ts
type GameStatus =
  | "waiting"
  | "ready"
  | "active"
  | "finished"
  | "aborted";
```

Definir transiciones explícitas.

No permitir saltos de estado no autorizados.

## Creación de partida

El anfitrión selecciona:

- Color.
- Tiempo.
- Incremento.
- Pública o privada.
- Permisos de espectadores.

El rival acepta.

La partida no debe comenzar antes de que ambas partes estén confirmadas.

## Durante la partida

Mostrar:

- Tablero.
- Piezas.
- Jugadores.
- Relojes.
- Turno.
- Último movimiento.
- Movimientos legales cuando sea apropiado.
- Historial.
- Botón rendirse.
- Ofrecer tablas.
- Solicitar revancha al terminar.

## Al terminar

Mostrar:

- Resultado.
- Motivo.
- Duración.
- Movimientos.
- Exportar PGN.
- Guardar partida.
- Revancha.
- Analizar partida terminada.

---

# 15. POLÍTICA ANTI-TRAMPAS

Este sistema es obligatorio.

Separar estrictamente:

## Modo competitivo

Prohibir asistencia externa no autorizada.

No permitir:

- Stockfish.
- Sugerencias de movimientos.
- Evaluaciones.
- Recomendaciones automáticas.
- Acceso a funciones educativas que proporcionen ventaja durante la partida.
- Asistencia de entrenadores o espectadores.

No enviar evaluaciones o mejores jugadas al cliente que está compitiendo.

Restringir los paneles que puedan facilitar trampas.

## Modo entrenamiento

Permitir:

- Deshacer movimientos.
- Consultar variantes.
- Pedir explicaciones.
- Cambiar posiciones.
- Recibir sugerencias.
- Utilizar Stockfish.
- Colaborar con profesores.

Mostrar claramente cuándo una sesión es de entrenamiento y no competitiva.

## Partidas vinculadas a Lichess

Aplicar las reglas oficiales de juego limpio de Lichess.

No diseñar mecanismos para automatizar su interfaz web ni sortear sus restricciones.

Utilizar únicamente APIs autorizadas.

No habilitar análisis, consejos o motor durante partidas competitivas en curso.

---

# 16. INTEGRACIÓN CON LICHESS

Crear un módulo independiente.

La integración debe ser opcional.

PixelSpace funcionará aunque Lichess esté desconectado.

## Autorización

Utilizar OAuth2 Authorization Code con PKCE.

Implementar:

- Conectar cuenta.
- Consultar permisos.
- Desconectar.
- Revocar cuando proceda.
- Gestionar errores.
- Almacenamiento seguro de tokens.
- Protección contra CSRF y errores OAuth.

Solicitar únicamente los scopes necesarios para cada funcionalidad.

No pedir permisos de juego durante una simple consulta de estadísticas.

## Primera integración

Permitir:

- Vincular perfil.
- Mostrar usuario Lichess.
- Consultar ratings disponibles.
- Mostrar estadísticas autorizadas.
- Importar partidas.
- Importar PGN.
- Mostrar estudios accesibles.

## Segunda integración

- Crear desafíos compatibles.
- Aceptar desafíos cuando esté autorizado.
- Consultar estado.
- Abrir partida en Lichess.
- Sincronizar resultados cuando la API lo permita.

## Integración avanzada

Investigar la Board API oficial.

Implementar únicamente los ritmos y modalidades permitidos.

Usar sus endpoints de juego en lugar de automatizar la interfaz web de Lichess.

## Restricciones

- Consultar documentación oficial actual.
- Respetar límites de peticiones.
- Centralizar cola y control de solicitudes.
- Aplicar backoff.
- Gestionar HTTP 429.
- Evitar scraping.
- No almacenar credenciales de Lichess.
- No copiar partidas privadas sin autorización.
- No asumir que todos los endpoints están disponibles para todas las cuentas.
- No prometer partidas de cualquier modalidad desde la Board API.

## Modo alternativo

Si una integración no está soportada:

- Mostrar enlace oficial a Lichess.
- Permitir importar resultados autorizados.
- Mantener la experiencia social de PixelSpace.

No simular como nativa una función que dependa de capacidades inexistentes.

---

# 17. AULAS DE AJEDREZ INTERACTIVAS

Una de las funcionalidades principales de PixelSpace Chess Academy.

## Crear clase

Un profesor autorizado podrá configurar:

- Título.
- Descripción.
- Fecha.
- Duración.
- Capacidad.
- Nivel recomendado.
- Acceso público o privado.
- Material.
- Tablero inicial.
- Permisos de participación.

## Estados

```ts
type LessonStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled";
```

## Dentro del aula

El profesor podrá:

- Controlar el tablero principal.
- Mover piezas.
- Retroceder jugadas.
- Cambiar posiciones.
- Crear variantes.
- Dibujar flechas.
- Marcar casillas.
- Importar PGN.
- Importar FEN.
- Compartir pantalla.
- Publicar preguntas.
- Lanzar ejercicios.
- Ceder control del tablero a un alumno.
- Recuperar control.
- Guardar el estudio.

## Alumno

Podrá:

- Ver la posición sincronizada.
- Seguir los movimientos del profesor.
- Consultar material permitido.
- Levantar la mano.
- Responder preguntas.
- Realizar ejercicios.
- Tomar notas personales.
- Consultar su progreso.

## Sincronización

Mantener un estado autoritativo del tablero educativo.

Distinguir:

- Tablero del profesor.
- Tablero compartido.
- Tablero privado del alumno.
- Ejercicio individual.

Los movimientos privados de un alumno no deben modificar accidentalmente el tablero común.

---

# 18. SISTEMA DE PROFESORES

Crear un rol de profesor dentro de una academia o club.

No equiparar automáticamente este rol con un título oficial FIDE.

## Funciones

- Crear clases.
- Gestionar alumnos asignados.
- Crear ejercicios.
- Crear cursos.
- Revisar tareas.
- Programar sesiones.
- Evaluar progresos.
- Compartir estudios.
- Crear itinerarios.
- Supervisar grupos.

## Perfil público

Mostrar:

- Nombre.
- Descripción.
- Especialidades.
- Idiomas.
- Disponibilidad.
- Experiencia declarada.
- Titulaciones verificadas cuando proceda.

No mostrar certificaciones inexistentes.

---

# 19. SISTEMA DE ALUMNOS

Cada alumno tendrá un panel educativo.

Funciones:

- Cursos inscritos.
- Próximas clases.
- Profesores.
- Tareas.
- Progreso.
- Historial.
- Puzzles completados.
- Roadmaps.
- Objetivos.
- Estadísticas de aprendizaje.

Permitir diferenciar el progreso educativo del rendimiento competitivo.

No asumir que un rating alto significa que un alumno ha completado un curso.

---

# 20. ROADMAPS EDUCATIVOS

Integrar dentro de PixelSpace un sistema de rutas de aprendizaje.

Este sistema debe ser reutilizable para futuros módulos educativos ajenos al ajedrez.

## Ejemplo inicial

### Nivel 1 — Fundamentos
- Tablero.
- Piezas.
- Movimientos.
- Capturas.
- Jaque.
- Mate.
- Enroque.
- Reglas especiales.

### Nivel 2 — Principios
- Desarrollo.
- Centro.
- Seguridad del rey.
- Coordinación.
- Aperturas básicas.

### Nivel 3 — Táctica
- Ataque doble.
- Clavada.
- Rayos X.
- Ataque descubierto.
- Desviación.
- Atracción.
- Mates básicos.

### Nivel 4 — Finales
- Rey y peón.
- Oposición.
- Casillas clave.
- Finales de torres.
- Finales de piezas menores.

### Nivel 5 — Estrategia
- Estructura de peones.
- Casillas débiles.
- Columnas abiertas.
- Planificación.
- Cambios.
- Actividad de piezas.

### Nivel 6 — Aperturas
- Principios.
- Repertorios.
- Estructuras.
- Planes típicos.

## Funcionalidades

Cada roadmap tendrá:

- Etapas.
- Objetivos.
- Lecciones.
- Ejercicios.
- Dependencias.
- Estados.
- Progreso.
- Evaluación.
- Recursos.

El usuario podrá visualizarlo como:

- Camino visual.
- Árbol de aprendizaje.
- Lista de módulos.

El progreso podrá calcularse mediante actividades completadas y criterios definidos por el profesor.

---

# 21. PUZZLES Y ENTRENAMIENTO

Crear un sistema de ejercicios.

## Tipos

- Mate en uno.
- Mate en dos.
- Mate en tres.
- Táctica.
- Finales.
- Aperturas.
- Encontrar la mejor jugada.
- Detectar errores.
- Secuencias completas.

## Modelo de ejercicio

```ts
interface ChessPuzzle {
  id: string;
  initialFen: string;
  solutionMoves: string[];
  themes: string[];
  difficulty: number;
  source?: string;
}
```

Los movimientos correctos deben validarse.

No comparar solamente cadenas visuales.

## Funciones

- Pista opcional.
- Comprobar solución.
- Reintentar.
- Mostrar explicación.
- Guardar progreso.
- Estadísticas.
- Dificultad adaptativa.
- Retos diarios.

Si se utilizan puzzles de Lichess, respetar sus fuentes, atribuciones y condiciones de licencia.

---

# 22. SALA DE ANÁLISIS

Crear un analizador de partidas independiente.

## Funciones

- Tablero interactivo.
- Importar PGN.
- Importar FEN.
- Navegar por movimientos.
- Crear variantes.
- Deshacer.
- Dibujar flechas.
- Marcar casillas.
- Añadir comentarios.
- Exportar.
- Compartir estudios.
- Guardar análisis.

## Stockfish

Implementar mediante Web Worker cuando resulte viable.

Permitir:

- Evaluación.
- Variantes.
- Profundidad configurable.
- Análisis de posiciones.
- Revisión de partidas terminadas.

Nunca ejecutar el motor en un contexto competitivo no autorizado.

No conectar un motor de análisis a una partida activa de Lichess.

---

# 23. TORNEOS

Crear una infraestructura de torneos interna.

## Tipos previstos

- Eliminación directa.
- Todos contra todos.
- Sistema suizo.
- Arena, en una etapa posterior.

No implementar todos los formatos desde el MVP.

Empezar con un formato sencillo y verificable.

## Funciones

- Crear torneo.
- Configurar fecha.
- Elegir modalidad.
- Establecer capacidad.
- Inscripciones.
- Lista de participantes.
- Emparejamientos.
- Rondas.
- Resultados.
- Clasificación.
- Desempates.
- Historial.

## Reglas

Definir y publicar antes del torneo:

- Ritmo.
- Sistema.
- Política de ausencias.
- Política de desconexiones.
- Emparejamientos.
- Desempates.
- Condiciones de victoria.
- Conducta.
- Juego limpio.
- Procedimiento de reclamaciones.

Los resultados no deben poder modificarse libremente desde el cliente.

Registrar cambios administrativos relevantes.

---

# 24. CLUBES Y ACADEMIAS PRIVADAS

Preparar el sistema para que más adelante otros usuarios puedan crear sus propios clubes.

Cada club tendrá:

- Nombre.
- Descripción.
- Logotipo.
- Propietario.
- Miembros.
- Profesores.
- Alumnos.
- Aulas.
- Calendario.
- Actividades.
- Torneos.
- Rankings.
- Roles.
- Permisos.

## Roles

- Propietario.
- Administrador.
- Profesor.
- Moderador.
- Alumno.
- Miembro.
- Invitado.

Una misma persona puede tener varios roles cuando corresponda.

Los permisos serán explícitos.

No confiar en el rol indicado por el frontend.

El backend debe comprobar cada operación sensible.

---

# 25. RANKINGS Y PROGRESO

Crear diferentes tipos de clasificaciones:

- Rating interno por modalidad.
- Actividad del club.
- Puzzles.
- Torneos.
- Progreso educativo.

No combinar métricas incompatibles en una sola puntuación.

## Rating interno

Si se implementa rating competitivo, utilizar un sistema formal como Glicko-2 o Elo con reglas documentadas.

No copiar el rating de Lichess como si fuera el rating interno.

Mostrar fuente, modalidad y fecha de actualización.

## Progreso

Permitir:

- Objetivos semanales.
- Clases completadas.
- Ejercicios resueltos.
- Cursos terminados.
- Historial de aprendizaje.

Evitar diseñar incentivos que animen a jugar compulsivamente.

---

# 26. CALENDARIO

Crear un calendario del club.

Eventos:

- Clases.
- Torneos.
- Entrenamientos.
- Reuniones.
- Eventos sociales.

Funcionalidades:

- Inscripción.
- Cancelación.
- Control de capacidad.
- Recordatorios.
- Zona horaria.
- Estado.
- Historial.

Las fechas se almacenarán con criterios consistentes de zona horaria.

No enviar notificaciones sin consentimiento.

---

# 27. CHAT Y COMUNIDAD

Implementar:

- Chat del espacio.
- Mensajes directos según permisos.
- Chat de aula.
- Chat de club.
- Anuncios.
- Bloqueos.
- Denuncias.
- Moderación.
- Historial.

No permitir que alumnos menores contacten libremente con cualquier usuario adulto por defecto.

Crear controles de comunicación específicos para entornos educativos.

No mostrar datos privados en listados públicos.

---

# 28. PROTECCIÓN DE MENORES

La academia puede atraer a menores.

Por ello, incorporar desde el diseño:

- Configuración de edad apropiada.
- Minimización de datos.
- Perfiles privados por defecto para menores.
- Limitación de mensajes.
- Moderación.
- Bloqueos.
- Denuncias.
- Controles de invitación.
- Supervisión y registro administrativo proporcionados.
- Protección contra acoso.
- Reglas de comunicación profesor-alumno.
- Gestión de consentimiento cuando legalmente corresponda.

No permitir grabaciones ocultas.

No exponer ubicaciones físicas.

No hacer visibles automáticamente datos de contacto personales.

Definir la edad mínima y los requisitos legales según los países de lanzamiento antes de permitir registros de menores.

---

# 29. NORMAS DE LA COMUNIDAD

Crear una normativa accesible desde el espacio.

## Normas generales

1. Respetar a otros usuarios.
2. No acosar.
3. No discriminar.
4. No suplantar identidades.
5. No compartir datos personales ajenos.
6. No publicar contenido malicioso.
7. No hacer spam.
8. No abusar del chat o la voz.
9. Respetar las decisiones de moderación, con mecanismos de revisión.
10. Cumplir las reglas de cada actividad.

## Normas de juego limpio

1. No utilizar motores durante partidas competitivas.
2. No recibir ayuda externa prohibida.
3. No manipular resultados.
4. No falsificar identidades.
5. No utilizar cuentas para alterar rankings.
6. No acordar resultados fraudulentos.
7. No utilizar automatizaciones no autorizadas.

## Normas de las aulas

1. Respetar al profesor.
2. Respetar a los alumnos.
3. No interrumpir deliberadamente.
4. No compartir materiales privados.
5. No utilizar herramientas de grabación sin autorización.
6. Respetar las reglas de participación.

Crear un sistema gradual de advertencias, restricciones y sanciones con posibilidad de revisión.

---

# 30. SISTEMA DE AVATARES

Crear personajes pixel art personalizables.

## Opciones iniciales

- Cabello.
- Color de cabello.
- Tono de piel.
- Ropa.
- Accesorios.
- Animaciones.

## Animaciones

- Quieto.
- Caminar.
- Sentarse.
- Saludar.
- Levantar la mano.
- Celebrar.
- Pensar.

Los avatares deben mantener proporciones consistentes.

## Sistema futuro

Preparar soporte para:

- Nuevas prendas.
- Accesorios.
- Animaciones.
- Contenido cosmético.

No implementar todavía una economía virtual.

---

# 31. EDITOR DE ESPACIOS

Crear un editor de mapas separado del motor de ejecución.

Funciones:

- Seleccionar objeto.
- Mover.
- Rotar.
- Duplicar.
- Eliminar.
- Añadir decoración.
- Modificar colisiones.
- Crear zonas.
- Colocar mesas.
- Configurar aulas.
- Definir puntos de aparición.
- Guardar.
- Deshacer.
- Rehacer.

La primera versión pública puede limitar el editor a administradores.

El sistema debe utilizar datos de mapa versionados.

No almacenar mapas únicamente como imágenes.

---

# 32. ADMINISTRACIÓN

Crear paneles diferenciados.

## Administración general

- Usuarios.
- Espacios.
- Moderación.
- Incidencias.
- Configuración.
- Estado del sistema.

## Administración de club

- Miembros.
- Profesores.
- Alumnos.
- Invitaciones.
- Aulas.
- Clases.
- Torneos.
- Normas.
- Anuncios.

## Profesor

- Cursos.
- Alumnos asignados.
- Ejercicios.
- Material.
- Progreso.
- Calendario.

Todos los paneles deben tener permisos reales de backend.

---

# 33. ESQUEMA DE BASE DE DATOS

Diseñar un esquema relacional.

## Núcleo

```text
users
user_profiles
user_sessions
avatars
avatar_appearances

spaces
space_members
space_maps
space_map_versions
space_zones
space_instances
world_objects

organizations
organization_members
invitations

conversations
conversation_members
messages

moderation_reports
moderation_actions
audit_events
```

## Ajedrez

```text
chess_profiles
chess_tables
chess_games
chess_game_players
chess_moves
chess_results
chess_ratings

chess_puzzles
puzzle_attempts

chess_studies
study_chapters

chess_tournaments
tournament_registrations
tournament_rounds
tournament_pairings
```

## Educación

```text
academies
academy_members
courses
course_modules
lessons
lesson_enrollments
class_sessions
class_participants

assignments
assignment_submissions
learning_roadmaps
roadmap_nodes
roadmap_progress
```

## Integraciones

```text
external_accounts
oauth_connections
external_sync_jobs
```

Definir:

- Claves externas.
- Índices.
- Restricciones.
- Eliminación.
- Privacidad.
- Retención.
- Migraciones.
- Auditoría.

No guardar tokens en texto plano.

---

# 34. ESTADOS Y EVENTOS MULTIJUGADOR

Diseñar contratos tipados.

Eventos del mundo:

```text
world:join
world:leave
world:move
world:interact
world:state
world:error
```

Eventos de ajedrez:

```text
chess:join-table
chess:leave-table
chess:challenge
chess:accept
chess:move
chess:resign
chess:offer-draw
chess:finish
```

Eventos de clase:

```text
lesson:join
lesson:leave
lesson:board-update
lesson:raise-hand
lesson:grant-control
lesson:submit-answer
```

Los nombres son contratos orientativos.

Diseñar su estructura y validación.

Cada mensaje debe incluir únicamente los datos necesarios.

Comprobar identidad, sala, permisos y estado antes de procesarlo.

Evitar condiciones de carrera, duplicados y eventos fuera de orden.

---

# 35. SEGURIDAD

Aplicar:

- HTTPS.
- WSS.
- Autenticación segura.
- Tokens de corta duración cuando corresponda.
- Autorización en servidor.
- Validación de entradas.
- Rate limiting.
- Protección XSS.
- Protección CSRF.
- Control de origen.
- Protección contra inyección.
- Gestión de secretos.
- Logs.
- Gestión de errores.
- Backups.
- Política de retención.

Especialmente importantes:

- Impedir jugadas ajenas.
- Impedir entrar a aulas privadas.
- Impedir acceder a mensajes privados.
- Impedir suplantar profesores.
- Impedir manipular resultados.
- Impedir obtener tokens multimedia de salas no autorizadas.
- Impedir modificar mapas sin permisos.

---

# 36. RENDIMIENTO

Optimizar:

- Renderizado 2D.
- Uso de memoria.
- Carga de assets.
- Compresión.
- Interpolación.
- Tráfico de red.
- Suscripciones multimedia.
- Usuarios visibles.
- Actualizaciones.
- Reconexiones.

Usar mecanismos de interés espacial cuando la cantidad de usuarios lo requiera.

No enviar continuamente datos de jugadores que no sean relevantes para el cliente.

Separar presencia efímera y datos persistentes.

Realizar pruebas de carga antes de anunciar capacidades máximas.

---

# 37. ACCESIBILIDAD

PixelSpace debe ofrecer alternativas a la navegación exclusivamente mediante avatar.

Implementar:

- Navegación mediante menús.
- Acceso directo a aulas.
- Acceso directo a torneos.
- Subtítulos cuando sea viable.
- Controles de volumen.
- Navegación por teclado.
- Indicadores visuales.
- Contraste suficiente.
- Opciones de reducción de movimiento.
- Tablero de ajedrez accesible.
- Mensajes de error comprensibles.

Un usuario debe poder entrar a una clase sin recorrer obligatoriamente todo el mapa.

---

# 38. VERSIÓN PARA MÓVILES

Diseñar primero para escritorio.

Posteriormente adaptar:

- Movimiento táctil.
- Interacciones.
- Tablero.
- Chat.
- Clases.
- Audio.
- Videollamadas.

El móvil debe tener una interfaz optimizada.

No reducir simplemente el diseño de escritorio.

Comprobar limitaciones reales de navegadores móviles, especialmente permisos multimedia y ejecución en segundo plano.

---

# 39. INTERNACIONALIZACIÓN

Preparar soporte multilingüe desde el inicio.

Idiomas iniciales:

- Español.
- Inglés.

No incrustar cadenas de interfaz directamente en componentes cuando deban traducirse.

Preparar:

- Diccionarios.
- Fechas.
- Formatos.
- Notificaciones.
- Contenidos educativos traducibles.

---

# 40. INFRAESTRUCTURA

Diseñar un entorno local reproducible.

Crear:

- Docker Compose.
- PostgreSQL.
- API.
- Servidor multijugador.
- Frontend.
- Servicio audiovisual configurado para desarrollo.
- Herramientas de migración.

Para producción, documentar:

- Hosting estático.
- Servidor Node.js.
- Persistencia.
- Redis si se requiere.
- SFU multimedia.
- Almacenamiento.
- Tráfico.
- Monitorización.
- Backups.

No afirmar que todo será gratuito de forma indefinida.

Priorizar coste bajo sin comprometer seguridad.

---

# 41. TESTING

Crear pruebas unitarias, de integración y E2E.

## Pruebas del motor

- Movimiento.
- Colisiones.
- Reconexión.
- Sincronización.
- Permisos.
- Interacciones.

## Pruebas de ajedrez

Verificar:

- Movimientos legales.
- Movimientos ilegales.
- Enroque.
- En passant.
- Promoción.
- Jaque.
- Mate.
- Ahogado.
- Repeticiones.
- Tablas.
- Relojes.
- Rendición.
- Finalización.

## Pruebas multijugador

- Dos jugadores en una mesa.
- Movimiento simultáneo.
- Desconexión.
- Reconexión.
- Movimiento duplicado.
- Movimiento fuera de turno.
- Intento de alterar partidas ajenas.
- Intento de acceder a salas privadas.

## Pruebas de academia

- Crear clase.
- Inscribirse.
- Acceder.
- Profesor controla tablero.
- Alumno solicita control.
- Finalizar clase.
- Guardar progreso.

## Pruebas de Lichess

- OAuth.
- Permisos.
- Revocación.
- Expiración.
- 429.
- Caída del servicio.
- Datos incompletos.
- Reconexión.

---

# 42. ROADMAP DE DESARROLLO

No avanzar automáticamente a fases futuras sin completar sus criterios de aceptación.

## Fase 0 — Arquitectura

- Monorepositorio.
- Dependencias.
- TypeScript.
- Base de datos.
- Docker.
- Scripts.
- CI.
- Documentación.

## Fase 1 — Motor PixelSpace

- Phaser.
- Mapa.
- Avatar.
- Movimiento.
- Colisiones.
- Cámara.
- Animaciones.

## Fase 2 — Multijugador

- Colyseus.
- Conexiones.
- Sincronización.
- Presencia.
- Reconexión.

## Fase 3 — Plataforma

- Cuentas.
- Perfiles.
- Organizaciones.
- Espacios.
- Permisos.
- Invitaciones.

## Fase 4 — Academia visual

- Mapa de ajedrez.
- Vestíbulo.
- Aulas.
- Mesas.
- Zonas.
- Objetos interactivos.

## Fase 5 — Ajedrez jugable

- Tableros.
- Reglas.
- Partidas.
- Relojes.
- Jugadas.
- Resultados.
- Historial.

## Fase 6 — Audio y vídeo

- Voz espacial.
- Micrófono.
- Cámara.
- Pantalla compartida.
- Salas privadas.

## Fase 7 — Clases

- Profesores.
- Alumnos.
- Aulas.
- Tablero sincronizado.
- Ejercicios.
- Programación de clases.

## Fase 8 — Lichess

- OAuth.
- Perfil.
- Ratings.
- Partidas.
- Estudios.
- Desafíos compatibles.

## Fase 9 — Entrenamiento

- Roadmaps.
- Cursos.
- Puzzles.
- Análisis.
- Stockfish.
- Progreso.

## Fase 10 — Comunidad

- Clubes.
- Chat.
- Administración.
- Torneos.
- Rankings.

## Fase 11 — Personalización

- Editor de mapas.
- Decoración.
- Catálogo.
- Avatares avanzados.

## Fase 12 — Producción

- Seguridad.
- Rendimiento.
- Escalado.
- Accesibilidad.
- Pruebas.
- Despliegue.
- Beta cerrada.

---

# 43. CRITERIOS MÍNIMOS PARA UN MVP REAL

La primera beta funcional debe permitir:

1. Crear cuenta.
2. Personalizar avatar.
3. Entrar a Chess Academy.
4. Ver a otros usuarios.
5. Moverse por el mapa.
6. Interactuar con una mesa.
7. Crear partida.
8. Jugar al ajedrez contra otra persona.
9. Aplicar reglas legales.
10. Sincronizar turnos y relojes.
11. Guardar resultados.
12. Entrar en un aula.
13. Utilizar un tablero educativo compartido.
14. Activar audio con consentimiento.
15. Vincular opcionalmente Lichess para mostrar perfil y estadísticas.
16. Abandonar y volver a entrar correctamente.
17. Respetar permisos de acceso.
18. Mostrar errores y reconectarse de forma controlada.

El resto de sistemas avanzados se incorporará posteriormente.

---

# 44. DOCUMENTACIÓN OBLIGATORIA

Crear:

```text
README.md
docs/architecture.md
docs/database.md
docs/multiplayer.md
docs/chess-rules.md
docs/chess-integrity.md
docs/lichess-integration.md
docs/media.md
docs/permissions.md
docs/roadmap.md
docs/deployment.md
docs/security.md
docs/asset-licenses.md
```

Documentar:

- Decisiones técnicas.
- Comandos.
- Variables.
- Dependencias.
- Restricciones.
- Riesgos.
- Pruebas.
- Errores conocidos.

---

# 45. REGLAS DE TRABAJO PARA LA IA

Estas reglas son obligatorias.

1. No crear pantallas falsas como sustituto de funcionalidades.
2. No añadir botones sin comportamiento.
3. No utilizar datos ficticios en producción sin identificarlos.
4. No inventar APIs.
5. No ignorar TypeScript.
6. No introducir secretos en frontend.
7. No omitir autenticación y permisos.
8. No copiar assets sin licencia.
9. No mezclar lógica de ajedrez con el motor PixelSpace.
10. No implementar herramientas de trampas.
11. No asumir acceso a infraestructura no configurada.
12. No prometer escalabilidad sin pruebas.
13. No modificar sistemas estables innecesariamente.
14. No crear código duplicado si existe un módulo reutilizable.
15. No presentar como finalizado algo que no ha sido probado.
16. Mantener la separación entre reglas, networking y representación visual.
17. Documentar funcionalidades incompletas.
18. Mantener la aplicación ejecutable al terminar cada fase.
19. Validar operaciones sensibles en backend.
20. Priorizar funcionalidad antes que animaciones decorativas.

---

# 46. CÓMO DEBES COMENZAR

Tu primera tarea no será crear toda la academia.

Primero debes inspeccionar el repositorio y establecer los fundamentos del proyecto.

## Paso 1

Analizar el entorno disponible.

Comprobar:

- Sistema operativo.
- Node.js.
- Gestor de paquetes.
- Git.
- Dependencias.
- Herramientas disponibles.

## Paso 2

Proponer arquitectura definitiva.

Justificar:

- Stack.
- Monorepositorio.
- División de módulos.
- Persistencia.
- Multijugador.
- Audiovisual.
- Integración con Lichess.
- Estrategia de pruebas.

## Paso 3

Crear la estructura del proyecto.

Generar archivos reales.

Configurar herramientas.

## Paso 4

Crear el entorno de desarrollo.

Debe poder arrancarse con instrucciones claras.

## Paso 5

Crear un mundo 2D básico que sirva como demostración técnica real.

Si ya es viable en esta fase, añadir un avatar controlable; de lo contrario, dejarlo como la primera tarea de la siguiente fase.

## Paso 6

Ejecutar verificaciones.

Comprobar:

- Instalación.
- TypeScript.
- Lint.
- Compilación.
- Arranque.
- Pruebas existentes.

## Paso 7

Presentar un informe.

Indicar:

- Archivos creados.
- Funcionalidades implementadas.
- Pruebas ejecutadas.
- Resultados.
- Limitaciones.
- Comandos para arrancar.
- Siguiente fase.

---

# 47. PRINCIPIO FINAL

PixelSpace debe ser una plataforma general.

Chess Academy debe ser su primer espacio oficial.

El objetivo inicial es que dos personas puedan entrar en una academia pixel art, moverse, sentarse ante un tablero, jugar una partida legal, hablar y asistir a una clase.

El objetivo a largo plazo es que PixelSpace pueda alojar otros mundos que utilicen el mismo motor.

**Construye primero el sistema central correctamente. Después desarrolla las experiencias sobre él.**

No sacrifiques mantenibilidad ni seguridad por una apariencia de avance rápido.

Empieza por la Fase 0, crea un plan verificable y comienza su implementación real.
