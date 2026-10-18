# Audio y vídeo

**Pendiente — Fase 6.** No se solicita acceso a dispositivos. El navegador no carga SDK multimedia. Esta versión no incluye LiveKit ni ofrece controles de audio/vídeo sin implementación.

Futura interfaz `MediaProvider`: unirse/salir, publicar dispositivos propios por consentimiento, suscribirse según permisos y proximidad, ajustar volumen, selección de dispositivos y reintentos. Credenciales y emisión de tokens solo desde backend autorizado. Nunca confiar en la posición del avatar para conceder acceso a una sala privada.

Micrófono y cámara apagados inicialmente. Bloqueos efectivos en servidor/suscripción. Hablar por proximidad no concede permiso de grabación; no incorporar grabación oculta. No audio de aulas privadas fuera de sus miembros.

Producción futura requiere revisar el proveedor y sus versiones, TLS, dominios, TURN/ICE y firewall, claves propias y pruebas reales en los navegadores objetivo. No se ha configurado infraestructura audiovisual.
