# Diagnostico profundo + plan full (SEO)

Basado en el estado actual del repo `web/jahatelo-web` (analisis de codigo, sin crawl externo).

## Diagnostico profundo (SEO tecnico + on-page + estructura)

### 1) SEO tecnico (estado actual)
- No hay `sitemap.xml` ni `robots.txt` generados (faltan `app/sitemap.ts` y `app/robots.ts`). Esto limita indexacion y crawling eficiente.
- Metadata global existe en `web/jahatelo-web/app/layout.tsx`, pero casi no hay metadata por pagina (solo `mapa` y `registrar-motel`). Falta `generateMetadata` en paginas clave.
- No hay `canonical` definido; en rutas con filtros (`/motels?city=...`) esto puede generar duplicados.
- `metadataBase` apunta a `https://jahatelo.vercel.app` en `web/jahatelo-web/app/layout.tsx`. Si el dominio real es otro, se pierde autoridad.
- JSON-LD existe solo en detalle de motel (`web/jahatelo-web/app/motels/[slug]/page.tsx`), pero no en home, listados o paginas de ciudad.
- No hay `hreflang` (si apuntan a multiples paises, falta).
- PWA esta presente, pero no afecta SEO si falta el resto.

### 2) On-page SEO (titulos, descriptions, intencion de busqueda)
- Title/description global es generico. No estan optimizados para busquedas locales ("moteles en [ciudad]", "motel cerca de mi", etc.).
- No hay titles/descriptions unicos en paginas clave: `/motels`, `/motels/[slug]`, `/ciudades`, `/mapa`, `/nearby`, `/mis-favoritos`, `/search`.
- Falta copy con keywords reales en home y listados; el texto actual es corto y poco especifico.

### 3) SEO estructural (URLs y arquitectura)
- URLs estan bien (clean). Pero no hay arquitectura de ciudad/barrio optimizada (ej: `/ciudades/asuncion`, `/ciudades/asuncion/centro`).
- Los filtros estan en query params, lo que hace dificil rankear por ciudad/barrio con landings indexables.

### 4) Contenido y autoridad
- Falta contenido editorial: FAQs, guias por ciudad, comparativas, "mejores moteles en X".
- No hay "Entidad Marca" completa (Organization/LocalBusiness con address/phone/socials) salvo JSON-LD de motel.

### 5) Enlazado interno
- No hay estrategia de enlaces internos. Esto reduce autoridad hacia paginas importantes.

### 6) Performance
- Hay optimizaciones (Next/Image, cache 5 min). Sin medicion real, pero se ve aceptable. Falta controlar LCP/CLS en home y detalle.

## Plan full SEO (prioridad alta -> baja)

### Fase 1: SEO tecnico imprescindible (1-2 dias)
1) Generar `sitemap.xml` y `robots.txt` via Next:
   - `app/sitemap.ts` para listar:
     - `/`
     - `/motels`
     - `/ciudades`
     - `/mapa`
     - `/motels/[slug]` (desde DB)
   - `app/robots.ts` para permitir indexar solo publico y bloquear `/admin`, `/api`, `/login`, `/register`, etc.
2) Definir `metadataBase` al dominio real (no Vercel).
3) Agregar `generateMetadata` dinamico:
   - `app/motels/[slug]/page.tsx`: title con nombre + ciudad.
   - `app/motels/page.tsx`: si hay `city`/`search`, title/description dinamico.
   - `app/ciudades/page.tsx`: title y description enfocadas a "moteles por ciudad".
4) Canonical:
   - Base canonical para rutas principales.
   - Para filtros: canonical a `/motels` o a landing de ciudad si existe.

### Fase 2: SEO semantico (1-2 dias)
1) JSON-LD adicional:
   - Home: `Organization` + `WebSite` + `SearchAction`.
   - Listado: `BreadcrumbList`.
   - Ciudades: `ItemList` de ciudades.
2) Rich snippets en detalle de motel:
   - `LodgingBusiness` ya existe, pero agregar `priceRange`, `address` mas completo, `geo` si existe.

### Fase 3: SEO de contenido (ongoing)
1) Crear landings indexables por ciudad:
   - `/ciudades/[slug]` con listado y texto optimizado.
2) Crear FAQ y contenido editorial:
   - "Como elegir motel en [ciudad]"
   - "Moteles con jacuzzi en [ciudad]"
   - "Moteles baratos en [ciudad]"
3) Optimizar copy de home y listados con keywords reales.

### Fase 4: Analitica y monitoreo
1) Conectar Google Search Console (verificar dominio).
2) Generar un dashboard basico de:
   - paginas indexadas
   - top queries
   - CTR y posicion

## Datos necesarios para afinar 100%
1) Dominio real de la web (no Vercel).
2) Pais/ciudad principal objetivo (ej: Paraguay, Asuncion).
3) 5 keywords principales que quieren rankear (ej: "moteles en asuncion", "motel cerca de mi", etc.).
