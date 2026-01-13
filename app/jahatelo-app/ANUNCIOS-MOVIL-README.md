# Sistema de Anuncios Publicitarios - App Móvil Jahatelo

Sistema completo de banners publicitarios integrado en la app móvil de React Native, replicando la funcionalidad de la web.

## 📋 Tabla de Contenidos

- [Componentes Disponibles](#componentes-disponibles)
- [Hook useAdvertisements](#hook-useadvertisements)
- [Placements Soportados](#placements-soportados)
- [Integración Actual](#integración-actual)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Tracking](#tracking)
- [API Endpoints](#api-endpoints)

---

## 🎨 Componentes Disponibles

### 1. AdPopup

Modal de anuncio que se muestra al abrir la app.

**Props:**
- `ad` (object): Datos del anuncio
- `visible` (boolean): Controla visibilidad del modal
- `onClose` (function): Callback al cerrar el popup
- `onTrackView` (function): Callback para registrar vista
- `onTrackClick` (function): Callback para registrar click

**Características:**
- Modal con overlay
- Botón cerrar en esquina superior derecha
- Imagen grande del anuncio (usa `largeImageUrl` o `imageUrl`)
- Título, descripción y anunciante
- Botón CTA si tiene `linkUrl`
- Abre links externos en navegador

---

### 2. AdBanner

Banner horizontal que se integra entre secciones.

**Props:**
- `ad` (object): Datos del anuncio
- `onTrackView` (function): Callback para registrar vista
- `onTrackClick` (function): Callback para registrar click

**Características:**
- Banner horizontal de 120px de altura
- Imagen en lado izquierdo (cuadrada)
- Contenido en lado derecho
- Badge "PUBLICIDAD" en esquina superior izquierda
- Link opcional con ícono de flecha

**Ubicación recomendada:**
- Debajo del carrusel principal
- Entre secciones destacadas
- Después de categorías

---

### 3. AdInlineCard

Tarjeta de anuncio para insertar en listados.

**Props:**
- `ad` (object): Datos del anuncio
- `onTrackView` (function): Callback para registrar vista
- `onTrackClick` (function): Callback para registrar click

**Características:**
- Tarjeta completa similar a MotelCard
- Badge "Publicidad" en esquina superior derecha
- Imagen destacada arriba
- Título, descripción y anunciante
- Footer con link "Ver más"

**Uso recomendado:**
- Cada 5 moteles en listados
- En resultados de búsqueda
- En listas de categorías

---

### 4. AdCarouselItem

Item de anuncio compatible con PromoCarousel.

**Props:**
- `ad` (object): Datos del anuncio
- `index` (number): Índice del item en el carrusel
- `scrollX` (Animated.SharedValue): Valor compartido de scroll
- `onTrackView` (function): Callback para registrar vista
- `onTrackClick` (function): Callback para registrar click

**Características:**
- Compatible con animaciones de PromoCarousel
- Badge "PUBLICIDAD" en esquina
- Gradiente overlay negro
- Título, descripción y CTA
- Mismo estilo que PromoCard

**Uso:**
- Integrado en PromoCarousel existente
- Mantiene consistencia visual con promos

---

## 🔌 Hook useAdvertisements

Hook personalizado para cargar y gestionar anuncios.

### Uso

```javascript
import { useAdvertisements } from '../hooks/useAdvertisements';

const { ads, loading, error, trackAdEvent } = useAdvertisements('POPUP_HOME');
```

### Parámetros

- `placement` (string): Ubicación del anuncio
  - `'POPUP_HOME'` - Popup al abrir app
  - `'LIST_INLINE'` - Inline en listados
  - `'SECTION_BANNER'` - Banner de sección
  - `'CAROUSEL'` - Item de carrusel

### Retorna

- `ads` (array): Lista de anuncios activos ordenados por prioridad
- `loading` (boolean): Estado de carga
- `error` (string|null): Error si falla la carga
- `trackAdEvent(adId, eventType)` (function): Función para registrar eventos

### Características

- **Carga automática** al montar el componente
- **Filtrado automático** de anuncios activos
- **Ordenamiento por prioridad** (mayor a menor)
- **No bloquea UI** si falla la carga
- **Tracking asíncrono** no bloqueante

---

## 📍 Placements Soportados

| Placement | Descripción | Componente | Ubicación |
|-----------|-------------|------------|-----------|
| `POPUP_HOME` | Popup al abrir app | AdPopup | Modal sobre HomeScreen |
| `SECTION_BANNER` | Banner entre secciones | AdBanner | Debajo de carrusel |
| `LIST_INLINE` | Card en listados | AdInlineCard | Cada 5 elementos |
| `CAROUSEL` | Item de carrusel | AdCarouselItem | Dentro de PromoCarousel |

---

## ✅ Integración Actual

### HomeScreen.js

Ya integrado con:

```javascript
// Importar componentes
import AdPopup from '../components/AdPopup';
import AdBanner from '../components/AdBanner';
import { useAdvertisements } from '../hooks/useAdvertisements';

// Cargar anuncios
const { ads: popupAds, trackAdEvent: trackPopupEvent } = useAdvertisements('POPUP_HOME');
const { ads: bannerAds, trackAdEvent: trackBannerEvent } = useAdvertisements('SECTION_BANNER');

// Mostrar popup después de 1 segundo
useEffect(() => {
  if (popupAds.length > 0 && !loading) {
    const timer = setTimeout(() => {
      setShowAdPopup(true);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [popupAds, loading]);

// En el JSX
{/* Banner publicitario debajo del carrusel */}
{bannerAds.length > 0 && (
  <AdBanner
    ad={bannerAds[0]}
    onTrackView={trackBannerEvent}
    onTrackClick={trackBannerEvent}
  />
)}

{/* Popup publicitario */}
{popupAds.length > 0 && (
  <AdPopup
    ad={popupAds[0]}
    visible={showAdPopup}
    onClose={() => setShowAdPopup(false)}
    onTrackView={trackPopupEvent}
    onTrackClick={trackPopupEvent}
  />
)}
```

---

## 📖 Ejemplos de Uso

### 1. Integrar AdInlineCard en MotelListScreen

```javascript
import { useAdvertisements } from '../hooks/useAdvertisements';
import AdInlineCard from '../components/AdInlineCard';

export default function MotelListScreen({ route }) {
  const { motels } = route.params;
  const { ads, trackAdEvent } = useAdvertisements('LIST_INLINE');

  const renderItem = ({ item, index }) => {
    // Mostrar anuncio cada 5 moteles
    if (index > 0 && index % 5 === 0 && ads.length > 0) {
      const adIndex = Math.floor(index / 5) % ads.length;
      return (
        <AdInlineCard
          ad={ads[adIndex]}
          onTrackView={trackAdEvent}
          onTrackClick={trackAdEvent}
        />
      );
    }

    // Renderizar motel normal
    return <MotelCard motel={item} />;
  };

  return (
    <FlatList
      data={motels}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        item.id || `ad-${index}`
      }
    />
  );
}
```

### 2. Integrar AdCarouselItem en PromoCarousel

Modificar `PromoCarousel.js`:

```javascript
import { useAdvertisements } from '../hooks/useAdvertisements';
import AdCarouselItem from './AdCarouselItem';

export default function PromoCarousel({ promos, onPromoPress, title }) {
  const scrollX = useSharedValue(0);
  const { ads, trackAdEvent } = useAdvertisements('CAROUSEL');

  // Mezclar anuncios con promos (1 anuncio cada 3 promos)
  const items = useMemo(() => {
    const result = [];
    let adIndex = 0;

    promos.forEach((promo, index) => {
      result.push({ type: 'promo', data: promo, index });

      // Insertar anuncio cada 3 promos
      if ((index + 1) % 3 === 0 && adIndex < ads.length) {
        result.push({ type: 'ad', data: ads[adIndex], index: index + 1 });
        adIndex++;
      }
    });

    return result;
  }, [promos, ads]);

  const renderItem = ({ item, index }) => {
    if (item.type === 'ad') {
      return (
        <AdCarouselItem
          ad={item.data}
          index={index}
          scrollX={scrollX}
          onTrackView={trackAdEvent}
          onTrackClick={trackAdEvent}
        />
      );
    }

    return (
      <PromoCard
        motel={item.data}
        index={index}
        scrollX={scrollX}
        onPress={onPromoPress}
      />
    );
  };

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Animated.FlatList
        data={items}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />
    </View>
  );
}
```

### 3. Banner en SearchScreen

```javascript
import { useAdvertisements } from '../hooks/useAdvertisements';
import AdBanner from '../components/AdBanner';

export default function SearchScreen() {
  const { ads, trackAdEvent } = useAdvertisements('SECTION_BANNER');

  return (
    <ScrollView>
      <SearchBar />
      <Filters />

      {/* Banner después de filtros */}
      {ads.length > 0 && (
        <AdBanner
          ad={ads[0]}
          onTrackView={trackAdEvent}
          onTrackClick={trackAdEvent}
        />
      )}

      <MotelsList />
    </ScrollView>
  );
}
```

---

## 📊 Tracking

### Eventos Rastreados

1. **VIEW** - Registrado automáticamente cuando el anuncio es visible
2. **CLICK** - Registrado cuando el usuario toca el anuncio

### Función trackAdEvent

```javascript
trackAdEvent(adId, eventType)
```

**Parámetros:**
- `adId` (string): ID del anuncio
- `eventType` (string): Tipo de evento (`'VIEW'` o `'CLICK'`)

**Características:**
- Envío asíncrono no bloqueante
- No afecta la experiencia del usuario si falla
- Log silencioso de errores

### Ejemplo Manual

```javascript
const { trackAdEvent } = useAdvertisements('POPUP_HOME');

// Registrar vista
useEffect(() => {
  if (ad) {
    trackAdEvent(ad.id, 'VIEW');
  }
}, [ad]);

// Registrar click
const handleAdPress = () => {
  trackAdEvent(ad.id, 'CLICK');
  // ... abrir link
};
```

---

## 🔗 API Endpoints

### GET `/api/advertisements`

Obtener anuncios filtrados por placement.

**Query Parameters:**
- `placement` (string): Ubicación del anuncio
- `status` (string): Estado del anuncio (default: `ACTIVE`)

**Ejemplo:**
```javascript
GET /api/advertisements?placement=POPUP_HOME&status=ACTIVE
```

**Respuesta:**
```json
[
  {
    "id": "abc123",
    "title": "Promoción Especial",
    "advertiser": "Hotel XYZ",
    "imageUrl": "https://...",
    "largeImageUrl": "https://...",
    "description": "50% de descuento",
    "linkUrl": "https://example.com",
    "placement": "POPUP_HOME",
    "status": "ACTIVE",
    "priority": 10
  }
]
```

### POST `/api/advertisements/track`

Registrar evento de interacción con anuncio.

**Body:**
```json
{
  "advertisementId": "abc123",
  "eventType": "VIEW"
}
```

**Respuesta:**
```json
{
  "success": true
}
```

---

## 📦 Estructura de Archivos

```
app/jahatelo-app/
├── hooks/
│   └── useAdvertisements.js       # Hook para cargar anuncios
├── components/
│   ├── AdPopup.js                 # Popup modal
│   ├── AdBanner.js                # Banner horizontal
│   ├── AdInlineCard.js            # Card inline para listas
│   └── AdCarouselItem.js          # Item de carrusel
└── screens/
    └── HomeScreen.js              # Ya integrado con AdPopup y AdBanner
```

---

## ⚙️ Configuración

### Variables de Entorno

El sistema usa `EXPO_PUBLIC_API_URL` para construir las URLs de API:

```bash
EXPO_PUBLIC_API_URL=https://tu-api.com
```

Por defecto usa `http://localhost:3000` en desarrollo.

---

## ✨ Características Implementadas

- ✅ Carga automática de anuncios por placement
- ✅ Filtrado de anuncios activos
- ✅ Ordenamiento por prioridad
- ✅ Tracking automático de vistas
- ✅ Tracking de clicks
- ✅ Apertura de links externos
- ✅ No bloquea UI si falla carga
- ✅ Integración en HomeScreen
- ✅ 4 componentes de anuncios listos para usar
- ✅ Compatible con animaciones existentes
- ✅ Mantiene estilo de la app
- ✅ Documentación completa

---

## 🚀 Próximos Pasos Sugeridos

1. **Integrar AdInlineCard** en listados de moteles (MotelListScreen, SearchScreen)
2. **Integrar AdCarouselItem** en PromoCarousel
3. **Agregar analytics** para tracking avanzado
4. **Implementar caché** de anuncios para offline
5. **Agregar A/B testing** de diferentes creatividades
6. **Implementar frecuencia** de visualización (no mostrar popup cada vez)

---

## 📝 Notas Importantes

- Los anuncios solo se muestran si están con `status: 'ACTIVE'`
- El tracking es no bloqueante y silencioso ante errores
- Las imágenes se cargan con indicador de loading
- Los links externos se validan antes de abrir
- El popup tiene delay de 1 segundo para mejor UX
- Los componentes están optimizados para performance

---

## 🐛 Solución de Problemas

### Los anuncios no se cargan

1. Verificar `EXPO_PUBLIC_API_URL` en `.env`
2. Verificar que el backend esté corriendo
3. Verificar que existan anuncios activos en la base de datos
4. Revisar logs de consola para errores

### El tracking no funciona

1. Verificar conexión a internet
2. Revisar que el endpoint `/api/advertisements/track` esté disponible
3. Los errores de tracking son silenciosos, revisar logs del servidor

### El popup no se muestra

1. Verificar que `popupAds.length > 0`
2. Verificar que `loading` sea `false`
3. Verificar que el timer de 1 segundo no se canceló
4. Verificar estado `showAdPopup`

---

**Autor:** Sistema de Anuncios Jahatelo
**Fecha:** Enero 2026
**Versión:** 1.0.0
