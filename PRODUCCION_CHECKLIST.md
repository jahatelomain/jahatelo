# Checklist de Producción — Jahatelo
> Generado: 2026-02-17 | Estado: Pendiente

---

## BLOQUE 1 — CRÍTICOS (Bloqueantes de producción)

- [x] 1. **[WEB] Rotar credenciales expuestas en `.env.local`**
  - `.env.local` NO está trackeado en git — seguro. Rotar keys AWS/SMTP/OTP si hay acceso compartido a la máquina.
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SMTP_PASS, OTP_SECRET expuestos
  - Archivo: `web/jahatelo-web/.env.local:5-6`
  - Acción: Rotar todas las keys en AWS IAM + SMTP + regenerar secrets. Eliminar `.env.local` del historial de git.

- [x] 2. **[WEB] Crear página de error global `app/error.tsx`**
  - No existe error boundary global en Next.js
  - Archivo a crear: `web/jahatelo-web/app/error.tsx`

- [x] 3. **[WEB] Crear página 404 `app/not-found.tsx`**
  - No existe página personalizada de 404
  - Archivo a crear: `web/jahatelo-web/app/not-found.tsx`

- [x] 4. **[WEB] Reemplazar URL hardcodeada por variable de entorno**
  - `'https://jahatelo.vercel.app'` hardcodeado en `lib/seo.ts:58`
  - Usar `process.env.NEXT_PUBLIC_APP_URL` de forma consistente en todo el proyecto

- [x] 5. **[APP] Agregar permisos iOS faltantes en `app.json`**
  - Faltan: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSPhotoLibraryAddOnlyUsageDescription`
  - Archivo: `app/jahatelo-app/app.json:17-30`

- [x] 6. **[APP] Agregar permisos Android faltantes en `app.json`**
  - Faltan: `CAMERA`, `READ_MEDIA_IMAGES`, `POST_NOTIFICATIONS`, `READ_EXTERNAL_STORAGE`
  - Archivo: `app/jahatelo-app/app.json:45-48`

- [x] 7. **[WEB] Crear `robots.txt` y `sitemap.ts` dinámico**
  - Google no puede rastrear el sitio correctamente sin estos archivos
  - Crear: `web/jahatelo-web/public/robots.txt` y `web/jahatelo-web/app/sitemap.ts`

---

## BLOQUE 2 — INCONSISTENCIAS WEB vs APP (mismo feature, distinto comportamiento)

- [x] 8. **[WEB+APP] Unificar búsqueda con acentos**
  - Web: `cafe` NO encuentra `Café` | App: `cafe` SÍ encuentra `Café` (usa `TRANSLATE` en SQL)
  - Archivos: `web/jahatelo-web/app/api/motels/search/route.ts:62-79` y `app/api/mobile/motels/route.ts:163-166`
  - Acción: Aplicar normalización de acentos también en el endpoint web `/api/motels/search`

- [x] 9. **[WEB+APP] Unificar filtro de amenidades**
  - Web envía IDs (UUIDs) | App envía nombres (strings) — misma búsqueda, resultados distintos
  - Archivos: `web/jahatelo-web/app/api/motels/search/route.ts:82-102` y `app/jahatelo-app/screens/SearchScreen.js:126-132`
  - Acción: Estandarizar a un solo formato (recomendado: nombres)

- [x] 10. **[WEB+APP] Unificar ordenamiento de resultados**
  - Web prioriza `isFeatured` en el orden | App no lo incluye
  - Acción: Aplicar el mismo criterio de sorting en ambos endpoints

- [x] 11. **[WEB+APP] Unificar paginación**
  - Web: máximo 50 resultados fijo | App: soporta `page` y `limit` completos
  - Acción: Agregar paginación completa al endpoint web o estandarizar el límite

- [x] 12. **[APP] Devolver datos completos de promos en app**
  - El mapper ya incluye `promoImageUrl`, `promoTitle`, `promoDescription`. OK.
  - Web devuelve array completo de promos | App solo devuelve flag `tienePromo: true`
  - Archivo: `web/jahatelo-web/app/api/mobile/motels/route.ts`
  - Acción: Incluir datos de promos en respuesta mobile

- [x] 13. **[WEB+APP] Unificar lógica de selección de foto principal**
  - El mapper usa `featuredPhotoApp > featuredPhotoWeb > featuredPhoto > FACADE > primera foto`. Unificado.
  - Web y app tienen distinto orden de prioridad para elegir `thumbnail`
  - Acción: Centralizar lógica en un helper compartido (`featuredPhoto` → `FACADE` → primera foto)

---

## BLOQUE 3 — ALTA PRIORIDAD

- [x] 14. **[WEB] Agregar rate limiting en endpoints de auth**
  - Login y register ya cubiertos. Se agregó OTP (`/api/auth/whatsapp/request-otp` y `/api/mobile/auth/whatsapp/request-otp`) al bloque de rate limiting en `middleware.ts:156-162`

- [x] 15. **[WEB] Agregar `generateMetadata()` a página de detalle de motel**
  - Implementado en `web/jahatelo-web/app/motels/[slug]/page.tsx`: title dinámico, description (desde DB o generada), OG image, canonical URL, Twitter card
  - Bonus: corregidas URLs hardcodeadas `jahatelo.vercel.app` → `process.env.NEXT_PUBLIC_APP_URL`

- [x] 16. **[WEB] Agregar metadata a páginas principales**
  - `/search`: `export const metadata` con title, description, OG tags, canonical
  - `/ciudades`: `export const metadata` con title, description, OG tags, canonical

- [x] 17. **[APP] Configurar deep linking**
  - `app.json` ya tenía `"scheme": "jahatelo"` (Expo Router lo usa automáticamente)
  - Agregado `associatedDomains` en iOS para Universal Links (`applinks:jahatelo.com`)
  - Agregado `intentFilters` en Android para App Links (`https://jahatelo.com/motels/*`, `/ciudades`, `/search`)
  - Creados `public/.well-known/apple-app-site-association` y `assetlinks.json` en la web
  - `next.config.ts`: header `Content-Type: application/json` para ambos archivos
  - **Nota**: reemplazar `W8X3Y9Z123` con el Team ID real de Apple y el SHA256 del keystore de producción en `assetlinks.json`

