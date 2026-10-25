# ChessDev · Hecho por TopChess

Alquiler urgente de material de ajedrez. Landing estática en español, adaptable a móvil, sin registro y sin dependencias de producción.

**Contacto: TopChess · 613 133 823. Solo mensajes. No atendemos llamadas.**

## Uso

Con Node.js 22 o superior:

```sh
npm run dev
npm run check
npm run build
```

La vista local se sirve en http://127.0.0.1:4173/ChessDev/. El sitio compilado queda en `dist/`; solo se publican los archivos públicos.

## Solicitudes y condiciones

El cliente elige cantidades y fechas, indica su nombre y prepara el resumen en WhatsApp. Debe revisarlo y enviarlo allí. La web no confirma reservas ni realiza cobros y no almacena datos personales. La opción de copiar permite compartir el mismo resumen manualmente.

50 € de gestión urgente + alquiler por unidad para hasta 48 horas. Fianza aparte e importe e impuestos a confirmar. Las solicitudes de más de 48 horas requieren presupuesto específico. Disponibilidad, horario, dirección, fianza, pago y condiciones se acuerdan por mensaje antes de confirmar.

El catálogo y sus inventarios máximos se editan en `rental.mjs`. El inventario no está conectado a reservas ni a las clases de TopChess; revisar existencias antes de aceptar. La dirección del local no se publica porque todavía no se ha facilitado.

`assets/contrato-chessdev.pdf` es un modelo para completar y revisar antes de utilizarlo. Faltan los datos fiscales del prestador, los términos de cancelación y desistimiento y las condiciones particulares. Su descarga no supone contratación ni aprobación jurídica.

## Publicación

Un cambio en `main` ejecuta comprobaciones, genera `dist/` y publica en https://kiroshirp.github.io/ChessDev/ mediante GitHub Actions. Todas las rutas públicas son relativas para funcionar bajo `/ChessDev/`.

Este proyecto sustituye el contenido anterior del repositorio conservando el historial Git. No utiliza los anteriores servidores, bases de datos, Lichess, Firebase ni Render. La sustitución del código no elimina esos recursos externos.
