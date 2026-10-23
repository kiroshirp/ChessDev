# Arquitectura de ChessDev

React y TypeScript con Vite para una plataforma de ajedrez adaptable. El frontend usa chess.js para tablero local, PGN y entrenamiento; Colyseus para la mesa compartida. Ya no carga Phaser ni la UI de mundo virtual.

GitHub Pages → API pública en Render `/api` → Worker Cloudflare → D1. La conexión WebSocket termina en Render Free. El Worker controla Lichess OAuth PKCE, sesiones, tickets e historial. El proxy enumera rutas públicas; no expone `/internal` ni acepta destinos arbitrarios.

Módulos reutilizados: auth para tickets y hashes; database para D1/SQLite; chess-core para reglas autoritativas y resultados; realtime para Colyseus. Los motores de mapa/movimiento permanecen internos, separados del ajedrez, para compatibilidad del servidor. El acceso directo `chess:join` coloca al jugador en la mesa desde el servidor.

Estudios y progreso permanecen en el almacenamiento del navegador, con validación, errores visibles y exportación PGN. Cuentas y resultados se guardan en D1. No hay evaluación de motor ni sincronización de estudios.

[Decisiones vigentes](decisions.md), [acceso Lichess](lichess-setup.md), [infraestructura](free-hosting.md), [validación](verification.md).
