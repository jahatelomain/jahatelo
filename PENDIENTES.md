# Pendientes de Jahatelo

Este documento es la única lista canónica de trabajo pendiente del proyecto Jahatelo.
Incluye web pública, panel administrativo, backend y aplicaciones iOS/Android.

## Criterios de trabajo

- Mantener cada pendiente en una sola sección.
- Marcar como completado únicamente después de verificarlo en las plataformas afectadas.
- Agregar criterios de aceptación antes de comenzar una funcionalidad grande.
- No usar documentos separados de pendientes dentro de `web/` o `app/`.

## Prioridad inmediata

### Controles y funciones incompletas

- [x] Dar funcionalidad a la campana de notificaciones del home web móvil o esconderla hasta que exista el flujo.
- [x] Configurar correctamente el inicio de sesión con Apple en iOS o esconder la opción de login y registro hasta que esté disponible. Apple Login permanece oculto temporalmente.
- [x] Reemplazar el placeholder remoto de anuncios de la app por un recurso local de Jahatelo.
- [x] Corregir las advertencias de dependencias de `useEffect` detectadas por ESLint en el admin.

### Preparación para producción

- [x] Completar el Team ID real en `web/jahatelo-web/public/.well-known/apple-app-site-association`.
- [ ] Completar el SHA256 real en `web/jahatelo-web/public/.well-known/assetlinks.json`.
- [x] Completar la configuración disponible para el envío de iOS en `app/jahatelo-app/eas.json`: Team ID real configurado y placeholders inválidos eliminados. App Store Connect solicitará la cuenta y aplicación al enviar mientras no se configuren valores opcionales de automatización.
- [ ] Configurar y verificar las variables de Sentry en Vercel y EAS.
- [ ] Verificar universal links y app links desde web hacia iOS y Android.
  - [x] Configurar la navegación interna de la app para detalle, búsqueda, mapa y cercanía.
  - [x] Corregir dominios, rutas y Team ID para iOS.
  - [x] Corregir dominios y rutas declaradas para Android.
  - [ ] Completar el SHA256 del certificado Android de producción en `assetlinks.json`.
  - [ ] Validar los enlaces contra los archivos publicados en producción y dispositivos físicos.

## Producto

### Reportes y actualización del catálogo

- [ ] Permitir reportar desde web, iOS y Android información desactualizada de un motel.
- [ ] Incluir motivos: precio incorrecto, foto incorrecta, ubicación o contacto incorrecto, motel cerrado, información incorrecta u otro.
- [ ] Permitir comentario y evidencia opcional.
- [ ] Permitir recomendar un motel que todavía no esté publicado en Jahatelo.
- [ ] Registrar motel, usuario opcional, fecha, detalle, evidencia, responsable y estado del reporte.
- [ ] Crear una bandeja exclusiva para SUPERADMIN con estados pendiente, en revisión, resuelto y descartado.
- [ ] Permitir asignación, notas internas y trazabilidad completa.
- [ ] Auditar los cambios realizados como consecuencia de un reporte.
- [ ] Impedir que el administrador de un motel cierre o modifique reportes sobre su propio establecimiento.
- [ ] Medir tiempo de resolución y moteles con reportes recurrentes.

### Aviso de actualización de las apps

- [ ] Crear una configuración remota para versión mínima obligatoria y versión recomendada.
- [ ] Mostrar un aviso in-app cuando exista una versión nueva.
- [ ] Permitir mensaje, modalidad opcional u obligatoria y enlaces de cada store.
- [ ] Registrar en analytics las acciones mostrar, actualizar y omitir.

### Contacto y captación comercial

- [ ] Reservar `/contacto` para consultas generales y soporte.
- [ ] Reservar `/registrar-motel` para propietarios interesados en publicar su motel.
- [ ] Evitar formularios duplicados y reutilizar componentes y validaciones.
- [ ] Registrar origen, campaña, consentimiento y seguimiento comercial de cada prospect.

## Web pública

### Experiencia visual

- [ ] Unificar el lenguaje visual entre desktop, web móvil y apps: colores, radios, sombras, tipografía, espaciado y estados.
- [ ] Definir tokens visuales compartidos y documentar su uso.
- [ ] Unificar skeletons, placeholders, estados vacíos, errores y acciones de reintento.
- [ ] Mantener consistencia visual entre `/contacto`, `/registrar-motel`, autenticación y páginas de catálogo.
- [ ] Respetar `prefers-reduced-motion` en animaciones y efectos decorativos.

### Accesibilidad

