# Pendientes de Jahatelo

Única lista canónica de trabajo para la web pública, panel administrativo, backend y aplicaciones iOS/Android.

## Reglas

- Cada pendiente principal tiene un ID permanente `JH-###`; nunca se renumera.
- Al completar o eliminar un punto, se mueve a **Completados** conservando su ID.
- Las subtareas no se cuentan como pendientes principales nuevos.
- Todo punto nuevo se agrega primero en este archivo con un ID nuevo.
- Las funcionalidades de usuario deben mantener paridad entre web, iOS y Android, salvo indicación explícita.
- CMPR, despliegues y verificaciones externas se informan aparte; no generan pendientes duplicados.
- Después de completar tareas de esta lista, responder siempre con la lista completa y actualizada de pendientes activos.

## Pendientes activos

### Seguridad y autenticación

- [ ] **JH-078 — Dependencias transitivas sin corrección compatible:** la web ya actualizó Next, Sharp, Nodemailer, AWS y demás correcciones seguras; quedan tres avisos altos en `deepmerge-ts` de Prisma CLI. La app conserva avisos dentro de Expo/Metro cuya salida automática exige migrar de Expo 54 a 57. No aplicar `npm audit fix --force`: planificar y probar ambas migraciones mayores, reconstruir iOS/Android y repetir las auditorías.

### Preparación para producción

- [ ] **JH-001 — Android App Links:** completar el SHA256 del certificado Android de producción en `web/jahatelo-web/public/.well-known/assetlinks.json` y validarlo en un dispositivo físico.
- [ ] **JH-003 — Enlaces universales:** validar universal links y app links contra los archivos publicados en producción, iOS y Android físicos. La navegación y los dominios ya están configurados.

### SEO y adquisición

- [ ] **JH-018 — Google Search Console:** configurar una identidad técnica con permisos mínimos y guardar sus credenciales únicamente como secretos.
- [ ] **JH-020 — Operación de Search Console:** el procedimiento de alta, mínimo privilegio, revisión, rotación, revocación e incidentes está documentado en `docs/SEARCH-CONSOLE-OPERACION.md`. Falta designar por nombre al titular y suplente y crear la identidad externa.

### Mapa web

- [ ] **JH-021 — Configuración externa del mapa:** verificar en Google Cloud la API key, restricciones, Map ID, estilo vectorial, facturación y dominios; confirmar si esto origina el fondo gris.
- [ ] **JH-022 — Validación real del mapa:** la ruta de producción responde HTTP 200 y se verificó su render automatizado; falta confirmar ubicación y gestos en dispositivos físicos iOS/Android y resolver cualquier hallazgo.

### Aplicaciones iOS y Android

