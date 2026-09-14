# Google Play — matriz de Seguridad de datos

Fecha del inventario: 14 de septiembre de 2026. Aplicación Android: `app.jahatelo.mobile`.

Esta matriz traduce el comportamiento actual del código al formulario. Debe compararse con el AAB finalmente subido y con las versiones vigentes de cada SDK antes de enviar la declaración.

## Respuestas generales

- ¿La aplicación recoge o comparte tipos de datos requeridos?: **Sí**.
- ¿Los datos se cifran en tránsito?: **Sí**, todas las comunicaciones admitidas usan HTTPS/TLS. Confirmar nuevamente en el AAB final.
- ¿El usuario puede solicitar eliminación?: **Sí**.
- URL de eliminación de cuenta y datos: `https://jahatelo.com/eliminar-cuenta`.
- Venta de datos personales: **No**.
- Anuncios: los destacados son promoción propia de clientes de Jahatelo; no existe una red publicitaria de terceros en el código inventariado.

Google define “recogido” como dato transmitido fuera del dispositivo, incluso por SDKs. Las transferencias a proveedores que procesan únicamente por cuenta de Jahatelo pueden quedar exentas de declararse como “compartidas”, pero esa condición debe validarse contractualmente.

Fuentes oficiales:

- https://support.google.com/googleplay/android-developer/answer/10787469
- https://developers.google.com/maps/documentation/android-sdk/play-data-disclosure

## Tipos que deben seleccionarse

| Categoría de Play | Tipo | Recogido | Compartido | Obligatorio | Finalidades actuales |
| --- | --- | --- | --- | --- | --- |
| Ubicación | Aproximada | Sí | Condicional | Opcional | Funcionalidad, personalización y analítica; incluye inferencia por IP y permiso aproximado. |
| Ubicación | Precisa | Condicional | Condicional | Opcional | Moteles cercanos y mapa. Confirmar en el AAB si las coordenadas salen del dispositivo mediante el SDK; el backend propio no las conserva como perfil. |
| Información personal | Nombre | Sí | No, si proveedores califican para la excepción | Obligatorio al crear cuenta | Gestión de cuenta, reseñas y seguridad. |
| Información personal | Dirección de correo | Sí | No, si proveedores califican para la excepción | Según método de acceso | Cuenta, verificación, recuperación y comunicaciones. |
| Información personal | IDs de usuario | Sí | No, si proveedores califican para la excepción | Automático al crear cuenta | Cuenta, seguridad, favoritos, reseñas y analítica autenticada. |
| Información personal | Número de teléfono | Sí | No, si AWS/proveedor califican para la excepción | Según método de acceso | OTP, cuenta y seguridad. |
| Fotos y videos | Fotos | Sí | No, si AWS califica para la excepción | Opcional | Foto de perfil y contenido administrado. |
| Actividad en aplicaciones | Interacciones con la aplicación | Sí | Condicional | Automático | Analítica, embudo, mejora y seguridad; Maps SDK puede recoger paneo y zoom. |
| Actividad en aplicaciones | Otro contenido generado por usuarios | Sí | No | Opcional | Reseñas, comentarios y reportes. |
| Identificadores del dispositivo u otros | Identificadores | Sí | Condicional | Automático | Identificador aleatorio de instalación/navegador, token push, sesión, prevención de abuso y medición. Maps SDK genera además un identificador seudónimo propio. |
| Rendimiento de la aplicación | Registros de fallos | Sí por Maps SDK | Condicional | Automático | Estabilidad del SDK de mapas. No atribuirlo a Sentry, que no está integrado. |
| Rendimiento de la aplicación | Diagnósticos | Sí por Maps SDK | Condicional | Automático | Metadatos de dispositivo/SDK y diagnóstico del servicio de mapas. |

“Condicional” significa que la respuesta final depende del comportamiento del AAB y de si Google, Expo, AWS, Vercel/hosting y correo cumplen la definición contractual de proveedor de servicios de Play. No debe enviarse el formulario con esa palabra: resolver cada condición primero.

## Tipos que no aparecen en el inventario móvil actual

No seleccionar salvo que el AAB final o una función nueva demuestren lo contrario:

- Dirección postal del usuario consumidor.
- Raza o etnia, creencias políticas o religiosas, orientación sexual.
- Contactos, calendario, archivos/documentos generales, audio o música.
- Información financiera, compras, historial crediticio o activos digitales.
- Salud y actividad física.
- SMS o correos del usuario.
- IMEI, número de serie o dirección MAC.

La información comercial de propietarios de moteles debe declararse si puede cargarse desde cualquier versión Android distribuida; el formulario representa la suma de todas las funciones y versiones activas del paquete.

## Proveedores/SDK que deben revalidarse en el AAB final

- Google Maps SDK: recoge automáticamente metadatos de solicitud/dispositivo, métricas de fallos, IP e identificador seudónimo; puede recoger interacción con el mapa.
- Google Login: identidad y autenticación iniciadas por el usuario.
- Expo Push Notifications: token y entrega de notificaciones.
- AWS S3: almacenamiento de imágenes.
- AWS SNS: envío de OTP por SMS.
- Hosting/base de datos de Jahatelo: cuentas, actividad y contenido.
- Proveedor SMTP configurado: verificación y comunicaciones por email.

## Validación antes de enviar

1. Subir el AAB exacto al análisis interno de Play Console y revisar permisos/SDKs detectados.
2. Confirmar que solo figuran `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` y `POST_NOTIFICATIONS`, además de permisos técnicos incorporados legítimamente por dependencias.
3. Probar tráfico del mapa y determinar si la ubicación precisa se transmite fuera del dispositivo.
4. Confirmar contratos y términos de cada proveedor antes de marcar “no compartido” por la excepción de proveedor de servicios.
5. Comparar todas las respuestas con `https://jahatelo.com/privacidad` y `https://jahatelo.com/eliminar-cuenta`.
6. Guardar captura/exportación del formulario enviado, fecha, versión del AAB y persona responsable.

