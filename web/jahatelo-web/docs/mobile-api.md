# Mobile API Documentation

Este documento describe los endpoints del API público para la aplicación móvil de Jahatelo.

## Base URL

En desarrollo: `http://localhost:3000/api/mobile`
En producción: `https://jahatelo.com/api/mobile`

## Desarrollo con Expo / Dispositivos en LAN

Para probar la app móvil desde Expo (u otros dispositivos en la misma red), el servidor Next.js debe escuchar en todas las interfaces de red:

```bash
npm run dev
```

El servidor se iniciará en `http://0.0.0.0:3000` y será accesible desde:
- **Localhost:** `http://localhost:3000`
- **Red LAN:** `http://[TU_IP_LOCAL]:3000` (ejemplo: `http://192.168.10.83:3000`)

Para obtener tu IP local:
- **macOS/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig`

Configura `EXPO_PUBLIC_API_URL` en la app móvil con tu IP local (ejemplo: `http://192.168.10.83:3000`).

## Endpoints

### 1. Listado de Moteles

Obtiene una lista paginada de moteles aprobados y activos.

**Endpoint:** `GET /api/mobile/motels`

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `search` | string | No | Búsqueda por nombre o descripción | `search=lujo` |
| `city` | string | No | Filtrar por ciudad | `city=Medellín` |
| `neighborhood` | string | No | Filtrar por barrio | `neighborhood=Poblado` |
| `amenity` | string | No | Filtrar por amenidad | `amenity=Jacuzzi` |
| `featured` | boolean | No | Solo moteles destacados | `featured=true` |
| `ids` | string | No | Lista de IDs o slugs separados por coma | `ids=abc123,def456` |
| `page` | number | No | Número de página (default: 1) | `page=2` |
| `limit` | number | No | Elementos por página (default: 20, max: 50) | `limit=10` |

**Ejemplo de Request:**

```bash
GET /api/mobile/motels?city=Medellín&page=1&limit=20
```

**Ejemplo de Response:**

