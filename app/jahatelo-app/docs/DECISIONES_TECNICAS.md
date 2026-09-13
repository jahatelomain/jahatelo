# Registro de decisiones técnicas de Jahatelo

Este documento registra funcionalidades, integraciones y enfoques técnicos que se incorporan, sustituyen, desactivan o retiran. Su objetivo es conservar el motivo de cada decisión y evitar que una solución descartada vuelva a implementarse sin revisar el problema original.

## Cómo registrar una decisión

Cada baja o sustitución debe indicar:

- fecha y estado;
- alcance y plataformas afectadas;
- qué se cambió;
- motivo y evidencia disponible;
- alternativa vigente;
- condiciones necesarias para reconsiderarla;
- commits, incidencias o pendientes relacionados.

## DT-001 — Retiro del clustering manual del mapa móvil

- **Estado:** retirado; no reintroducir sin una nueva evaluación técnica.
- **Incorporado:** 7 de julio de 2026, commit `c024b70`.
- **Retirado:** 19 de agosto de 2026, commit `b7a7290`.
- **Alcance:** aplicación móvil iOS y Android, pantalla del mapa.
- **Qué hacía:** agrupaba moteles cercanos según el nivel de zoom y mostraba un marcador con la cantidad de resultados. Al tocarlo, acercaba la vista.
- **Motivo del retiro:** estaba implementado manualmente mediante vistas React dentro de los marcadores. En Google Maps iOS esas vistas requieren rasterización y redibujos costosos durante zoom y desplazamiento. La implementación también mantenía comportamiento específico por plataforma, aumentando complejidad e inconsistencias.
- **Alternativa adoptada:** pines individuales nativos, sin animaciones continuas en iOS. Posteriormente se sustituyeron las vistas personalizadas por imágenes PNG locales o cacheadas.
- **Situación actual:** el mapa no debe bloquear su apertura mientras descarga una imagen de etiqueta por motel. Primero muestra pines locales y completa las etiquetas en segundo plano.
- **Condiciones para reconsiderarlo:** usar clustering soportado por el SDK o una librería compatible con las versiones actuales de React Native, Google Maps y ambas arquitecturas; medir tiempo de apertura, fluidez, consumo de memoria y comportamiento en dispositivos físicos iOS/Android; conservar jerarquía por plan y navegación correcta al ampliar.
- **No hacer:** copiar nuevamente el algoritmo manual de `c024b70` sin pruebas comparativas y validación física.

## DT-002 — Retiro temporal de Sentry

- **Estado:** retirado de web y apps; no reinstalar hasta aprobar su operación.
- **Fecha:** 13 de septiembre de 2026.
- **Alcance:** web pública, panel administrativo, backend y aplicaciones móviles.
- **Qué cambió:** se eliminaron los SDK, archivos de configuración, wrappers de build, llamadas y mocks de Sentry. La página global de error conserva registro local limitado y la operación continúa con logs estructurados de servidor, logs de Vercel, auditoría, analytics propios y el endpoint de salud.
- **Motivo:** la cuenta no está activa por decisión de producto y presupuesto. Mantener una integración sin DSN, alertas ni responsable agregaba dependencias, peso, telemetría del proceso de build y documentación engañosa sin aportar monitoreo real.
- **Evidencia:** los builds advertían que no existía token de autenticación ni carga de source maps; el pendiente `JH-002` ya estaba pausado.
- **Alternativa vigente:** `lib/logger.ts`, logs de Vercel, `AuditLog`, métricas propias y `/api/health`.
- **Condiciones para reconsiderarlo:** presupuesto aprobado, cuenta activa, responsable operativo, política de retención y privacidad revisada, filtrado de datos sensibles, alertas definidas y pruebas de recepción en staging y producción.
- **No hacer:** reinstalar el paquete o copiar configuraciones históricas sin completar primero esas condiciones.

## DT-003 — Splash nativo Android sin logotipo intermedio

- **Estado:** activo.
- **Fecha:** 13 de septiembre de 2026.
- **Alcance:** aplicación Android, arranque en frío.
- **Qué cambió:** el splash obligatorio del sistema conserva el fondo blanco, pero usa un recurso transparente antes de montar el splash animado de Jahatelo.
- **Motivo:** Android 12 o posterior siempre presenta una pantalla nativa de arranque. Mostrar allí el icono y luego iniciar la animación generaba dos apariciones distintas del logo, a diferencia del flujo continuo de iOS.
- **Alternativa vigente:** transición de fondo blanco directamente al splash animado compartido. Un plugin local reaplica el recurso transparente cuando Expo regenera el proyecto Android.
- **Condiciones para reconsiderarlo:** sustituirlo solo si el splash animado deja de existir o si una nueva implementación nativa permite una continuidad visual comprobada en Android físico.
- **No hacer:** volver a configurar `splashscreen_logo` como `windowSplashScreenAnimatedIcon` sin revisar el doble logo en un arranque en frío.

## Plantilla

### DT-XXX — Título de la decisión

- **Estado:** propuesta, activa, sustituida, desactivada o retirada.
- **Fecha:** AAAA-MM-DD.
- **Alcance:** módulos y plataformas.
- **Qué cambió:** descripción concreta.
- **Motivo:** problema, restricción o decisión de producto.
- **Evidencia:** métricas, errores, pruebas o comentarios relevantes.
- **Alternativa vigente:** comportamiento actual.
- **Condiciones para reconsiderarlo:** requisitos mínimos.
- **Referencias:** commits, incidencias y puntos de `PENDIENTES.md`.
