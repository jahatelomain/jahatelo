# Expediente técnico de exportación de EE.UU.

Fecha de revisión técnica: 14 de septiembre de 2026.

Este documento conserva evidencia técnica para la clasificación. No es una determinación legal ni sustituye el criterio de un profesional de comercio exterior.

## Producto evaluado

- Aplicación: Jahatelo para iOS y Android.
- Identificador: `app.jahatelo.mobile`.
- Función principal: catálogo y descubrimiento de moteles, cuentas, favoritos, reseñas, ubicación, mapas y notificaciones.
- Distribución prevista: Apple App Store y Google Play.

## Inventario criptográfico real

| Uso | Implementación | Observación |
| --- | --- | --- |
| Tránsito de datos | HTTPS/TLS provisto por sistema operativo, React Native, navegador e infraestructura | Cifrado estándar; Jahatelo no implementa el protocolo. |
| Sesiones | JWT firmados con HMAC SHA-256 mediante `jose` | Firma e integridad; no cifra el contenido del token. |
| Google Login | Validación de tokens y firmas estándar de Google | Autenticación mediante proveedor externo. |
| Contraseñas | Hash irreversible con bcrypt | Hashing, no cifrado reversible. |
| Credencial Search Console | JWT RS256 para OAuth de servidor | Integración administrativa del backend, no función criptográfica ofrecida al usuario móvil. |
| Almacenamiento local/plataforma | Protecciones provistas por iOS/Android y librerías de plataforma | No existe un algoritmo propio en Jahatelo. |

No se encontró criptografía propia, mensajería cifrada de extremo a extremo, VPN, administración de claves de terceros, moneda criptográfica, funciones militares, interceptación, criptoanálisis ni posibilidad de que el usuario cambie algoritmos o parámetros criptográficos.

## Evaluación preliminar

La aplicación utiliza criptografía estándar y accesoria a sus funciones principales. Eso es compatible con una evaluación de excepción o tratamiento de software de mercado masivo, pero la clasificación final no debe inferirse solo de este inventario.

La guía vigente del Bureau of Industry and Security indica que determinados productos que de otro modo serían `5D002` pueden clasificarse como `5D992.c` al satisfacer los criterios de mercado masivo, y advierte que pueden existir requisitos de clasificación o presentación bajo 15 CFR 740.17. Por ello no se declara automáticamente `EAR99` ni `5D992.c` en este expediente.

Referencia oficial: https://www.bis.gov/learn-support/encryption-controls/mass-market

## Decisión que debe conservarse antes de publicar

El responsable debe registrar en este mismo expediente:

- Clasificación final: pendiente (`EAR99`, `5D992.c` u otra excepción aplicable).
- Fundamento normativo y versión evaluada.
- Si requiere clasificación, notificación o reporte ante BIS y evidencia de su cumplimiento.
- Profesional o responsable que validó la conclusión, con fecha.
- Países donde se distribuirá la aplicación.

Si no puede justificarse documentalmente una opción, escalar a asesoría profesional antes de marcar JH-076 como completado.

## Control de destinos y personas

Antes de habilitar una distribución nueva:

1. Revisar países y territorios restringidos por las normas aplicables de EE.UU.
2. Verificar que destinatarios, socios y cuentas comerciales relevantes no aparezcan en listas de partes restringidas.
3. No aceptar transacciones o soporte que contradigan sanciones o controles de exportación aplicables.
4. Conservar fecha, fuente consultada, responsable y resultado de cada revisión.

La revisión debe repetirse en cada publicación internacional material y cuando cambien las sanciones, la criptografía o el modelo del producto.

## Cambios que obligan a reevaluar

- Incorporar cifrado propio o de extremo a extremo.
- Añadir VPN, túneles, custodia de claves, activos criptográficos o funciones de seguridad como producto principal.
- Cambiar los países de distribución.
- Modificar sustancialmente autenticación, transporte o almacenamiento seguro.
- Actualizar dependencias que introduzcan nuevas funciones criptográficas.

