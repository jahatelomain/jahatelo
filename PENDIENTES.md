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

### Preparación para producción

- [ ] **JH-001 — Android App Links:** completar el SHA256 del certificado Android de producción en `web/jahatelo-web/public/.well-known/assetlinks.json` y validarlo en un dispositivo físico.
- [ ] **JH-003 — Enlaces universales:** validar universal links y app links contra los archivos publicados en producción, iOS y Android físicos. La navegación y los dominios ya están configurados.

### SEO y adquisición

- [ ] **JH-018 — Google Search Console:** configurar una identidad técnica con permisos mínimos y guardar sus credenciales únicamente como secretos.
- [ ] **JH-020 — Operación de Search Console:** documentar revocación, rotación de credenciales y responsable operativo.

### Mapa web

- [ ] **JH-021 — Configuración externa del mapa:** verificar en Google Cloud la API key, restricciones, Map ID, estilo vectorial, facturación y dominios; confirmar si esto origina el fondo gris.
- [ ] **JH-022 — Validación real del mapa:** la ruta de producción responde HTTP 200 y se verificó su render automatizado; falta confirmar ubicación y gestos en dispositivos físicos iOS/Android y resolver cualquier hallazgo.

### Aplicaciones iOS y Android

- [ ] **JH-028 — Texto ampliado:** la revisión de código ya retiró cortes de una línea, preserva escalado y scroll en formularios; falta ejecutar y registrar la matriz con el tamaño máximo en dispositivos físicos.
- [ ] **JH-029 — Lectores de pantalla:** ejecutar la matriz documentada con VoiceOver y TalkBack en dispositivos físicos.

### Panel administrativo


## En pausa

- [ ] **JH-002 — Sentry:** pausado por decisión de producto hasta disponer de presupuesto para el servicio.

## Completados

### 2026-09-02

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