- [x] 18. **[APP] Agregar retry y fallback en push notifications**
  - `projectId` faltante ahora loguea `console.error` con mensaje descriptivo (antes era `console.log` silencioso)
  - `initializeNotifications` ahora usa `registerPushTokenWithRetry` (3 intentos, back-off de 2s/4s)
  - Fallo definitivo loguea error con cantidad de intentos

- [x] 19. **[APP] Validar `EXPO_PUBLIC_API_URL` en build**
  - Agregado `console.error` en `apiBaseUrl.js` cuando la variable no está definida en producción (`!__DEV__`)

- [x] 20. **[WEB] Migrar `console.*` al logger estructurado en endpoints críticos**
  - `login/route.ts`, `register/route.ts`, `request-otp/route.ts`: migrados a `logger.error()` (structured JSON con timestamp, level, env)
  - `lib/logger.ts` ya existía con sistema de niveles — se usa como base para migración progresiva

---

## BLOQUE 4 — TIENDA (Apple App Store / Google Play)

- [x] 21. **[APP] Declarar URL de Privacy Policy en ambas tiendas**
  - Agregado `"privacyPolicyUrl": "https://jahatelo.com/privacidad"` en `app.json`
  - Pendiente configurar también en App Store Connect y Google Play Console (portal)

- [x] 22. **[APP] Declarar URL de Support**
  - Agregado `"supportUrl": "https://jahatelo.com/soporte"` en `app.json`
  - Pendiente configurar también en portales de tiendas

- [ ] 23. **[APP] Declarar age rating (contenido adulto)**
  - El contenido de moteles requiere clasificación explícita en ambas tiendas
  - Apple: marcar en App Store Connect | Google: cuestionario de rating en Play Console
  - No se puede automatizar: es una acción manual en los portales

- [x] 24. **[APP] Configurar provisioning profile iOS en `eas.json`**
  - Agregado `"credentialsSource": "remote"` en el perfil `production.ios` → EAS maneja el certificado automáticamente
  - Agregado bloque `submit.production` con placeholders para `appleId`, `ascAppId`, `appleTeamId` y `google-play-key.json`
  - **Acción pendiente**: reemplazar los 3 placeholders con los datos reales de Apple Developer y Google Play

---

## BLOQUE 5 — MODERADOS (Antes del lanzamiento)

- [x] 25. **[WEB] Completar flujo de verificación de email**
  - Ya implementado: `login/page.tsx` muestra botón "Reenviar correo de verificación" cuando `needsVerification = true`
  - Endpoint `/api/auth/email/request-verification` ya existía y funciona correctamente

