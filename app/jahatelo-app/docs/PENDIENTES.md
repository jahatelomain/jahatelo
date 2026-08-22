# Pendientes de Jahatelo

## Colaboración y actualización del catálogo

Implementar una vía simple desde la app y la web para que los clientes ayuden a mantener el catálogo actualizado:

1. Reportar precios desactualizados, información incorrecta o un motel cerrado.
2. Adjuntar una breve descripción y, cuando corresponda, la información vigente que conoce el cliente.
3. Recomendar un motel que todavía no esté cargado en Jahatelo.
4. Crear el reporte como un registro auditable para que SUPERADMIN pueda revisarlo, asignarlo, resolverlo o descartarlo sin modificar automáticamente datos públicos.

## Google Search Console y permisos

Configurar una integración técnica segura con Google Search Console para Jahatelo:

1. Crear y configurar la identidad técnica de acceso (cuenta de servicio u OAuth) en Google Cloud.
2. Otorgarle únicamente los permisos necesarios sobre la propiedad de Search Console, sin usar ni compartir credenciales personales.
3. Guardar las credenciales exclusivamente como secretos de entorno.
4. Integrar la API para consultar indexación, sitemap, errores de rastreo, impresiones, clics, consultas y posiciones.
5. Definir un panel administrativo de SEO y controles de acceso: solo SUPERADMIN puede configurar la integración y consultar la información global.
6. Documentar la revocación de acceso, rotación de credenciales y el responsable operativo.