- [ ] Revisar contraste de texto, botones, overlays y estados deshabilitados.
- [ ] Garantizar foco visible y navegación completa con teclado.
- [ ] Revisar nombres accesibles de iconos, botones y controles interactivos.
- [ ] Verificar jerarquía de encabezados y mensajes de error anunciables.

### SEO y adquisición

- [ ] Completar la auditoría SEO técnica y de contenido.
- [ ] Verificar metadata, canonicals, sitemap, robots, datos estructurados y páginas por ciudad y barrio.
- [ ] Configurar Google Search Console con una identidad técnica y permisos mínimos.
- [ ] Guardar credenciales exclusivamente como secretos de entorno.
- [ ] Crear un panel SUPERADMIN para indexación, sitemap, errores, impresiones, clics, consultas y posiciones.
- [ ] Documentar revocación, rotación de credenciales y responsable operativo.

### Mapa web

- [ ] Diagnosticar el fondo gris antes de aplicar cambios visuales.
- [ ] Verificar API key, restricciones, Map ID, estilo vectorial, facturación y dominios autorizados.
- [ ] Verificar carga, errores, permisos de ubicación y estados sin resultados.
- [ ] Validar la experiencia en desktop y navegadores móviles.

## Aplicaciones iOS y Android

### Experiencia visual y consistencia

- [ ] Centralizar colores y estilos que actualmente están hardcodeados en pantallas y componentes.
- [ ] Terminar la integración del modo oscuro existente o retirar el código no utilizado.
- [ ] Unificar navegación, iconos, nombres y estados con la web móvil.
- [ ] Unificar alerts, errores inline, toasts, banners y modales según el tipo de mensaje.
- [ ] Revisar skeletons, placeholders, fotos y logos en cards, búsquedas, mapas, promos y detalle.

### Accesibilidad móvil

- [ ] Agregar etiquetas, roles, hints y estados accesibles a controles interactivos.
- [ ] Revisar áreas táctiles mínimas y orden de lectura.
- [ ] Verificar texto ampliado y evitar cortes en tamaños de fuente grandes.
- [ ] Probar VoiceOver en iOS y TalkBack en Android.

### Estados y conectividad

- [ ] Revisar comportamiento offline y de reconexión en todos los flujos principales.
- [ ] Estandarizar errores de red y acciones de reintento.
- [ ] Verificar que anuncios, fotos y placeholders no dependan de recursos externos innecesarios.

## Panel administrativo

### Operación diaria

- [ ] Crear una bandeja operativa con aprobaciones pendientes, reportes, prospects sin atender, datos incompletos y errores de media.
- [ ] Mostrar claramente los estados guardado, cambios sin guardar, publicado y visible en web/apps.
- [ ] Incorporar previsualización web y app antes de publicar fichas, fotos, promociones y banners.
- [ ] Crear un indicador de calidad del catálogo por motel: ubicación, precios, horarios, fotos, habitaciones, amenities, contacto y última revisión.

### Formularios y navegación

- [ ] Dividir formularios extensos en secciones claras con progreso y resumen previo a publicación.
- [ ] Unificar validaciones inline, mensajes, confirmaciones y estados de carga.
- [ ] Homogeneizar tablas, filtros persistentes, paginación, acciones masivas y exportación.
- [ ] Dividir páginas y componentes demasiado grandes para facilitar mantenimiento y consistencia.

## Media

- [ ] Definir la especificación de imagen para portada web, portada app, miniatura, habitación, promo, banner y logo.
- [ ] Documentar por uso: relación de aspecto, resolución mínima, peso máximo, recorte, safe area y marca de agua.
- [ ] Validar los archivos antes de subirlos y explicar el problema al operador.
- [ ] Mostrar previsualización del recorte final para web, iOS y Android.
- [ ] Automatizar conversión, orientación, compresión y variantes cuando corresponda.
- [ ] Crear una guía breve para las personas que cargan fotos.

## Calidad y mantenimiento

- [ ] Aumentar pruebas de flujos móviles; actualmente la cobertura se concentra en pocos componentes y hooks.
- [ ] Agregar pruebas de integración para autenticación, búsqueda, favoritos, reportes, actualización y conectividad.
- [ ] Mantener lint sin errores ni advertencias en app, web y admin.
- [ ] Agregar pruebas visuales o capturas de referencia para pantallas críticas.
- [ ] Revisar periódicamente componentes, temas y documentación sin uso.

## Completados

Mover aquí los pendientes terminados indicando fecha, plataformas verificadas y referencia al cambio correspondiente.
