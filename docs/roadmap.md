# Roadmap y criterios

La petición posterior prioriza una sección vertical comprobable: mapa + multijugador + mesa legal + cuentas Discord. No se declara completada toda una fase del documento maestro por entregar una parte.

| Sistema      | Estado de esta entrega                                                                            | Pendiente                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Fundamentos  | Workspaces, TS estricto, scripts, CI, build, documentación                                        | Validar contenedores en Docker                                                                |
| Motor        | Mapa original de cuatro zonas, avatar, colisiones, animación, cámara/zoom, controles alternativos | Validación más amplia de rendimiento/accesibilidad                                            |
| Multijugador | Colyseus real, nombres, autoridad de servidor, interpolación, reconexión                          | Predicción avanzada, carga y escalado                                                         |
| Cuentas      | OAuth Discord, registro al autorizar, sesiones revocables, D1 compatible                          | Credenciales reales, deploy, retención/exportación/borrado y política de menores              |
| Academia     | Cuatro zonas navegables y mesa 01 interactiva                                                     | Docencia, comunicación y otras actividades                                                    |
| Ajedrez      | Dos participantes, jugadas legales, tablas/rendición, PGN y resultados                            | Relojes, persistencia en curso, reglas de posición muerta exhaustivas                         |
| Producción   | Pages preparado; Worker compilado y D1 local probado; gateway Containers tipado                   | Cuenta Cloudflare renovada, D1 remoto, secretos Discord, Docker/Containers y pruebas externas |

Siguiente aceptación: comprobar CI/Pages publicados, completar configuración Cloudflare/Discord, repetir la partida entre navegadores de dos equipos mediante HTTPS/WSS y comprobar revocación/guardado en D1 remoto. Después continuar el roadmap maestro. No desarrollar todavía torneos avanzados, pagos, IA educativa ni editor.
