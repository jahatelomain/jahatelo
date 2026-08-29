# Auditoría SEO de contenido

Revisión del 29 de agosto de 2026. Las rutas públicas de adquisición tienen título, descripción, canonical y contenido HTML indexable. Las áreas personales y de autenticación se excluyen de indexación.

| Ruta | Intención | Indexación | Metadata |
| --- | --- | --- | --- |
| `/` | Descubrir moteles, ciudades y promociones | Sí | Metadata global y datos estructurados de sitio |
| `/search` | Buscar por nombre, ciudad y atributos | Sí | Título, descripción, canonical y Open Graph |
| `/ciudad/[ciudad]` | Descubrir oferta local | Sí | Metadata dinámica, canonical y breadcrumbs |
| `/motels/[slug]` | Consultar una ficha | Sí | Metadata dinámica, canonical y datos de motel |
| `/mapa` | Explorar geográficamente | Sí | Título, descripción y canonical |
| `/nearby` | Encontrar oferta cercana | Sí | Título, descripción y canonical |
| `/contacto` | Soporte | Sí | Título, descripción y canonical |
| `/registrar-motel` | Captación comercial | Sí | Título, descripción, canonical y Open Graph |
| `/privacidad`, `/terminos`, `/soporte`, `/eliminar-cuenta` | Información legal y soporte | Sí | Metadata propia y contenido rastreable |
| `/login`, `/register` | Autenticación | No | `noindex, nofollow` |
| `/perfil`, `/mis-favoritos`, `/notificaciones` | Área personal | No | `noindex, nofollow` |

## Criterios vigentes

- Los títulos identifican la intención y la marca sin repetir texto genérico.
- Las descripciones resumen el beneficio real de cada página.
- Las páginas de ciudad y motel conservan metadata dinámica basada en el catálogo.
- Las búsquedas útiles, fichas, ciudades, mapa y cercanía permanecen indexables.
- Las pantallas privadas o sin valor autónomo para buscadores no se indexan.
