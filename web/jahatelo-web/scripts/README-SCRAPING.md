# 📍 Guía: Extraer Moteles de Google Maps

Este script extrae **todos los moteles de Paraguay** desde Google Maps API y genera archivos CSV y JSON descargables.

## 🔑 Paso 1: Obtener API Key de Google Maps

### 1.1 Crear proyecto en Google Cloud

1. Ve a: https://console.cloud.google.com
2. Crea una cuenta o inicia sesión
3. Click en **"Nuevo proyecto"**
4. Nombre: `Jahatelo Scraper` (o cualquier nombre)
5. Click **"Crear"**

### 1.2 Habilitar APIs necesarias

1. En el menú lateral → **"APIs y servicios"** → **"Biblioteca"**
2. Busca y habilita estas APIs:
   - ✅ **Places API**
   - ✅ **Maps JavaScript API** (opcional)
   - ✅ **Geocoding API** (opcional)

### 1.3 Crear credenciales (API Key)

1. **"APIs y servicios"** → **"Credenciales"**
2. Click **"Crear credenciales"** → **"Clave de API"**
3. Copia la API Key generada (ejemplo: `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q`)

### 1.4 (Opcional) Restringir API Key

Para seguridad:
1. Click en tu API Key
2. **"Restricciones de aplicación"** → **"Direcciones IP"**
3. Agrega tu IP actual
4. **"Restricciones de API"** → Selecciona solo **"Places API"**
5. Guarda

### 1.5 Configurar facturación

⚠️ **IMPORTANTE:** Google Maps API requiere tarjeta de crédito

- Google da **$200 USD de crédito gratis por mes**
- Places API: ~$17 por 1000 requests
- Este script hará ~500-1000 requests
- **Costo estimado: $8-17 USD** (dentro del crédito gratis)

**Configurar:**
1. Menú → **"Facturación"**
2. Vincula tarjeta de crédito
3. (Opcional) Configura alertas de presupuesto

---

## 🚀 Paso 2: Ejecutar el Script

### 2.1 Configurar API Key

**Opción A: Variable de entorno (recomendado)**
```bash
export GOOGLE_MAPS_API_KEY="TU_API_KEY_AQUI"
```

**Opción B: Archivo .env**
```bash
echo 'GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI' >> .env
```

### 2.2 Ejecutar scraping

```bash
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/web/jahatelo-web

node scripts/scrape-motels-google.js
```

### 2.3 Resultado

El script generará:
- ✅ `data/motels-paraguay-google.json` - Datos completos en JSON
- ✅ `data/motels-paraguay-google.csv` - Excel-friendly

**Ejemplo de salida:**
```
🚀 Iniciando scraping de moteles de Paraguay desde Google Maps

📍 Buscando en Asunción...
   🔍 Término: "motel"
      Encontrados: 15 lugares
      📄 1. Motel La Flecha
      📄 2. Hotel Excelsior
      ...

📍 Buscando en Ciudad del Este...
   ...

✅ Scraping completado!
📊 Total de moteles únicos encontrados: 127

💾 Guardado JSON: /data/motels-paraguay-google.json
💾 Guardado CSV: /data/motels-paraguay-google.csv

📈 Estadísticas:
   Asunción: 45 moteles
   Ciudad del Este: 23 moteles
   Fernando de la Mora: 12 moteles
   ...

✨ ¡Listo!
```

---

## 📊 Estructura de Datos

### Campos extraídos:

```json
{
  "googlePlaceId": "ChIJ...",
  "name": "Motel La Flecha",
  "city": "Asunción",
  "address": "Av. Artigas 1234, Asunción, Paraguay",
  "latitude": -25.2637,
  "longitude": -57.5759,
  "phone": "+595 21 123 4567",
  "internationalPhone": "+595211234567",
  "website": "https://motellaflecha.com",
  "rating": 4.2,
  "totalRatings": 156,
  "openNow": true,
  "openingHours": [
    "lunes: Abierto las 24 horas",
    "martes: Abierto las 24 horas",
    ...
  ],
  "types": ["lodging", "point_of_interest"],
  "priceLevel": 2,
  "googleMapsUrl": "https://www.google.com/maps/place/?q=place_id:ChIJ...",
  "photoReferences": ["CmRaAAAA...", "CmRaAAAA..."],
  "scrapedAt": "2024-01-29T15:30:00.000Z"
}
```

---

## 💡 Consejos

### Optimizar costos:

1. **Ejecuta solo una vez** - Guarda los datos
2. **Filtra ciudades** - Edita `CITIES_PARAGUAY` en el script
3. **Reduce términos** - Edita `SEARCH_TERMS`
4. **Usa caché** - El script ya evita duplicados

### Manejo de errores:

```bash
# Si falla, revisa:
- ¿API Key válida?
- ¿APIs habilitadas?
- ¿Facturación configurada?
- ¿Rate limits excedidos? (espera 1 minuto y reintenta)
```

### Actualizar datos:

```bash
# Ejecutar cada 1-3 meses para datos frescos
node scripts/scrape-motels-google.js
```

---

## 📁 Usar los Datos

### Importar a base de datos:

```bash
# Opción 1: Usar script de importación (crear después)
node scripts/import-motels-to-db.js

# Opción 2: Importar manualmente desde CSV
# Abrir data/motels-paraguay-google.csv en Excel/Sheets
# Revisar y limpiar datos
# Importar a Prisma
```

### Filtrar datos útiles:

```javascript
const motels = require('./data/motels-paraguay-google.json');

// Solo moteles con buena calificación
const goodMotels = motels.filter(m => m.rating >= 3.5);

// Solo con teléfono
const contactable = motels.filter(m => m.phone);

// Por ciudad
const asuncion = motels.filter(m => m.city === 'Asunción');
```

---

## ⚠️ Advertencias Legales

### ✅ Uso permitido:
- Datos públicos de Google Maps
- Uso comercial (con límites de API)
- Respeta rate limits

### ❌ NO hacer:
- Revender datos masivamente
- Scrapear sin API (viola ToS)
- Exceder límites de API

### 📜 Términos:
Lee: https://cloud.google.com/maps-platform/terms

---

## 🐛 Solución de Problemas

### Error: "GOOGLE_MAPS_API_KEY no está configurada"
```bash
export GOOGLE_MAPS_API_KEY="tu_clave_aqui"
```

### Error: "REQUEST_DENIED"
- Verifica que Places API esté habilitada
- Revisa que la facturación esté configurada

### Error: "OVER_QUERY_LIMIT"
- Espera 1 minuto
- Reduce ciudades en el script

### Error: "INVALID_REQUEST"
- Revisa formato de coordenadas
- Verifica términos de búsqueda

---

## 📞 Soporte

Si tenés problemas:
1. Revisa logs del script
2. Verifica Google Cloud Console
3. Consulta documentación: https://developers.google.com/maps/documentation/places/web-service/overview

---

## 🎯 Próximos Pasos

Después de obtener los datos:

1. ✅ Revisar archivo CSV generado
2. ✅ Filtrar falsos positivos (hoteles que no son moteles)
3. ✅ Complementar con datos de redes sociales
4. ✅ Importar a tu base de datos Prisma
5. ✅ Contactar moteles para verificar info