```json
{
  "data": [
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0",
      "slug": "motel-paraiso",
      "name": "Motel Paraíso",
      "description": "El mejor motel de la ciudad con habitaciones temáticas",
      "city": "Medellín",
      "neighborhood": "Poblado",
      "address": "Calle 10 # 43-50",
      "location": {
        "lat": 6.2442,
        "lng": -75.5812
      },
      "rating": {
        "average": 4.5,
        "count": 120
      },
      "isFeatured": true,
      "hasPromo": true,
      "startingPrice": 45000,
      "amenities": ["Jacuzzi", "WiFi", "TV Cable", "Minibar"],
      "thumbnail": "https://example.com/photos/motel-paraiso-facade.jpg",
      "photos": [
        "https://example.com/photos/motel-paraiso-1.jpg",
        "https://example.com/photos/motel-paraiso-2.jpg",
        "https://example.com/photos/motel-paraiso-3.jpg"
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Códigos de Respuesta:**

- `200 OK` - Éxito
- `500 Internal Server Error` - Error del servidor

---

### 2. Detalle de Motel

Obtiene la información completa de un motel específico por su slug o ID.

**Endpoint:** `GET /api/mobile/motels/:slug`

**Parámetros URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `slug` | string | Slug o ID del motel |

**Ejemplo de Request:**

```bash
GET /api/mobile/motels/motel-paraiso
```

**Ejemplo de Response:**

```json
{
  "id": "clx1a2b3c4d5e6f7g8h9i0",
  "slug": "motel-paraiso",
  "name": "Motel Paraíso",
  "description": "El mejor motel de la ciudad con habitaciones temáticas de lujo",
  "city": "Medellín",
  "neighborhood": "Poblado",
  "address": "Calle 10 # 43-50",
  "location": {
    "lat": 6.2442,
    "lng": -75.5812
  },
  "rating": {
    "average": 4.5,
    "count": 120
  },
  "isFeatured": true,
  "hasPromo": true,
  "startingPrice": 45000,
  "amenities": ["Jacuzzi", "WiFi", "TV Cable", "Minibar"],
  "thumbnail": "https://example.com/photos/motel-paraiso-facade.jpg",
  "photos": [
    "https://example.com/photos/motel-paraiso-1.jpg",
    "https://example.com/photos/motel-paraiso-2.jpg",
    "https://example.com/photos/motel-paraiso-3.jpg"
  ],
  "contact": {
    "phone": "3001234567",
    "whatsapp": "3001234567",
    "website": "https://motelparaiso.com",
    "instagram": "@motelparaiso",
    "contactEmail": "info@motelparaiso.com",
    "contactPhone": "3001234567"
  },
  "plan": "GOLD",
  "nextBillingAt": "2025-02-01T00:00:00.000Z",
  "schedules": [
    {
      "dayOfWeek": 0,
      "openTime": "09:00",
      "closeTime": "22:00",
      "is24Hours": false,
      "isClosed": false
    },
    {
      "dayOfWeek": 1,
      "openTime": null,
      "closeTime": null,
      "is24Hours": true,
      "isClosed": false
    }
  ],
  "menu": [
    {
      "id": "cat123",
      "name": "Bebidas",
      "items": [
        {
          "id": "item123",
          "name": "Cerveza Corona",
          "price": 8000,
          "description": "Cerveza importada 355ml",
          "photoUrl": "https://example.com/photos/corona.jpg"
        }
      ]
    }
  ],
  "rooms": [
    {
      "id": "room123",
      "name": "Habitación Deluxe",
      "description": "Habitación con jacuzzi y TV 50 pulgadas",
      "basePrice": 60000,
      "priceLabel": "Desde $45.000",
      "prices": {
        "price1h": 45000,
        "price1_5h": 55000,
        "price2h": 60000,
        "price3h": 80000,
        "price12h": 120000,
        "price24h": 150000,
        "priceNight": 100000
      },
      "amenities": ["Jacuzzi", "WiFi", "TV Cable"],
      "photos": [
        "https://example.com/photos/room-deluxe-1.jpg",
        "https://example.com/photos/room-deluxe-2.jpg"
      ],
      "maxPersons": 2,
      "hasJacuzzi": true,
      "hasPrivateGarage": true,
      "isFeatured": true
    }
  ],
  "paymentMethods": ["CASH", "CARD", "TRANSFER"],
  "allPhotos": [
    "https://example.com/photos/motel-paraiso-facade.jpg",
    "https://example.com/photos/motel-paraiso-1.jpg",
    "https://example.com/photos/motel-paraiso-2.jpg"
  ],
  "hasPhotos": true
}
```

**Códigos de Respuesta:**

- `200 OK` - Éxito
- `404 Not Found` - Motel no encontrado o no disponible
- `500 Internal Server Error` - Error del servidor

---

## Notas Importantes

1. **Autenticación**: Por el momento, estos endpoints son públicos y no requieren autenticación.

2. **Rate Limiting**: Se recomienda implementar rate limiting en producción para evitar abuso del API.

3. **Paginación**: El límite máximo de elementos por página es 50. Si se solicita un valor mayor, se ajustará automáticamente a 50.

4. **Búsqueda**: El parámetro `search` realiza una búsqueda case-insensitive en los campos `name` y `description`.

5. **Filtro por IDs**: El parámetro `ids` acepta tanto IDs de base de datos como slugs, separados por comas.

6. **Moteles Disponibles**: Solo se retornan moteles con `status: APPROVED` y `isActive: true`.

7. **Habitaciones Activas**: Solo se incluyen habitaciones con `isActive: true` en el detalle del motel.

8. **Promociones**: El campo `hasPromo` indica si hay promociones activas (dentro de su rango de fechas `validFrom` y `validUntil`).

9. **Precio Inicial**: `startingPrice` representa el precio mínimo entre todos los precios de las habitaciones activas del motel.

10. **Fotos**: El `thumbnail` prioriza fotos de tipo `FACADE`, y si no hay, toma la primera foto disponible.

---

## Ejemplos de Uso

### Obtener moteles destacados

```bash
GET /api/mobile/motels?featured=true&limit=10
```

### Buscar moteles en una ciudad específica

```bash
GET /api/mobile/motels?city=Medellín&page=1&limit=20
```

### Buscar moteles con Jacuzzi

```bash
GET /api/mobile/motels?amenity=Jacuzzi
```

### Obtener detalle de un motel

```bash
GET /api/mobile/motels/motel-paraiso
```

### Obtener múltiples moteles por ID

```bash
GET /api/mobile/motels?ids=abc123,def456,ghi789
```
