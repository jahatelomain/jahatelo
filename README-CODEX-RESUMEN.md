# Codex resumen (estado actual)

## Ultimo estado
- Se alineo el modelo de planes: `FREE/BASIC/GOLD/DIAMOND`. Se elimino `isFinanciallyEnabled` y se paso el control a plan + `isActive` (habilitado/deshabilitado).
- Se bloqueo el acceso a detalles para plan `FREE` en web/app (lista visible, detalle bloqueado).
- Se unifico UX de anuncios: inline abre modal con info + link si existe. En app, listas ahora abren `AdDetailModal`.
- Se elimino `SECTION_BANNER` y se dejo solo `CAROUSEL`, `POPUP_HOME`, `LIST_INLINE` (schema + admin + app + web).
- Web: carrusel ahora mezcla moteles + anuncios `CAROUSEL` con modal; listado promos filtrable con `?promos=1`.
- Web: se agrego pagina `/ciudades` para listar ciudades primero (como en la app). Home enlaza a `/ciudades`.
- Web: botones de favoritos en cards (`MotelCard`) para paridad con app.
- Vercel: `web/jahatelo-web/vercel.json` ya no ejecuta migraciones en build (solo `prisma generate && next build`).
- Prisma: `prisma.config.ts` usa `DIRECT_URL` para migraciones (cuando aplique).

## Fixes recientes
- Web ads fetch: se evita parsear HTML como JSON (proteccion de respuesta no JSON).
- TypeScript: `promos` agregado a `searchParams` en `web/jahatelo-web/app/motels/page.tsx`.
- Input de filtros en web con texto negro para legibilidad.

## Cambios de DB (Supabase)
- Migraciones de planes y eliminacion de `SECTION_BANNER` se ejecutaron via SQL Editor (por limitaciones IPv6).

## Tests
- No se corrieron tests recientes en esta etapa.

## Git
- Se hicieron varios commits y pushes durante esta ronda. Ver `git log` si hace falta el detalle.

## Pendientes sugeridos
- Verificar en prod: `/motels?promos=1`, carrusel ads con modal, favoritos en cards, `/ciudades`.
- Revisar paridad web vs app restante (favoritos como seccion, busqueda con chips rapidos, etc).
- Resolver push notifications en app con development build (Expo Go no soporta push remoto en SDK 53).
- Mejorar visualizacion de amenities en detalles de moteles.
