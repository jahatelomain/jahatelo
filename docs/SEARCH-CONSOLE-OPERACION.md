# Operación segura de Google Search Console

Estado: procedimiento interno listo. Falta asignar por nombre al titular y al suplente y crear la identidad en Google.

## Alcance técnico

El panel SUPERADMIN usa una identidad técnica exclusivamente de lectura con el alcance `webmasters.readonly`. La aplicación espera estas variables, que nunca deben guardarse en Git:

- `SEARCH_CONSOLE_CLIENT_EMAIL`
- `SEARCH_CONSOLE_PRIVATE_KEY`
- `SEARCH_CONSOLE_SITE_URL=https://www.jahatelo.com/`

La propiedad debe conceder a esa identidad solo el permiso mínimo que permita consultar Search Analytics y sitemaps. No debe ser propietaria delegada ni tener capacidad de modificar la propiedad.

## Responsables

- Titular operativo: por designar.
- Suplente: por designar.
- Aprobación de altas, cambios o revocaciones: responsable de Akahata Studio.

No se considera terminado el alta hasta escribir los nombres y una vía de contacto en este documento.

## Alta

1. Crear una cuenta de servicio exclusiva para Jahatelo Search Console; no reutilizar la de Maps ni otra integración.
2. Añadir su correo a la propiedad canónica de Search Console con el menor permiso posible.
3. Generar una clave nueva y cargarla directamente como secretos del entorno de producción.
4. Confirmar que el repositorio, logs, capturas y tickets no contienen la clave privada.
5. Verificar desde SUPERADMIN que el panel lee consultas, páginas y sitemaps sin permitir cambios.
6. Registrar fecha, operador y últimos cuatro caracteres del identificador de la clave; nunca copiar la clave.

## Revisión y rotación

- Revisar usuarios y permisos cada 90 días y después de cualquier cambio de personal.
- Rotar la clave como máximo cada 180 días o antes si el proveedor o la política interna lo exige.
- Crear y probar la clave sustituta antes de revocar la anterior; el solapamiento no debe superar 24 horas.
- Revisar mensualmente que la propiedad, dominio canónico y sitemap continúen siendo los esperados.

Registro mínimo por revisión: fecha, persona, identidad revisada, permiso, resultado y próxima revisión.

## Revocación e incidente

Ante una filtración posible, salida de personal, acceso inesperado o clave expuesta:

1. Revocar inmediatamente la clave en Google Cloud y retirar el usuario de Search Console si corresponde.
2. Eliminar los secretos comprometidos de todos los entornos y volver a desplegar con una identidad nueva.
3. Revisar los logs de acceso y el repositorio; si el secreto llegó a Git, tratarlo como comprometido aunque luego se borre.
4. Documentar alcance, ventana temporal, medidas tomadas y responsable.
5. Confirmar la recuperación del panel usando únicamente permisos de lectura.

## Baja definitiva

Retirar el usuario de la propiedad, deshabilitar o eliminar la cuenta de servicio, borrar sus secretos de todos los entornos y dejar constancia de la fecha. La ausencia de conexión debe degradar el panel a su estado seguro de “no configurado”.