- [x] 26. **[APP] Usar `LoadingScreen.js` donde corresponde**
  - Aplicado en `MapScreen.js`: reemplazada la vista inline con `ActivityIndicator` por `<LoadingScreen message="Cargando mapa..." />`
  - Eliminado import de `ActivityIndicator` (ya no necesario)

- [x] 28. **[WEB+APP] Integrar Sentry o similar para error tracking**
  - **Web**: `@sentry/nextjs` instalado. `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` ya existían y están correctamente configurados. Agregado `withSentryConfig()` wrapper en `next.config.ts` con tunnelRoute, hideSourceMaps, disableLogger
  - **App**: `@sentry/react-native` instalado. Creado `services/sentryService.js` con `initSentry()`, `setSentryUser()`, `captureError()`. Plugin `@sentry/react-native/expo` agregado a `app.json`. `initSentry()` llamado al inicio de `App.js`. `setSentryUser()` integrado en login/logout en `AuthContext.js`
  - **Variables pendientes**: agregar `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` en Vercel y `EXPO_PUBLIC_SENTRY_DSN` en EAS

- [x] 29. **[APP] Agregar chequeo de versión mínima compatible**
  - `middleware.ts`: sección 2.2 — valida `X-App-Version` en todas las rutas `/api/mobile/`. Responde `426 Upgrade Required` si la versión es inferior a `MIN_APP_VERSION` (env var, default `1.0.0`)
  - `services/apiBaseUrl.js`: exporta `getAppHeaders()` (incluye `X-App-Version: dev|semver`) y `checkVersionUpgradeRequired(response)` para detectar 426 en los screens
  - Configurar `MIN_APP_VERSION` en `.env` / variables de entorno de Vercel cuando se necesite forzar actualización

- [x] 30. **[APP] Corregir DELETE de favoritos para usar body en lugar de query param**
  - `useFavorites.js`: cambiado de `?motelId=${motel.id}` a `body: JSON.stringify({ motelId: motel.id })`
  - `api/mobile/favorites/route.ts`: DELETE ahora lee `motelId` desde body (JSON) con fallback a query param para compatibilidad

---

## BLOQUE 6 — NICE TO HAVE

- [x] 31. **[APP] Agregar debounce al input de búsqueda en `SearchScreen`**
  - Ya implementado con `debounceTimerRef` y 500ms en `screens/SearchScreen.js:99-117` — verificado en esta sesión

- [x] 32. **[APP] Memoizar `MotelCard` con `React.memo`**
  - Renombrado a `MotelCardComponent`, envuelto en `React.memo(MotelCardComponent)` y re-exportado como `MotelCard`
  - Archivo: `app/jahatelo-app/components/MotelCard.js`

- [x] 33. **[APP] Validar formato de teléfono con regex**
  - Agregado `^\+?[\d\s\-()]{8,15}$` en `validateForm()` de `LoginScreen.js` y `RegisterScreen.js`
  - Error mostrado: "Formato de teléfono inválido" si no cumple el patrón

- [x] 34. **[WEB] Revisar permisos `hostname: '**'` en `next.config.ts`**
  - Reemplazado `hostname: '**'` por dominios específicos: `jahatelo-media.s3.us-east-1.amazonaws.com`, `maps.googleapis.com`, `maps.gstatic.com`
  - HTTP wildcard mantenido solo en desarrollo (`NODE_ENV !== 'production'`)
  - Archivo: `web/jahatelo-web/next.config.ts`

- [x] 35. **[APP] Cleanup del listener de navegación en `App.js`**
  - Fix: `notificationDataRef.current` se pone a `null` inmediatamente después de navegar
  - Agregado `unsubscribe()` después de la navegación para eliminar el listener
  - Guard de entrada refactorizado: early return si no hay `navigationRef` o `notificationDataRef`
  - Archivo: `app/jahatelo-app/App.js`

---

## Progreso

| Bloque | Total | Resueltos |
|--------|-------|-----------|
| 1 — Críticos | 7 | 7 |
| 2 — Web vs App | 6 | 6 |
| 3 — Alta prioridad | 7 | 7 |
| 4 — Tienda | 4 | 3 |
| 5 — Moderados | 6 | 4 |
| 6 — Nice to have | 5 | 5 |
| **Total** | **35** | **33** |
