# Codex resumen (estado actual)

## Ultimo estado
### Web
- Staging activo en Vercel; prod y staging usan la misma DB y bucket (por ahora).
- Uploads en staging/prod usan S3; en dev hay fallback local si faltan creds o `UPLOADS_USE_LOCAL=1`.
- Se corrigio el truncado de URLs S3 en admin de moteles (no se fuerza `/uploads/...` si ya es URL https).
- Cache-busting de imagenes: anuncios y promos agregan `?v=updatedAt`; API mobile agrega `Cache-Control: no-store`.
- `touchMotel()` se ejecuta al crear/editar/borrar rooms, room-photos, menu-categories, menu-items y promos.
- Admin: scroll al formulario al editar habitacion (para evitar “queda abajo”).
- Publico: link del FeaturedCarousel ya es clickeable en toda la tarjeta (overlays no bloquean clicks).
- Logos publicos/registro/login: estaban duplicados por symlinks en `public/`; se reemplazaron por archivos reales.

### App
- Expo usa API dinamica basada en `hostUri` (sin IP fija); se puede forzar con `EXPO_PUBLIC_API_URL`.
- Cache invalidation de promos/ads: URLs con `?v=updatedAt` + fetch con `?_t=Date.now()` para evitar cache HTTP.
- Carrusel de destacados consulta `isFeatured=true&limit=50` (igual a web).
- Splash: `hideAsync()` se llama cuando el Lottie ya esta montado (sin flash blanco).

## Fixes recientes (ya pusheados a staging)
- Migraciones pendientes aplicadas a DB local (columnas de ads y whatsapp OTP).
- Validaciones Zod aceptan `/uploads/...` y strings vacios en campos opcionales (ads/promos/room-photos/menu items/profilePhoto).
- Fallback local de uploads en dev + S3 en prod.
- Admin banners/promos: fechas opcionales aceptan YYYY-MM-DD y URLs relativas.
- Normalizacion de URLs en APIs para anuncios y mobile.
- Favoritos mobile devuelve datos frescos desde DB (incluye habitaciones/amenities/promos).
- `touchMotel()` propagado a entidades hijas (rooms, room-photos, menu, promos).
- Amenidades mobile: ahora vienen de habitaciones activas (no solo `motelAmenities`).

## Configuracion de DB por entorno (web)

| Entorno | Archivo | DATABASE_URL |
|---------|---------|-------------|
| Dev local | `.env.local` | `postgresql://postgres:postgres@localhost:5433/jahatelo_local` |
| Produccion / Vercel | `.env` | Supabase pooler (`aws-0-us-west-2.pooler.supabase.com:6543`) |
| CLI Prisma (migrate, studio) | `.env` via `dotenv/config` | Supabase (DIRECT_URL) |

**Regla**: Next.js dev carga `.env.local` con prioridad sobre `.env`. El CLI de Prisma usa `.env` salvo que se pase `DATABASE_URL=...` inline.

**Comandos para aplicar migraciones en DB local** (cuando hay pendientes):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/jahatelo_local" DIRECT_URL="postgresql://postgres:postgres@localhost:5433/jahatelo_local" npx prisma migrate deploy
```

## Pendientes en working tree (sin commit)
- App: `screens/motelDetail/RoomsTab.js` (amenities en circulos + tooltip con long press).
- App: `services/googleAuthService.js` (AuthSession.makeRedirectUri, proxy Expo Go, client IDs nativos).
- Web: mover amenities a nivel rooms (nearby/search/page/motel detail/admin amenities) y limpiar `motelAmenities`.
- Web: cambios de UI/orden en cards/public pages (MotelCard/AdInlineCard/Nearby/Search).
- Web: logo publico/registro/login reparado (archivos reales en `public/` en lugar de symlinks).
- Archivo sin trackear: `Fotos/freixenet-logo.png` (definir si se commitea).

## Tests
- No se corrieron tests recientes.

## Notas
- Si se quiere amenities a nivel motel (no solo habitaciones), hay que agregar UI y mapeo separado.
