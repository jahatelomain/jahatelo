# Codex resumen (estado actual)

## Ultimo estado
### Web
- Detalle de motel sin galeria inferior; hero en header con imagen de fondo.
- Normalizacion de URLs de imagenes para entornos locales (helpers y uso en home/detalle/admin/mobile API).
- Upload local devuelve rutas relativas `/uploads/...`.
- Admin: formularios y previews de imagen normalizan rutas locales; header del detalle usa URL normalizada.
- Admin: errores muestran mensaje real (y redirige a login en 401/403) en detalle de motel.
- CSP: permite `http:` en `img-src` solo en dev para evitar bloqueos de imagen local.
- Soporte: pagina `/soporte` creada con header/footer y link solo en footer/perfil (no en navbar).
### App
- Assets unificados en `app/jahatelo-app/assets` y web usa symlinks; kit de tiendas completo en `kit para subida a stores`.
- Email verification completo (request/verify), SMTP Hostinger, admins exentos de verificacion.
- SMS OTP funcionando con AWS SNS; endpoints mobile/auth/whatsapp.
- Carrusel de destacados solo muestra `isFeatured` (sin fallback a primeros 5).
- Cache deshabilitable en dev; `fetchMotels` y `fetchMotelBySlug` respetan `EXPO_PUBLIC_DISABLE_CACHE`.
- Popup ads con fallback seguro cuando imagen falla.

## Fixes recientes
- Admin Banners: error 500 por columna faltante (`largeImageUrlWeb`) se resolvio aplicando migraciones pendientes en DB local con `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/jahatelo_local" DIRECT_URL="postgresql://postgres:postgres@localhost:5433/jahatelo_local" npx prisma migrate deploy` (migraciones `20260203180000_add_ad_popup_variants` y `20260205190000_add_whatsapp_otp_updated_at`). Supabase ya tenia estas columnas y estaba al dia.
- Validaciones Zod de URLs/imagenes ahora aceptan `/uploads/...` y strings vacios en campos opcionales: anuncios (web/app), promos, fotos de habitaciones, menu items y profilePhoto (mobile).

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

## Tests
- No se corrieron tests recientes.

## Git
- Pendiente hacer commit/push del bloque reciente.

## Pendientes sugeridos
1. Revisar por que AuthProvider no envuelve siempre y evitar fallback permanente.
2. Normalizar URLs de imagen en backend admin API (para no depender del front).
3. Compartir moteles desde detalle/listado.
4. Notificacion in-app de nueva version disponible.