- [ ] **JH-028 — Texto ampliado:** la revisión de código ya retiró cortes de una línea, preserva escalado y scroll en formularios; falta ejecutar y registrar la matriz con el tamaño máximo en dispositivos físicos.
- [ ] **JH-029 — Lectores de pantalla:** ejecutar la matriz documentada con VoiceOver y TalkBack en dispositivos físicos.
- [ ] **JH-073 — Cumplimiento de permisos y privacidad en Google Play:** los permisos Android amplios de cámara/galería sin uso fueron retirados; política y retención se alinearon con el código. La matriz campo por campo está en `kit para subida a stores/GOOGLE-PLAY-SEGURIDAD-DE-DATOS.md`. Falta resolver las condiciones del AAB final y proveedores, cargarla y validarla externamente en Play Console.
- [ ] **JH-075 — Firma de producción para Google Maps Android:** tras subir el primer AAB, agregar a Google Cloud el SHA-1 de Google Play App Signing para Maps y validar el mapa del build distribuido por Play en un Android físico. El SHA-256 de App Links continúa exclusivamente en JH-001.
- [ ] **JH-076 — Expediente de cumplimiento de exportación de EE.UU.:** el inventario criptográfico, evidencia y procedimiento de control están documentados en `docs/CUMPLIMIENTO-EXPORTACION-EEUU.md`. Falta registrar la clasificación final aplicable (`EAR99`, `5D992.c` u otra excepción), revisar destinos/personas sancionadas y obtener validación profesional si no puede sostenerse internamente.
- [ ] **JH-077 — Paridad visual y claridad del home en iOS/Android:** implementación integrada en `main` mediante PR #102 y rebuild iOS/Android completado; falta la confirmación visual final en dispositivos físicos antes de cerrarlo.
  - Redondear correctamente en iOS el contenedor completo de todas las tarjetas Diamond: destacados, Favoritos, búsqueda, cercanos, listados por ciudad y secciones horizontales del home.
  - Restablecer la jerarquía de tamaño de los marcadores según plan y reducir su escala general en Android.
  - Replicar en iOS la entrada escalonada de las ciudades que actualmente se aprecia mejor en Android.
  - Aplicar en Android las esquinas inferiores redondeadas del encabezado fotográfico del detalle que ya se ven en iOS.
  - Separar el acceso al historial de notificaciones de la configuración de preferencias y definir un estado vacío claro.
  - Reducir aproximadamente a la mitad el espacio superior del encabezado del home en iOS, respetando el área segura.
  - Sustituir el texto actual “Compará opciones y elegí dónde ir” por “Cientos de opciones para que elijas dónde ir”. No utilizar la palabra “compará”.

### Panel administrativo

### Optimización integral UI/UX

- [ ] **JH-062 — Verificación visual autenticada:** recorrer y validar las pantallas de SUPERADMIN y administradores de moteles con datos reales después de completar la reorganización.


## En pausa

- [ ] **JH-002 — Observabilidad externa:** Sentry fue retirado por completo de web y apps mientras no exista presupuesto ni operación real. Reconsiderar una herramienta externa solo con proveedor, costos, responsable, privacidad y alertas definidos; decisión registrada en `DT-002`.
- [ ] **JH-079 — Facebook Login:** opción ocultada en web, iOS y Android para no publicar un acceso roto. Retomar únicamente cuando exista una app Meta apta para autenticación de usuarios finales, con el producto/permisos correctos, dominios, bundle/package y revisión/verificación completados; la app Meta actual deriva al flujo de Business y devuelve errores genéricos de Facebook.

## Completados

### 2026-09-14

- [x] **JH-069 — Validación real de autenticación y uploads:** código integrado y publicado en producción por PR #99, merge `0190a42`; Vercel Ready. Google/sesiones 49/49 y admin/uploads 29/29, typechecks correctos. Home y catálogo HTTP 200; Google sin ID token y upload sin sesión HTTP 401 con Origin válido. El login real con Gmail fue probado correctamente por el responsable; queda cerrado como validado.
- [x] **JH-080 — Tipografía de etiquetas del mapa:** producción generaba cuadrados porque `sharp` intentaba rasterizar Arial en Vercel sin una fuente disponible. Los nombres ahora se convierten con Roboto incluido a trazos SVG antes de crear el PNG, se validaron caracteres acentuados y se incrementó la versión para invalidar cachés iOS/Android.
- [x] **JH-071 — Concurrencia de promociones y entrega push:** los reclamos se serializan por promoción para que cupos, repetición y creación sean atómicos; el canje mantiene su actualización condicional y ahora también valida el inicio de vigencia. Las notificaciones programadas se reclaman con lock recuperable, no se duplican entre workers, reintentan hasta cinco ejecuciones y Expo reintenta fallos transitorios en lotes de 100 tokens.
- [x] **JH-070 — Seguridad y sesión revalidada:** push tokens asociados únicamente desde JWT; cron cerrado si falta o no coincide el secreto; límites por identidad e IP para login, Google, OTP y reenvío de verificación; secreto de email obligatorio; OTP consumido atómicamente; una caída de red al revalidar la app ya no elimina una sesión válida.

### 2026-09-13

