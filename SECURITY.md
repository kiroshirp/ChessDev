# Límites de la administración

- Las escrituras se autorizan en Firebase Realtime Database únicamente cuando el token verificado por Firebase tiene `auth.uid === 'chessdev-admin'`. La condición de usuario en el navegador no concede permisos.
- El catálogo público es el único dato legible sin sesión. El resto de rutas de la base de datos deniegan lectura y escritura.
- El esquema exige todos sus campos mediante `hasChildren`. Los bloques `$other: { ".validate": false }` rechazan campos adicionales. En conjunto exigen exactamente 2 campos en el catálogo y exactamente 11 en cada artículo.
- El límite de 100 artículos también se impone en el servidor: únicamente se permiten siete identificadores iniciales y los 93 identificadores `item-00` a `item-92`. Cada clave identifica una sola unidad de catálogo. No se admiten otras claves.
- `numChildren()` no existe en `RuleDataSnapshot` de las reglas de Realtime Database; no se utiliza. El límite y la forma exacta del esquema se mantienen mediante las restricciones anteriores, sin sustituirlas por validación exclusiva en el cliente.
- Se validan tipos, rangos de precio y stock, enteros, categorías y correspondencia entre clave e identificador. La revisión debe incrementarse de uno en uno. Se utiliza ETag e If-Match para evitar sobrescribir ediciones concurrentes.
- Los precios admiten céntimos, con tolerancia de 0,000001 al multiplicar por 100 para el error binario de coma flotante (por ejemplo, 0,29). Los importes con fracciones reales de céntimo, como 2,345, siguen rechazándose en Firebase.
- `.env` no se versiona ni se copia al sitio. El servidor local deniega archivos ocultos, directorios privados y archivos fuera de su lista de formatos. El despliegue usa una lista explícita de recursos públicos.
- La contraseña se importa como hash con salt en Firebase Authentication y nunca aparece en JavaScript público. Los tokens de sesión solo se conservan en memoria y caducan en una hora o al recargar.
- La clave de configuración web de Firebase es pública por diseño y no es una credencial de administración. Las reglas y Firebase Authentication protegen las escrituras.
