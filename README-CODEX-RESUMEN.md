# Codex resumen (estado actual)

## Estado general (staging)
- Rama actual sincronizada: `staging` = `origin/staging`.
- Ultimo commit en staging: `16ca4c3`.
- Working tree limpio al cerrar este resumen.

## Guardrails de release (staging -> main -> produccion)
- Deploy de produccion en Vercel bloqueado si no viene de rama permitida (`main`) via `web/jahatelo-web/scripts/enforce-production-branch.js`.
- Workflow activo: `.github/workflows/enforce-main-from-staging.yml` para permitir PR a `main` solo desde `staging`.
- Branch protection en `main` ya se uso con check requerido `enforce-source-branch`.

## Web (jahatelo-web) - cambios relevantes vigentes
- SEO ampliado:
  - rutas por ciudad/barrio, canonical, sitemap extendido y schemas JSON-LD.
  - meta principal ajustable para SERP.
- Login Google incorporado en flujo web y CSP ajustado para dominios de Google.
- Middleware de staging con gate de acceso activo (Basic Auth custom via middleware).
- Admin banners:
  - toggle rapido Activo/Pausado en tabla (sin depender del menu de acciones).
  - backend ya filtra solo `status: ACTIVE` en API publica de anuncios.
- Analytics:
  - se hicieron ajustes para evitar contaminar metricas con rutas de admin (pendiente seguir refinando segmentacion por entorno si se requiere total separacion historica).

## App mobile (jahatelo-app) - cambios recientes vigentes
- Se estabilizo acceso a staging en app:
  - popup de credenciales staging,
  - interceptor para header `Authorization` en requests a staging,
  - manejo de timeout/retry unificado.
- Sentry desactivado temporalmente en la app para evitar friccion de build local.
- Home en caso de 0 moteles:
  - ya no queda spinner infinito,
  - muestra estado vacio,
  - mantiene publicidades (carrusel/popup) y boton de reintento.
- Search:
  - ahora mezcla anuncios inline con resultados.
- Branding app:
  - iconos/splash actualizados en assets y `app.json`.

## Orden/prioridad de contenido (estado actual)
- Fotos de habitaciones:
  - ya tienen drag & drop y persistencia de `order`.
  - fix reciente: al agregar foto nueva entra al final, y al borrar se reindexa el orden para evitar huecos/desorden.
- Habitaciones (como entidades):
  - aun no tienen un campo `order` dedicado para definir prioridad de aparicion entre habitaciones.
- Fotos generales del motel:
  - el modelo `Photo` tiene `order`, pero falta confirmar UI/admin drag-and-drop completo para ese bloque si se quiere mismo nivel que room photos.

## Commits recientes (contexto inmediato)
- `16ca4c3` chore(app): add remaining local simulator and asset files
- `fa04af9` fix(admin-room-photos): preserve drag order on add and delete
- `3b77c81` chore(app): refresh iOS branding icons and splash asset
- `809398d` feat(app): unify fetch timeout and inject inline ads in search
- `3257d47` fix(app-home): show ads and popup when motel list is empty
- `1047c37` fix(staging): stabilize mobile auth/loading and remove sentry from app

## Comandos operativos base (cortos)
- Push normal: `git push origin staging`
- Web typecheck manual: `cd web/jahatelo-web && npx tsc --noEmit`
- App dev client: `cd app/jahatelo-app && npx expo start --dev-client --clear`

## Pendiente recomendado (proximo bloque)
1. Implementar orden de habitaciones (campo + drag/drop en admin + orderBy en APIs publicas).
2. Revisar orden drag/drop para fotos generales de motel en admin (si no esta expuesto aun).
3. Opcional: separar completamente analytics por entorno (staging vs produccion) en almacenamiento/reportes.