- [x] **JH-079 — Preferencias y eventos de notificaciones:** vinculación segura del dispositivo tras iniciar sesión; opt-out publicitario por instalación para invitados; avisos por cambios en moteles favoritos, respuestas y likes de reseñas; preferencia efectiva para promociones generales; retirada de “Nuevos moteles”. Se incorporaron respuesta administrativa y likes de reseñas en web/iOS/Android, y el carrusel recuperó el borde Diamond animado sin sombra.
- [x] **JH-074 — Moderación de reseñas para Google Play:** web, iOS y Android permiten denunciar reseñas ajenas; el backend exige autenticación, evita duplicados y entrega cada caso a la bandeja exclusiva de SUPERADMIN. La administración puede investigar, asignar, documentar, descartar o eliminar la reseña conservando el historial del reporte, y los términos públicos incorporan las normas y el proceso de moderación de contenido generado por usuarios.

### 2026-09-12

- [x] **JH-072 — Error 500 al guardar una imagen del motel:** los logs de producción confirmaron que la carga terminaba correctamente y el `PATCH` posterior reprocesaba sin necesidad la URL de Google Maps, provocando una colisión `P2002` de `googlePlaceId`. El backend ahora consulta Places únicamente si cambia el enlace y responde con conflicto explícito cuando una ficha ya pertenece a otro motel.

### 2026-09-10

- [x] **JH-068 — Cargas y etiquetas del mapa:** los estados de carga principales usan fondo blanco y únicamente el logo al doble de tamaño; los rótulos del mapa ajustan su ancho al nombre e invalidan automáticamente las versiones antiguas.
- [x] **JH-067 — Amenities populares en búsqueda:** eliminados los filtros escritos a mano; app y web muestran los cinco amenities presentes en más moteles activos, calculados por el backend.
- [x] **JH-066 — Resultados completos en el mapa:** la búsqueda móvil recorre todas las páginas del API y envía al mapa el conjunto completo; eliminada además la precarga masiva de detalles que consumía cuota sin interacción.
- [x] **JH-065 — Campana del inicio móvil:** conectada a la pantalla de configuración de notificaciones y completada su identificación accesible.
- [x] **JH-064 — Encabezados del menú móvil:** retirados los iconos decorativos de las categorías y sustituido el fondo lila por una superficie gris neutra de la paleta; la web ya utilizaba el tratamiento neutro equivalente.
- [x] **JH-063 — Cuota y rótulos del mapa móvil:** los PNG del mapa usan una cuota protegida independiente, los errores 429 ya no se reintentan ni se guardan como imágenes y abrir un detalle dejó de duplicar solicitudes; restaurado además el contraste de los accesos del inicio.
- [x] **JH-057 — Descubrimiento y navegación pública:** búsqueda y mapa funcionan como vistas del mismo conjunto filtrado en web, iOS y Android; la navegación conserva el contexto y se redujo la carga inicial del inicio.
- [x] **JH-058 — Ficha pública del motel:** menú agrupado por categorías, secciones navegables y acciones de llamada y WhatsApp persistentes durante la exploración en web y apps.
- [x] **JH-059 — Perfil y accesos personales:** simplificada la navegación, ocultadas las herramientas técnicas hasta solicitarlas, agrupados los controles legales y de datos, eliminados accesos duplicados y normalizado el tono en web, iOS y Android.
- [x] **JH-060 — Operación administrativa:** SUPERADMIN dispone de una bandeja única con aprobaciones, reportes, prospectos, fichas incompletas y problemas de media, con accesos directos a cada resolución.
- [x] **JH-061 — Analítica orientada a decisiones:** Analítica separa rendimiento comercial de tráfico general y Visitantes presenta identidad anónima, recurrencia, plataformas, embudo y recorrido individual.

### 2026-09-02

