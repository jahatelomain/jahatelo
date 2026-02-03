# Codex resumen (estado actual)

## Ultimo estado
- Admin: infinite scroll en listas (moteles, usuarios, banners, promos, prospects, inbox, audit, financiero, roles, amenities) con hook `useInfiniteScroll`.
- Moteles: variantes de foto principal `featuredPhotoWeb` (16:9) y `featuredPhotoApp` (4:5) + auto-crop al subir y previews en admin.
- Web/App: uso de `featuredPhotoWeb` en web y `featuredPhotoApp` en app (fallback a `featuredPhoto`).
- Script: `scripts/update-coordinates-from-mapurl.js` para actualizar lat/long desde `mapUrl`.
- Next: `turbopack.root` configurado en `web/jahatelo-web/next.config.ts` para evitar root incorrecto.
- DB local (Docker): `jahatelo-postgres` corre en 5433, DB `jahatelo_local` con datos (116 moteles).
- Se alineo el modelo de planes: `FREE/BASIC/GOLD/DIAMOND`. Se elimino `isFinanciallyEnabled` y se paso el control a plan + `isActive` (habilitado/deshabilitado).
- Se bloqueo el acceso a detalles para plan `FREE` en web/app (lista visible, detalle bloqueado).
- Se unifico UX de anuncios: inline abre modal con info + link si existe. En app, listas ahora abren `AdDetailModal`.
- Se elimino `SECTION_BANNER` y se dejo solo `CAROUSEL`, `POPUP_HOME`, `LIST_INLINE` (schema + admin + app + web).
- Web: carrusel ahora mezcla moteles + anuncios `CAROUSEL` con modal; listado promos filtrable con `?promos=1`.
- Web: se agrego pagina `/ciudades` para listar ciudades primero (como en la app). Home enlaza a `/ciudades`.
- Web: botones de favoritos en cards (`MotelCard`) para paridad con app.
- Vercel: `web/jahatelo-web/vercel.json` ya no ejecuta migraciones en build (solo `prisma generate && next build`).
- Prisma: `prisma.config.ts` usa `DIRECT_URL` para migraciones (cuando aplique).
- App: promos con filtro de radio (2/5/10/20/50/Todos) y acceso a promos por ciudad.
- App: skeletons y anuncios inline solo aparecen cuando hay datos reales (evita glitch de carga).
- App: sonidos para favoritos y settings para activar/desactivar sonidos y notificaciones de publicidad.
- Web: anuncios inline y cards de ciudades con estilo alineado al resto del listado.
- Performance: cache de ciudades en web a 5 min, FlatList con `maxToRenderPerBatch`/`initialNumToRender`, Next/Image con `quality=85`.
- Web: se elimino `/motels` y se dejo solo `/search` con nombre "Buscar Moteles"; navbar/footer y links actualizados.
- Web: placeholders de imagen con `motel-placeholder.png` unificados en cards, carrusel y galeria cuando no hay foto.
- Web: orden por plan en `search` y `nearby` (prioriza `DIAMOND`/`GOLD`).
- App/Web: visuales de planes en mapa (pines + badges) y animaciones para planes superiores.
- Seguridad web: CSRF en middleware ajustado para same-origin en prod (Vercel).

## Fixes recientes
- Migraciones legacy corregidas (add_scheduled_notifications, add_payment_history, update_plan/remove_financial_flag) + placeholder `20251117184545_init`.
- Nuevo migration: `20260131160000_add_featured_photo_variants`.
- Se corrigio type error en `app/motels/[slug]/page.tsx` con guard despues de `notFound()`.
- Web ads fetch: se evita parsear HTML como JSON (proteccion de respuesta no JSON).
- TypeScript: `promos` agregado a `searchParams` en `web/jahatelo-web/app/motels/page.tsx`.
- Input de filtros en web con texto negro para legibilidad.
- Imagenes: placeholder en web con calidad balanceada para mejor performance percibida.
- Admin: conteo de "Promociones Activas" usa `promo.isActive` + motel aprobado/activo.
- Auth: se removio Facebook en UI/web/app/docs; solo Google + Apple (iOS) + email/password.

## Cambios de DB (Supabase)
- Migraciones de planes y eliminacion de `SECTION_BANNER` se ejecutaron via SQL Editor (por limitaciones IPv6).

## Estado actual de trabajo (sin commit)
- Publicidad popup: agregados campos `largeImageUrlWeb` y `largeImageUrlApp` en `Advertisement` + migration `20260203180000_add_ad_popup_variants`.
- Admin banners (nuevo y editar): subida base genera variantes 16:9/4:5 + reemplazo manual + previews.
- Web popup usa `largeImageUrlWeb`, app usa `largeImageUrlApp` (fallback a legacy).
- Upload errors ahora muestran mensaje real del backend (faltan credenciales AWS en local).
- Pendiente: **no commiteado** (ver `git status`).

## Tests
- No se corrieron tests recientes en esta etapa.

## Git
- Se hicieron varios commits y pushes durante esta ronda. Ver `git log` si hace falta el detalle.

## Pendientes sugeridos
- Revisar paridad web vs app restante (favoritos como seccion, busqueda con chips rapidos, etc).
- Resolver push notifications en app con development build (Expo Go no soporta push remoto en SDK 53).
- Mejorar visualizacion de amenities en detalles de moteles.
- Tree-shaking de `lucide-react` (hoy se usa import dinamico para iconos de amenities).
- EAS iOS/Android queda pendiente por costo de build.
- OTP WhatsApp + verificacion email + Apple Sign-In: pendiente de credenciales (Meta WABA, proveedor email, Apple Developer).
