# Multijugador implementado

Node + Colyseus, una sala pública `academy`, esquema compartido `WorldState`. Los clientes entran con ticket HMAC de 60 segundos emitido tras autenticar sesión. El servidor verifica firma, caducidad, nonce no reutilizado y sesión activa en API. Los nombres y UUID proceden de la sesión; se ignoran opciones de identidad enviadas libremente por cliente. Una misma cuenta no ocupa dos conexiones simultáneas en una sala.

Simulación a 30 Hz, parches cada 50 ms. El cliente manda dirección -1/0/1 y secuencia, nunca posición. El servidor valida Zod estricto, rechaza secuencias repetidas y calcula velocidad/colisiones. Una entrada expira en 250 ms si no se renueva. Límite de mensajes del room y payload WebSocket acotado. Se congelan movimientos estando sentado.

Phaser interpola desde posiciones del servidor, también para el avatar propio. No hay todavía predicción/reconciliación avanzada; la latencia del movimiento propio aumenta en redes lejanas. Los portales accesibles del menú llevan solo a puntos de aparición permitidos por servidor; no aceptan coordenadas arbitrarias.

Desconexión inesperada: reserva de 20 segundos, avatar marcado desconectado y sin movimiento. El SDK reintenta automáticamente sin encolar entradas antiguas. Al reconectar se conserva identidad y asiento; si expira la reserva, se libera al jugador y una partida activa se termina por rendición. Al salir explícitamente se libera de inmediato.

Objetos: `world:interact` comprueba existencia y distancia (160 unidades en mesa 01); envía `activity:open`. Sentarse vuelve a comprobar proximidad, disponibilidad y estado. Servidor valida asientos, turnos y revisiones del módulo Chess. No hay salas privadas ni permisos docentes en esta versión.

Pruebas: dos contextos Chromium, sincronización observada desde el otro navegador, eliminación de presencia al cerrar sesión; SDK real prueba identidad ausente, payload con posiciones/ID ajeno, duplicados, interacción remota, ticket repetido y reconexión. No se ha ejecutado una prueba de carga, interés espacial, despliegue distribuido o latencia artificial.