- [x] **JH-056 — Grilla de ciudades:** el catálogo administrativo presenta las ciudades en una grilla estable de dos columnas, con tarjetas uniformes, nombres flexibles y acciones alineadas; en móviles estrechos utiliza una sola columna.
- [x] **JH-055 — Guardado de prospects manuales:** los campos opcionales vacíos ya no provocan una validación contradictoria y el panel muestra el campo y mensaje concretos ante datos inválidos.
- [x] **JH-054 — Carga flexible de logos:** los logos se aceptan sin mínimo de resolución ni proporción obligatoria y se centran automáticamente, sin recorte ni deformación, en un lienzo cuadrado optimizado.
- [x] **JH-053 — Analytics comercial confiable:** unificadas y deduplicadas las mediciones web/app, separados los entornos, corregidas vistas, contactos, favoritos, conversión por visitante y rankings; el panel SUPERADMIN muestra tendencias, evolución diaria, plataformas, fuentes, ciudades y actividad reciente.
- [x] **JH-052 — Visitantes y embudo unificados:** web, iOS y Android registran instalaciones anónimas, sesiones y eventos deduplicados; la identidad se vincula opcionalmente desde el token y SUPERADMIN dispone de resumen fiable, embudo, plataformas, recorridos e historial individual.

### 2026-09-01

- [x] **JH-051 — Carga flexible de fotos de habitación:** las fotos se aceptan independientemente de su resolución y se ajustan y optimizan automáticamente; 1200×800 queda únicamente como recomendación de calidad.
- [x] **JH-009 — Métricas de reportes:** el SUPERADMIN dispone de período, volumen, abiertos, cerrados, tiempo medio de resolución, motivos frecuentes y moteles con reportes recurrentes.
- [x] **JH-019 — Panel SEO SUPERADMIN:** incorporado panel protegido con indexación declarada, sitemaps, errores, advertencias, impresiones, clics, CTR, consultas, páginas y posiciones; muestra un estado de conexión seguro mientras faltan credenciales externas.

### 2026-08-29

- [x] **JH-023 — Estilos hardcodeados:** los colores semánticos de pantallas activas se centralizaron en el tema; solo permanecen locales las paletas decorativas de ilustraciones.
- [x] **JH-025 — Mensajes móviles:** las pantallas activas dejaron de invocar alertas directamente y todos los diálogos pasan por el helper común.
- [x] **JH-027 — Controles accesibles:** completada la pasada de formularios, switches, botones de icono, estrellas, cards y acciones con nombre, rol, estado y contexto accesible.
- [x] **JH-030 — Bandeja operativa:** creada para SUPERADMIN con aprobaciones, reportes, prospects sin atender, fichas incompletas y problemas de media.
- [x] **JH-031 — Estados editoriales:** el editor distingue cambios sin guardar, guardado exitoso, aprobación, habilitación y visibilidad efectiva en web/apps.
- [x] **JH-032 — Previsualización:** incorporada vista comparativa web 16:9 y app 4:5 para fichas; fotos, promociones y banners conservan sus previews antes de guardar o publicar.
- [x] **JH-033 — Calidad del catálogo:** cada motel tiene un porcentaje calculado sobre ubicación, contacto, portadas, habitaciones, fotos, precios, horarios y amenities, con fecha de última revisión.
- [x] **JH-004 — Datos operativos del reporte:** incorporados responsable, estado, resolución, fecha de cierre y datos de gestión.
- [x] **JH-005 — Bandeja de reportes:** creada la bandeja de reportes con búsqueda, filtros, detalle y estados operativos, visible solo para SUPERADMIN.
- [x] **JH-006 — Gestión del reporte:** implementadas asignación, notas internas, historial y auditoría de cada operación.
- [x] **JH-007 — Auditoría de correcciones:** las ediciones abiertas desde un reporte conservan el ID del reporte origen en el log de auditoría del catálogo.
- [x] **JH-008 — Restricción por motel:** APIs, página y navegación de reportes exigen SUPERADMIN; los administradores de motel no pueden ver ni operar reportes.
- [x] **JH-017 — Auditoría SEO de contenido:** revisadas las rutas públicas, documentada la matriz y añadidos `noindex` a autenticación y áreas personales.
- [x] **JH-026 — Media móvil:** promos, detalle, cards y skeleton usan el resolver y fallback compartidos para imágenes remotas ausentes o fallidas.
- [x] **JH-024 — Navegación móvil:** unificados Inicio, Favoritos y Perfil, iconos activos/inactivos, etiquetas accesibles y nombres compartidos sin cambiar las rutas internas.
- [x] **JH-010 — Canal del prospect:** los dos formularios registran su procedencia como `WEB` o `APP`, y el panel permite su seguimiento por estado; no se agregan campañas ni consentimientos innecesarios.
- [x] **JH-011 — Consistencia visual integral:** unificadas las superficies, tarjetas, formularios, acciones y estados principales de desktop y web móvil con el sistema visual compartido con apps.
- [x] **JH-012 — Adopción de tokens:** agregadas primitivas públicas para página, tarjeta, input, acciones y estados; documentación visual vigente.
- [x] **JH-013 — Estados públicos:** centralizados carga, vacío, error y reintento en búsqueda, favoritos, cercanía y mapa; eliminado el estado de carga duplicado de búsqueda.
- [x] **JH-014 — Autenticación y catálogo:** login, registro, perfil, favoritos, contacto, registro comercial y catálogo usan jerarquía y superficies consistentes.
- [x] **JH-015 — Movimiento reducido:** las animaciones y el scroll de tabs respetan `prefers-reduced-motion`; referencias visuales se ejecutan con movimiento reducido.
- [x] **JH-016 — Accesibilidad web:** incorporados foco visible, objetivos mínimos, nombres y estados accesibles, mensajes anunciables, labels/autocomplete y jerarquía semántica en flujos públicos.
- [x] **JH-034 — Reportes desde catálogo:** implementados en web, iOS y Android con motivos y comentario opcional; la evidencia fue eliminada por decisión de producto.
- [x] **JH-035 — Recomendación de moteles:** implementada en web, iOS y Android solicitando nombre y ciudad.
- [x] **JH-036 — Actualizaciones de apps:** configuración remota, versión mínima/recomendada, modalidad opcional/obligatoria, enlaces y analytics implementados.
- [x] **JH-037 — Contacto y registro comercial:** `/contacto` quedó para soporte y `/registrar-motel` para propietarios.
- [x] **JH-038 — SEO técnico base:** agregados canonicals, sitemap, robots, locale y datos estructurados de sitio, motel, ciudad y breadcrumbs.
- [x] **JH-039 — Estados del mapa:** implementados carga, error recuperable, permisos, vacío general, vacío por filtros y controles responsive.
- [x] **JH-040 — Tema oscuro incompleto:** retirados el contexto, hooks y código sin uso.
- [x] **JH-041 — Sistema visual y media:** creados tokens base, documentación visual, especificaciones, validación y guía de imágenes.
- [x] **JH-042 — Calidad automatizada:** lint integral, pruebas de servicios y componentes, y capturas visuales de referencia incorporadas.
- [x] **JH-043 — Administración base:** formularios extensos divididos, validaciones unificadas, filtros persistentes, paginación, acciones masivas y módulos de media reutilizables.
- [x] **JH-044 — Conectividad móvil:** comportamiento offline, reintentos y errores de red compartidos verificados.

### Completados anteriores

- [x] **JH-045 — Campana web móvil:** funcional u oculta según disponibilidad del flujo.
- [x] **JH-046 — Apple Login:** oculto temporalmente hasta completar su configuración.
- [x] **JH-047 — Placeholder de anuncios:** reemplazado por un recurso local de Jahatelo.
- [x] **JH-048 — ESLint admin:** corregidas las dependencias de `useEffect`.
- [x] **JH-049 — iOS Associated Domains:** Team ID real configurado.
- [x] **JH-050 — Configuración de envío iOS:** `eas.json` preparado sin placeholders inválidos.
