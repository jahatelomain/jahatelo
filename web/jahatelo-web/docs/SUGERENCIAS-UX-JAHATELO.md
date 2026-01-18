# 🎨 Sugerencias UX para Jahatelo
## App Móvil y Web de Clientes

**Documento:** Mejoras de Experiencia de Usuario
**Fecha:** Enero 2025
**Versión:** 1.0
**Proyecto:** Jahatelo - Plataforma de Moteles en Paraguay

---

## 📋 Tabla de Contenidos

1. [App Móvil (React Native)](#app-móvil-react-native)
   - [Onboarding & Primera Impresión](#1-onboarding--primera-impresión)
   - [Home Screen Mejorado](#2-home-screen-mejorado)
   - [Búsqueda Mejorada](#3-búsqueda-mejorada)
   - [Detalle de Motel](#4-detalle-de-motel---hero-section)
   - [Tabs de Información](#5-tabs-de-información)
   - [Galería de Fotos](#6-galería-de-fotos-mejorada)
   - [Floating Action Button](#7-floating-action-button-fab)
   - [Pull-to-Refresh](#8-pull-to-refresh)
   - [Skeleton Loaders](#9-skeleton-loaders)
   - [Bottom Sheet para Filtros](#10-bottom-sheet-para-filtros)
   - [Favoritos con Animación](#11-favoritos-con-animación)
   - [Compartir Motel](#12-compartir-motel)
   - [Empty States](#13-empty-states-amigables)
   - [Notificaciones Push](#14-notificaciones-push-inteligentes)
   - [Modo Oscuro](#15-modo-oscuro)

2. [Web de Clientes](#web-de-clientes)
   - [Hero Section](#1-hero-section-impactante)
   - [Grid Responsivo](#2-grid-responsivo-con-hover-effects)
   - [Filtros Sticky](#3-filtros-sticky-sidebar)
   - [Breadcrumbs](#4-breadcrumbs-para-seo-y-ux)
   - [Lightbox de Galería](#5-lightbox-de-galería)
   - [Mapa Interactivo](#6-mapa-interactivo)
   - [Lazy Loading](#7-lazy-loading-de-imágenes)
   - [Call-to-Actions](#8-call-to-actions-claros)
   - [Social Proof](#9-social-proof)
   - [Filtros con URL](#11-filtros-con-url-params)
   - [PWA](#12-progressive-web-app-pwa)
   - [Performance](#13-performance-optimizations)
   - [Micro-interactions](#14-micro-interactions)
   - [Accesibilidad](#15-accesibilidad-a11y)

3. [Métricas](#métricas-para-medir-impacto)
4. [Priorización](#priorización-sugerida)

---

# 📱 APP MÓVIL (React Native)

## 1. Onboarding & Primera Impresión

### Problema
Usuario nuevo no sabe qué hacer al abrir la app por primera vez.

### Solución
Onboarding de 3 pasos con swipe horizontal:

**Paso 1:** "Encontrá moteles cerca tuyo" 📍
- Visual: Icono GPS con mapa animado
- Descripción: "Usamos tu ubicación para mostrarte los moteles más cercanos"

**Paso 2:** "Mirá fotos y precios reales" 📸
- Visual: Galería de fotos de moteles
- Descripción: "Todas las fotos son verificadas por nuestro equipo"

**Paso 3:** "Navegá directo desde la app" 🗺️
- Visual: Icono de Waze/Maps
- Descripción: "Un click y llegás en minutos"

### Características
- Skip button visible en todas las pantallas
- Indicadores de página (dots)
- Guardar en AsyncStorage que ya vio el onboarding
- Animaciones suaves entre pasos

### Implementación
```typescript
// Librería recomendada
npm install react-native-onboarding-swiper

// Uso básico
import Onboarding from 'react-native-onboarding-swiper';

<Onboarding
  pages={[
    {
      backgroundColor: '#822DE2',
      image: <Image source={require('./gps-icon.png')} />,
      title: 'Encontrá moteles cerca tuyo',
      subtitle: 'Usamos tu ubicación para mostrarte los más cercanos',
    },
    // ... más páginas
  ]}
  onDone={() => {
    AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.navigate('Home');
  }}
/>
```

---

## 2. Home Screen Mejorado

### Layout Actual
Probablemente una lista básica de moteles sin estructura clara.

### Layout Propuesto

```
┌─────────────────────────────────┐
│  Hola! 👋                      │
│  ¿Qué motel buscás hoy?         │
│                                 │
│  🔍 [Buscar por nombre...]     │
│                                 │
│  📍 Moteles cerca tuyo          │
│  ┌───────────┐ ┌───────────┐  │
│  │ [FOTO]    │ │ [FOTO]    │  │
│  │ Paradise  │ │ Luna      │  │
│  │ 2.3km     │ │ 4.1km     │  │
│  │ ⭐ 4.5    │ │ ⭐ 4.8    │  │
│  └───────────┘ └───────────┘  │
│                                 │
│  🔥 Más populares               │
│  [Horizontal ScrollView]        │
│                                 │
│  🎁 Con promociones             │
│  [Horizontal ScrollView]        │
│                                 │
│  ❤️ Tus favoritos               │
│  [Horizontal ScrollView]        │
└─────────────────────────────────┘
```

### Features Clave
- **Secciones organizadas:** Cerca, Populares, Promos, Favoritos
- **Cards horizontales:** Scroll horizontal en cada sección
- **Información visible:** Distancia, rating, nombre
- **Pull-to-refresh:** Actualizar contenido
- **Personalización:** Saludo con nombre si está logueado

### Implementación
```typescript
<ScrollView>
  {/* Header con saludo */}
  <View style={styles.header}>
    <Text style={styles.greeting}>Hola! 👋</Text>
    <Text style={styles.subtitle}>¿Qué motel buscás hoy?</Text>
  </View>

  {/* Barra de búsqueda */}
  <TouchableOpacity
    style={styles.searchBar}
    onPress={() => navigation.navigate('Search')}
  >
    <Icon name="search" />
    <Text>Buscar por nombre...</Text>
  </TouchableOpacity>

  {/* Sección: Cerca tuyo */}
  <Section
    title="📍 Moteles cerca tuyo"
    data={nearbyMotels}
    renderItem={renderMotelCard}
  />

  {/* Sección: Populares */}
  <Section
    title="🔥 Más populares"
    data={popularMotels}
    renderItem={renderMotelCard}
  />

  {/* Sección: Con promociones */}
  <Section
    title="🎁 Con promociones"
    data={promosMotels}
    renderItem={renderMotelCard}
  />

  {/* Sección: Favoritos */}
  {favorites.length > 0 && (
    <Section
      title="❤️ Tus favoritos"
      data={favorites}
      renderItem={renderMotelCard}
    />
  )}
</ScrollView>
```

---

## 3. Búsqueda Mejorada

### Componentes de la Búsqueda

#### 3.1 Barra de Búsqueda con Chips
```
┌──────────────────────────────┐
│ 🔍 Buscar moteles...         │
└──────────────────────────────┘

[Chips de filtros rápidos]
🏷️ Con promo  📍 Cerca  ⭐ Top rated  🅿️ Parking
```

#### 3.2 Búsqueda Predictiva
Al escribir "para", mostrar sugerencias:
- **Paradise Motel** (Asunción)
- **Paradise Inn** (Ciudad del Este)
- **Paraíso** (Luque)

#### 3.3 Historial de Búsquedas
```
Últimas búsquedas:
• Paradise Motel
• Moteles en Fernando de la Mora
• Moteles con jacuzzi
```

### Implementación
```typescript
// Componente de búsqueda
const [searchQuery, setSearchQuery] = useState('');
const [suggestions, setSuggestions] = useState([]);
const [searchHistory, setSearchHistory] = useState([]);

// Debounce para evitar requests excesivos
const debouncedSearch = useMemo(
  () => debounce((query) => {
    fetchSuggestions(query);
  }, 300),
  []
);

// Handler de cambio de texto
const handleSearchChange = (text) => {
  setSearchQuery(text);
  debouncedSearch(text);
};

// Guardar búsqueda en historial
const saveToHistory = (query) => {
  const newHistory = [query, ...searchHistory].slice(0, 5);
  setSearchHistory(newHistory);
  AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
};
```

---

## 4. Detalle de Motel - Hero Section

### Layout Propuesto

```
┌──────────────────────────────────┐
│ [FOTO PRINCIPAL - full width]   │
│                                  │
│  ❤️  📤                         │
│  1/8 fotos                       │
└──────────────────────────────────┘

Paradise Motel ⭐ 4.5 (127 reviews)

📍 Av. España 1234, Asunción
   2.3 km • Abierto ahora 🟢

┌─────────────┐ ┌─────────────┐
│ Abrir en    │ │ Abrir en    │
│ Waze        │ │ Maps        │
└─────────────┘ └─────────────┘

🎁 PROMO ACTIVA
   2x1 en habitaciones
   Válido hasta el 31 de enero
```

### Features
- **Gallery con contador:** "1/8 fotos" en overlay
- **Rating prominente:** Con cantidad de reviews
- **Status badge:** "Abierto ahora 🟢" o "Cerrado 🔴"
- **Botones de navegación:** Waze y Google Maps
- **Promo destacada:** Si existe, mostrar en card destacado
- **Acciones rápidas:** Favorito y compartir en top-right

### Implementación
```typescript
<View style={styles.container}>
  {/* Hero Image con Gallery */}
  <TouchableOpacity onPress={openGallery}>
    <Image source={{ uri: motel.featuredPhoto }} style={styles.heroImage} />

    {/* Overlay con acciones */}
    <View style={styles.overlay}>
      <View style={styles.topActions}>
        <TouchableOpacity onPress={toggleFavorite}>
          <Icon name={isFavorite ? "heart" : "heart-outline"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={shareMotel}>
          <Icon name="share-outline" />
        </TouchableOpacity>
      </View>

      <View style={styles.photoCounter}>
        <Text>1/{motel.photos.length} fotos</Text>
      </View>
    </View>
  </TouchableOpacity>

  {/* Información principal */}
  <View style={styles.info}>
    <View style={styles.titleRow}>
      <Text style={styles.name}>{motel.name}</Text>
      <View style={styles.rating}>
        <Icon name="star" color="#FFD700" />
        <Text>{motel.rating}</Text>
        <Text style={styles.reviewCount}>({motel.reviewCount})</Text>
      </View>
    </View>

    {/* Ubicación */}
    <View style={styles.location}>
      <Icon name="location" />
      <Text>{motel.address}, {motel.city}</Text>
    </View>
    <View style={styles.distance}>
      <Text>{motel.distance} km • </Text>
      <Text style={motel.isOpen ? styles.open : styles.closed}>
        {motel.isOpen ? 'Abierto ahora 🟢' : 'Cerrado 🔴'}
      </Text>
    </View>

    {/* Botones de navegación */}
    <View style={styles.navigationButtons}>
      <Button onPress={openInWaze}>Abrir en Waze</Button>
      <Button onPress={openInMaps}>Abrir en Maps</Button>
    </View>

    {/* Promo (si existe) */}
    {motel.activePromo && (
      <View style={styles.promoCard}>
        <Icon name="gift" />
        <View>
          <Text style={styles.promoTitle}>PROMO ACTIVA</Text>
          <Text style={styles.promoDescription}>{motel.activePromo.description}</Text>
          <Text style={styles.promoValidity}>Válido hasta {motel.activePromo.endDate}</Text>
        </View>
      </View>
    )}
  </View>
</View>
```

---

## 5. Tabs de Información

### Estructura de Tabs

```typescript
// Tabs con iconos
🏠 Info  |  📸 Fotos  |  🗺️ Mapa  |  📝 Reviews
```

### Tab 1: Info

```
✨ Amenities
☑️ Wi-Fi gratis
☑️ Estacionamiento privado
☑️ Aire acondicionado
☑️ TV por cable
☐ Jacuzzi
☐ Minibar

💰 Precios
┌────────────────────────────┐
│ Habitación simple          │
│ Gs. 80.000/turno           │
├────────────────────────────┤
│ Habitación doble           │
│ Gs. 120.000/turno          │
├────────────────────────────┤
│ Suite VIP                  │
│ Gs. 180.000/turno          │
└────────────────────────────┘

📞 Contacto
Teléfono: (021) 555-1234
WhatsApp: [Enviar mensaje 💬]

⏰ Horarios
Lun-Dom: 24 horas
```

### Tab 2: Fotos
Grid de fotos 2x2, tap para fullscreen

### Tab 3: Mapa
Mapa interactivo con marker del motel

### Tab 4: Reviews
Lista de reviews con ratings

### Implementación
```typescript
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#822DE2',
    tabBarInactiveTintColor: '#gray',
    tabBarIndicatorStyle: { backgroundColor: '#822DE2' },
  }}
>
  <Tab.Screen
    name="Info"
    component={InfoTab}
    options={{ tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }}
  />
  <Tab.Screen
    name="Fotos"
    component={PhotosTab}
    options={{ tabBarIcon: ({ color }) => <Icon name="images" color={color} /> }}
  />
  <Tab.Screen
    name="Mapa"
    component={MapTab}
    options={{ tabBarIcon: ({ color }) => <Icon name="map" color={color} /> }}
  />
  <Tab.Screen
    name="Reviews"
    component={ReviewsTab}
    options={{ tabBarIcon: ({ color }) => <Icon name="star" color={color} /> }}
  />
</Tab.Navigator>
```

---

## 6. Galería de Fotos Mejorada

### Features
- **Fullscreen gallery** con gestos naturales
- **Swipe horizontal** para cambiar foto
- **Pinch to zoom** para acercar
- **Double tap to zoom** alternativo
- **Compartir foto individual**
- **Grid view** al hacer swipe down

### Overlay con Información
```
┌─────────────────────────────┐
│  ← 3/8 📤                  │
│                             │
│    [FOTO FULLSCREEN]        │
│                             │
│  Habitación Suite VIP       │
└─────────────────────────────┘
```

### Implementación
```typescript
// Librería recomendada
npm install react-native-image-viewing

import ImageViewing from 'react-native-image-viewing';

const [visible, setVisible] = useState(false);
const [currentIndex, setCurrentIndex] = useState(0);

const images = motel.photos.map(photo => ({ uri: photo.url }));

<ImageViewing
  images={images}
  imageIndex={currentIndex}
  visible={visible}
  onRequestClose={() => setVisible(false)}
  HeaderComponent={({ imageIndex }) => (
    <View style={styles.header}>
      <Text>{imageIndex + 1}/{images.length}</Text>
      <TouchableOpacity onPress={shareImage}>
        <Icon name="share" />
      </TouchableOpacity>
    </View>
  )}
  FooterComponent={({ imageIndex }) => (
    <View style={styles.footer}>
      <Text>{motel.photos[imageIndex].caption}</Text>
    </View>
  )}
/>
```

---

## 7. Floating Action Button (FAB)

### Concepto
Botón flotante que permanece visible al hacer scroll en el detalle del motel.

### Visual
```
Al hacer scroll:

┌──────────────────────────┐
│  (contenido del motel)   │
│                          │
│                          │
│                  ┌──────┐│
│                  │ 📞   ││ ← FAB fijo
│                  │Llamar││
│                  └──────┘│
└──────────────────────────┘
```

### Al tocar el FAB
Mostrar opciones en un bottom sheet:
- 📞 **Llamar** - Abre dialer con número
- 💬 **WhatsApp** - Abre WhatsApp con mensaje pre-llenado
- 📤 **Compartir** - Share sheet nativo

### Implementación
```typescript
import { FloatingAction } from "react-native-floating-action";

const actions = [
  {
    text: "Llamar",
    icon: <Icon name="call" />,
    name: "call",
    position: 1
  },
  {
    text: "WhatsApp",
    icon: <Icon name="logo-whatsapp" />,
    name: "whatsapp",
    position: 2
  },
  {
    text: "Compartir",
    icon: <Icon name="share-social" />,
    name: "share",
    position: 3
  }
];

<FloatingAction
  actions={actions}
  onPressItem={(name) => {
    switch(name) {
      case 'call':
        Linking.openURL(`tel:${motel.phone}`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${motel.whatsapp}&text=Hola, vi su motel en Jahatelo`);
        break;
      case 'share':
        Share.share({
          message: `Mirá este motel: ${motel.name}`,
          url: `https://jahatelo.com/motels/${motel.id}`
        });
        break;
    }
  }}
  color="#822DE2"
/>
```

---

## 8. Pull-to-Refresh

### Feature
Gesture natural para actualizar contenido: arrastrar hacia abajo para refrescar.

### Ubicaciones
- Home screen (lista de moteles)
- Búsqueda (resultados)
- Favoritos
- Detalle de motel

### Implementación
```typescript
import { RefreshControl } from 'react-native';

const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  try {
    await fetchMotels();
  } finally {
    setRefreshing(false);
  }
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#822DE2" // Color del spinner
      title="Actualizando moteles..." // iOS
      titleColor="#822DE2"
      colors={["#822DE2"]} // Android
    />
  }
>
  {/* Contenido */}
</ScrollView>
```

---

## 9. Skeleton Loaders

### Problema
Spinners genéricos no dan contexto de lo que está cargando.

### Solución
Skeleton screens que imitan la estructura del contenido.

### Visual
```
┌─────────────────────────┐
│ ▅▅▅▅▅▅▅▅▅▅            │ ← Shimmer effect
│                         │
│ ▅▅▅▅  ▅▅▅              │
│ ▅▅▅▅▅▅▅▅▅              │
│                         │
│ ▅▅▅▅▅▅▅▅▅▅            │
│                         │
│ ▅▅▅▅▅▅▅▅▅▅            │
└─────────────────────────┘
```

### Implementación
```typescript
// Librería recomendada
npm install react-native-skeleton-placeholder

import SkeletonPlaceholder from "react-native-skeleton-placeholder";

// Skeleton para lista de moteles
{loading ? (
  <SkeletonPlaceholder>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={{ width: '100%', height: 150, borderRadius: 12 }} />
        <View style={{ marginTop: 12 }}>
          <View style={{ width: '70%', height: 20 }} />
          <View style={{ width: '50%', height: 16, marginTop: 8 }} />
        </View>
      </View>
    ))}
  </SkeletonPlaceholder>
) : (
  motels.map(motel => <MotelCard key={motel.id} motel={motel} />)
)}
```

---

## 10. Bottom Sheet para Filtros

### Concepto
Panel deslizable desde abajo para filtros, mejor que modal fullscreen.

### Visual
```typescript
// Al tocar "Filtros" en header
// Bottom sheet sube desde abajo

┌───────────────────────────┐
│  Filtros                  │
│  ━━━━━━━━━━━━━━━━━━━━  │ ← Drag handle
│                           │
│  📍 Distancia             │
│  ▁▁▁●━━━━━━━━━ 10 km    │
│                           │
│  ⭐ Rating mínimo         │
│  ☆ ☆ ☆ ● ●              │
│                           │
│  💰 Precio máximo         │
│  ▁▁▁▁●━━━━ Gs. 150.000  │
│                           │
│  ✨ Amenities             │
│  ☑ Wi-Fi                 │
│  ☑ Estacionamiento        │
│  ☐ Jacuzzi                │
│  ☐ Aire acondicionado     │
│                           │
│  [Limpiar]  [Aplicar]    │
└───────────────────────────┘
```

### Implementación
```typescript
// Librería recomendada
npm install @gorhom/bottom-sheet

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const bottomSheetRef = useRef<BottomSheet>(null);
const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

<BottomSheet
  ref={bottomSheetRef}
  index={-1} // Cerrado por defecto
  snapPoints={snapPoints}
  enablePanDownToClose
>
  <BottomSheetView style={styles.contentContainer}>
    <Text style={styles.title}>Filtros</Text>

    {/* Distancia */}
    <Text>📍 Distancia</Text>
    <Slider
      value={distance}
      onValueChange={setDistance}
      minimumValue={0}
      maximumValue={50}
      step={5}
    />
    <Text>{distance} km</Text>

    {/* Rating */}
    <Text>⭐ Rating mínimo</Text>
    <StarRating
      rating={minRating}
      onRatingChange={setMinRating}
    />

    {/* Precio */}
    <Text>💰 Precio máximo</Text>
    <Slider
      value={maxPrice}
      onValueChange={setMaxPrice}
      minimumValue={0}
      maximumValue={500000}
      step={10000}
    />
    <Text>Gs. {maxPrice.toLocaleString()}</Text>

    {/* Amenities */}
    <Text>✨ Amenities</Text>
    <CheckBox label="Wi-Fi" value={filters.wifi} onChange={(v) => setFilters({...filters, wifi: v})} />
    <CheckBox label="Estacionamiento" value={filters.parking} onChange={(v) => setFilters({...filters, parking: v})} />
    <CheckBox label="Jacuzzi" value={filters.jacuzzi} onChange={(v) => setFilters({...filters, jacuzzi: v})} />

    {/* Botones */}
    <View style={styles.buttons}>
      <Button title="Limpiar" onPress={clearFilters} />
      <Button title="Aplicar" onPress={applyFilters} />
    </View>
  </BottomSheetView>
</BottomSheet>
```

---

## 11. Favoritos con Animación

### Feature
Botón de favorito con feedback visual y táctil.

### Comportamiento
1. **Tap en corazón** → Animación de escala
2. **Haptic feedback** → Vibración suave
3. **Toast notification** → "Agregado a favoritos ❤️"
4. **Persistencia** → Guardar en AsyncStorage

### Implementación
```typescript
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';

const [isFavorite, setIsFavorite] = useState(false);
const scaleValue = useRef(new Animated.Value(1)).current;

const toggleFavorite = async () => {
  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Animación de escala
  Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 1.3,
      duration: 150,
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1.0,
      duration: 150,
      useNativeDriver: true,
    }),
  ]).start();

  // Toggle estado
  const newFavoriteState = !isFavorite;
  setIsFavorite(newFavoriteState);

  // Guardar en storage
  const favorites = await AsyncStorage.getItem('favorites');
  const favoritesArray = favorites ? JSON.parse(favorites) : [];

  if (newFavoriteState) {
    favoritesArray.push(motel.id);
    toast.show('Agregado a favoritos ❤️');
  } else {
    const index = favoritesArray.indexOf(motel.id);
    favoritesArray.splice(index, 1);
    toast.show('Eliminado de favoritos');
  }

  await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
};

<TouchableOpacity onPress={toggleFavorite}>
  <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
    <Icon
      name={isFavorite ? "heart" : "heart-outline"}
      size={28}
      color={isFavorite ? "#F56565" : "#gray"}
    />
  </Animated.View>
</TouchableOpacity>
```

---

## 12. Compartir Motel

### Feature
Compartir información del motel con otros usuarios.

### Contenido a Compartir
```
🏨 Paradise Motel
📍 Asunción, Centro
⭐ 4.5/5 (127 reviews)

Mirá este motel en Jahatelo:
https://jahatelo.com/motels/123
```

### Deep Link
Si el receptor tiene la app instalada, abre directamente en la app.

### Implementación
```typescript
import { Share } from 'react-native';

const shareMotel = async () => {
  try {
    const result = await Share.share({
      message: `🏨 ${motel.name}\n📍 ${motel.city}, ${motel.neighborhood}\n⭐ ${motel.rating}/5 (${motel.reviewCount} reviews)\n\nMirá este motel en Jahatelo:\nhttps://jahatelo.com/motels/${motel.id}`,
      url: `https://jahatelo.com/motels/${motel.id}`, // iOS only
      title: motel.name
    });

    if (result.action === Share.sharedAction) {
      // Usuario compartió
      if (result.activityType) {
        // Compartió vía activityType específico (iOS)
        console.log('Shared via', result.activityType);
      }
    } else if (result.action === Share.dismissedAction) {
      // Usuario canceló
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error(error.message);
  }
};

// Botón de compartir
<TouchableOpacity onPress={shareMotel}>
  <Icon name="share-social" size={24} />
</TouchableOpacity>
```

### Deep Link Setup (react-navigation)
```typescript
// En App.js o Root Navigator
const linking = {
  prefixes: ['jahatelo://', 'https://jahatelo.com'],
  config: {
    screens: {
      MotelDetail: 'motels/:id',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* Stacks */}
</NavigationContainer>
```

---

## 13. Empty States Amigables

### 13.1 Sin Resultados de Búsqueda

```
┌────────────────────────┐
│                        │
│      🔍               │
│                        │
│  No encontramos        │
│  moteles con "xyz"     │
│                        │
│  Intentá buscar:       │
│  • Sin tildes          │
│  • Menos específico    │
│  • Otra ciudad         │
│                        │
│  [Ver todos]           │
└────────────────────────┘
```

### 13.2 Sin Favoritos

```
┌────────────────────────┐
│      ❤️                │
│                        │
│  Aún no tenés          │
│  favoritos             │
│                        │
│  Guardá tus moteles    │
│  preferidos para       │
│  encontrarlos rápido   │
│                        │
│  [Explorar moteles]    │
└────────────────────────┘
```

### 13.3 Sin Conexión

```
┌────────────────────────┐
│      📡               │
│                        │
│  Sin conexión          │
│  a internet            │
│                        │
│  Verificá tu conexión  │
│  e intentá de nuevo    │
│                        │
│  [Reintentar]          │
└────────────────────────┘
```

### Implementación
```typescript
// Componente reutilizable
const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => (
  <View style={styles.emptyState}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {actionText && (
      <Button title={actionText} onPress={onAction} />
    )}
  </View>
);

// Uso
{motels.length === 0 && (
  <EmptyState
    icon="🔍"
    title="No encontramos moteles"
    description={`No hay resultados para "${searchQuery}"`}
    actionText="Ver todos"
    onAction={() => clearSearch()}
  />
)}
```

---

## 14. Notificaciones Push Inteligentes

### Principio
Notificaciones útiles, no spam. Dar valor al usuario.

### Tipos de Notificaciones

#### 14.1 Promo Cerca de tu Ubicación
```
🎁 Paradise Motel tiene 2x1
📍 A solo 2km de vos
Válido hasta el 31 de enero
```

**Trigger:** Usuario está cerca de motel con promo (geofencing)

#### 14.2 Motel Favorito tiene Promo
```
❤️ Tu favorito Paradise tiene promo nueva
🎁 2x1 en habitaciones
Mirá los detalles →
```

**Trigger:** Motel en favoritos activa nueva promo

#### 14.3 Recordatorio de Motel Visto
```
👀 Seguís buscando motel en Asunción?
Paradise Motel tiene disponibilidad
Ver detalles →
```

**Trigger:** Usuario vio 3+ moteles hace 24hs y no contactó ninguno

### Configuración Granular

```
Settings screen:

🔔 Notificaciones

☑ Promociones cerca tuyo
   Recibí notificaciones cuando haya promos cerca

☑ Actualizaciones de favoritos
   Nuevas fotos, precios y promos de tus favoritos

☐ Recomendaciones semanales
   Los mejores moteles cerca tuyo cada semana
```

### Implementación
```typescript
// Expo Notifications
npm install expo-notifications

import * as Notifications from 'expo-notifications';

// Configurar handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Enviar notificación local (testing)
const sendLocalNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎁 Promo cerca tuyo",
      body: "Paradise Motel tiene 2x1 - a solo 2km",
      data: { motelId: '123', type: 'promo' },
    },
    trigger: { seconds: 2 },
  });
};

// Escuchar taps en notificaciones
Notifications.addNotificationResponseReceivedListener(response => {
  const { motelId, type } = response.notification.request.content.data;

  if (type === 'promo') {
    navigation.navigate('MotelDetail', { id: motelId });
  }
});
```

---

## 15. Modo Oscuro

### Beneficios
- Reduce fatiga visual en ambientes oscuros
- Ahorra batería en pantallas OLED
- Preferencia de muchos usuarios

### Opciones
1. **Automático:** Sigue preferencia del sistema
2. **Claro:** Forzar modo claro
3. **Oscuro:** Forzar modo oscuro

### UI en Settings

```
🌙 Tema
  ⚪ Claro
  ⚫ Oscuro
  🔄 Automático (sistema)
```

### Implementación
```typescript
import { useColorScheme } from 'react-native';
import { ThemeProvider, createTheme } from '@rneui/themed';

// Detectar preferencia del sistema
const systemColorScheme = useColorScheme();

// O usar estado propio
const [themeMode, setThemeMode] = useState('auto'); // 'auto', 'light', 'dark'

const isDark = themeMode === 'auto'
  ? systemColorScheme === 'dark'
  : themeMode === 'dark';

// Crear temas
const lightTheme = createTheme({
  colors: {
    primary: '#822DE2',
    background: '#FFFFFF',
    text: '#000000',
    card: '#F5F5F5',
  },
});

const darkTheme = createTheme({
  colors: {
    primary: '#9D5CFF',
    background: '#121212',
    text: '#FFFFFF',
    card: '#1E1E1E',
  },
});

// Aplicar tema
<ThemeProvider theme={isDark ? darkTheme : lightTheme}>
  <App />
</ThemeProvider>

// Guardar preferencia
AsyncStorage.setItem('themeMode', themeMode);
```

---

# 🌐 WEB DE CLIENTES

## 1. Hero Section Impactante

### Objetivo
Captar atención y comunicar valor en los primeros 3 segundos.

### Layout Propuesto

```html
<section class="hero">
  <!-- Fondo: Imagen de motel difuminada con overlay -->

  <div class="hero-content">
    <h1>Encontrá el motel perfecto en Paraguay</h1>
    <p>Más de 50 moteles verificados en Asunción, CDE y todo el país</p>

    <!-- Buscador grande y prominente -->
    <div class="search-bar">
      <input
        type="text"
        placeholder="🔍 Buscar por nombre, ciudad o barrio..."
      />
      <button>Buscar</button>
    </div>

    <!-- Stats para generar confianza -->
    <div class="stats">
      <div class="stat">
        <strong>+50</strong>
        <span>moteles verificados</span>
      </div>
      <div class="stat">
        <strong>+1,000</strong>
        <span>reviews reales</span>
      </div>
      <div class="stat">
        <strong>Todo</strong>
        <span>Paraguay</span>
      </div>
    </div>
  </div>
</section>
```

### Estilos CSS

```css
.hero {
  min-height: 80vh;
  background: linear-gradient(
    135deg,
    rgba(130, 45, 226, 0.9),
    rgba(245, 101, 101, 0.9)
  ), url('/hero-bg.jpg');
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.search-bar {
  max-width: 600px;
  margin: 0 auto 2rem;
  display: flex;
  gap: 1rem;
  background: white;
  padding: 0.5rem;
  border-radius: 50px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.search-bar input {
  flex: 1;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  outline: none;
  color: #333;
}

.search-bar button {
  background: #822DE2;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.search-bar button:hover {
  transform: scale(1.05);
}

.stats {
  display: flex;
  gap: 3rem;
  justify-content: center;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat strong {
  font-size: 2rem;
  font-weight: 700;
}

.stat span {
  font-size: 0.9rem;
  opacity: 0.9;
}
```

---

## 2. Grid Responsivo con Hover Effects

### Grid Layout

```css
.motels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 2rem;
}

/* Mobile */
@media (max-width: 768px) {
  .motels-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .motels-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .motels-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
```

### Hover Effects

```css
.motel-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.motel-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(130, 45, 226, 0.15);
}

.motel-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.motel-card:hover .motel-card-image {
  transform: scale(1.05);
}

.motel-card-content {
  padding: 1.5rem;
}

.motel-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.motel-card-location {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.motel-card-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #FFD700;
}

.motel-card-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #822DE2;
  margin-top: 1rem;
}
```

---

## 3. Filtros Sticky Sidebar

### Layout Desktop

```html
<div class="page-layout">
  <!-- Sidebar con filtros -->
  <aside class="filters-sidebar">
    <div class="filters-sticky">
      <h3>Filtros</h3>

      <!-- Filtro por ciudad -->
      <div class="filter-group">
        <h4>📍 Ciudad</h4>
        <label>
          <input type="checkbox" name="city" value="asuncion" />
          Asunción
        </label>
        <label>
          <input type="checkbox" name="city" value="cde" />
          Ciudad del Este
        </label>
        <label>
          <input type="checkbox" name="city" value="luque" />
          Luque
        </label>
      </div>

      <!-- Filtro por rating -->
      <div class="filter-group">
        <h4>⭐ Rating mínimo</h4>
        <div class="star-rating">
          <button data-rating="1">⭐</button>
          <button data-rating="2">⭐⭐</button>
          <button data-rating="3">⭐⭐⭐</button>
          <button data-rating="4">⭐⭐⭐⭐</button>
          <button data-rating="5">⭐⭐⭐⭐⭐</button>
        </div>
      </div>

      <!-- Filtro por precio -->
      <div class="filter-group">
        <h4>💰 Precio máximo</h4>
        <input type="range" min="0" max="500000" step="10000" />
        <span id="price-value">Gs. 150.000</span>
      </div>

      <!-- Filtro por amenities -->
      <div class="filter-group">
        <h4>✨ Amenities</h4>
        <label>
          <input type="checkbox" name="amenity" value="wifi" />
          Wi-Fi
        </label>
        <label>
          <input type="checkbox" name="amenity" value="parking" />
          Estacionamiento
        </label>
        <label>
          <input type="checkbox" name="amenity" value="jacuzzi" />
          Jacuzzi
        </label>
        <label>
          <input type="checkbox" name="amenity" value="ac" />
          Aire acondicionado
        </label>
      </div>

      <button class="apply-filters">Aplicar filtros</button>
    </div>
  </aside>

  <!-- Contenido principal -->
  <main class="results-main">
    <div class="results-header">
      <h2>12 moteles encontrados</h2>
      <select class="sort-select">
        <option>Más relevantes</option>
        <option>Precio: menor a mayor</option>
        <option>Precio: mayor a menor</option>
        <option>Mejor valorados</option>
        <option>Más cercanos</option>
      </select>
    </div>

    <div class="motels-grid">
      <!-- Cards de moteles -->
    </div>
  </main>
</div>
```

### CSS para Sticky Sidebar

```css
.page-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.filters-sidebar {
  position: relative;
}

.filters-sticky {
  position: sticky;
  top: 100px; /* Altura del header + margen */
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.filter-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.filter-group:last-child {
  border-bottom: none;
}

.filter-group h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.filter-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.apply-filters {
  width: 100%;
  background: #822DE2;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.apply-filters:hover {
  background: #6b23b8;
}

/* Mobile: Filtros en drawer o modal */
@media (max-width: 1024px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    display: none; /* Mostrar en modal/drawer */
  }
}
```

---

## 4. Breadcrumbs para SEO y UX

### Beneficios
- Mejora SEO (structured data)
- Ayuda a navegación
- Muestra contexto al usuario

### Implementación

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a href="/" itemprop="item">
        <span itemprop="name">Inicio</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li aria-hidden="true">›</li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a href="/motels" itemprop="item">
        <span itemprop="name">Moteles</span>
      </a>
      <meta itemprop="position" content="2" />
    </li>
    <li aria-hidden="true">›</li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a href="/motels/asuncion" itemprop="item">
        <span itemprop="name">Asunción</span>
      </a>
      <meta itemprop="position" content="3" />
    </li>
    <li aria-hidden="true">›</li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">Paradise Motel</span>
      <meta itemprop="position" content="4" />
    </li>
  </ol>
</nav>
```

### CSS

```css
.breadcrumbs {
  padding: 1rem 0;
  font-size: 0.9rem;
}

.breadcrumbs ol {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumbs li {
  display: flex;
  align-items: center;
}

.breadcrumbs a {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: #822DE2;
  text-decoration: underline;
}

.breadcrumbs li:last-child {
  color: #333;
  font-weight: 600;
}
```

---

## 5. Lightbox de Galería

### Features
- Fullscreen overlay
- Navegación con flechas (← →)
- Thumbnails en la parte inferior
- Cerrar con ESC o X
- Swipe en mobile
- Zoom con click

### Implementación con Librería

```bash
npm install photoswipe
```

```typescript
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

useEffect(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#motel-gallery',
    children: 'a',
    pswpModule: () => import('photoswipe'),
  });

  lightbox.init();

  return () => {
    lightbox.destroy();
  };
}, []);

// HTML
<div id="motel-gallery" class="gallery">
  {motel.photos.map((photo, index) => (
    <a
      href={photo.url}
      data-pswp-width={photo.width}
      data-pswp-height={photo.height}
      key={index}
      target="_blank"
      rel="noreferrer"
    >
      <img src={photo.thumbnail} alt={photo.caption} />
    </a>
  ))}
</div>
```

---

## 6. Mapa Interactivo

### Features
- Vista de mapa de todos los moteles
- Markers con precio
- Clustering cuando hay muchos cercanos
- Click en marker → Mini card
- Toggle entre vista Lista y Mapa

### Implementación

```bash
npm install @googlemaps/react-wrapper
```

```typescript
import { Wrapper } from "@googlemaps/react-wrapper";

const MapView = ({ motels }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -25.2637, lng: -57.5759 }, // Asunción
      zoom: 12,
    });

    // Agregar markers
    motels.forEach((motel) => {
      const marker = new google.maps.Marker({
        position: { lat: motel.lat, lng: motel.lng },
        map,
        title: motel.name,
        label: {
          text: `Gs. ${(motel.price / 1000).toFixed(0)}k`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });

      // Click en marker
      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 1rem;">
              <img src="${motel.photo}" style="width: 200px; height: 120px; object-fit: cover; border-radius: 8px;" />
              <h3>${motel.name}</h3>
              <p>${motel.city}</p>
              <p>⭐ ${motel.rating}/5</p>
              <a href="/motels/${motel.id}">Ver detalles →</a>
            </div>
          `,
        });
        infoWindow.open(map, marker);
      });
    });
  }, [motels]);

  return <div ref={mapRef} style={{ width: '100%', height: '600px' }} />;
};

// Wrapper component
<Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
  <MapView motels={motels} />
</Wrapper>
```

---

## 7. Lazy Loading de Imágenes

### Beneficios
- Mejora performance inicial
- Ahorra ancho de banda
- Mejor Core Web Vitals

### Implementación Nativa

```html
<img
  src={motel.photo}
  loading="lazy"
  alt={motel.name}
  width="400"
  height="300"
/>
```

### Con Next.js Image

```typescript
import Image from 'next/image';

<Image
  src={motel.photo}
  alt={motel.name}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={motel.photoThumbnail} // Base64 thumbnail
  quality={80}
  priority={index < 3} // Primeras 3 imágenes no lazy
/>
```

### Blur-up Effect con CSS

```css
.image-container {
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(20px);
  transform: scale(1.1);
  transition: opacity 0.3s;
}

.image-loaded + .image-placeholder {
  opacity: 0;
}
```

---

## 8. Call-to-Actions Claros

### Ubicaciones Estratégicas
1. Hero section
2. Detalle de motel
3. Sticky bar en mobile
4. Final de página

### Ejemplo: Detalle de Motel

```html
<section class="cta-section">
  <h3>¿Te interesa este motel?</h3>
  <p>Contactá directamente para reservar</p>

  <div class="cta-buttons">
    <button class="cta-primary">
      📞 Llamar ahora
    </button>

    <button class="cta-secondary">
      💬 Enviar WhatsApp
    </button>

    <button class="cta-tertiary">
      🗺️ Cómo llegar
    </button>
  </div>
</section>

<!-- Sticky bottom bar en mobile -->
<div class="mobile-cta-bar">
  <button class="btn-phone">
    Ver teléfono
  </button>
  <button class="btn-whatsapp">
    WhatsApp
  </button>
</div>
```

### CSS

```css
.cta-section {
  background: linear-gradient(135deg, #822DE2, #F56565);
  color: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  margin: 3rem 0;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.cta-primary {
  background: white;
  color: #822DE2;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.cta-primary:hover {
  transform: scale(1.05);
}

.cta-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.cta-secondary:hover {
  background: rgba(255,255,255,0.3);
}

/* Mobile sticky bar */
.mobile-cta-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 100;
  gap: 1rem;
}

@media (max-width: 768px) {
  .mobile-cta-bar {
    display: flex;
  }
}

.mobile-cta-bar button {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-phone {
  background: #822DE2;
  color: white;
  border: none;
}

.btn-whatsapp {
  background: #25D366;
  color: white;
  border: none;
}
```

---

## 9. Social Proof

### Elementos de Confianza
- Cantidad de moteles verificados
- Número de reviews
- Usuarios activos
- Reviews destacados

### Implementación

```html
<section class="social-proof">
  <div class="stats-row">
    <div class="stat-card">
      <strong>+50</strong>
      <span>moteles verificados</span>
    </div>

    <div class="stat-card">
      <strong>+1,000</strong>
      <span>reviews reales</span>
    </div>

    <div class="stat-card">
      <strong>127</strong>
      <span>personas visitaron hoy</span>
    </div>

    <div class="stat-card">
      <strong>4.5⭐</strong>
      <span>rating promedio</span>
    </div>
  </div>

  <!-- Reviews destacados -->
  <div class="featured-reviews">
    <h3>Lo que dicen nuestros usuarios</h3>

    <div class="reviews-grid">
      <div class="review-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p>"Excelente lugar, muy limpio y cómodo. El personal muy amable."</p>
        <cite>— María L.</cite>
      </div>

      <div class="review-card">
        <div class="stars">⭐⭐⭐⭐</div>
        <p>"Buena ubicación y precio accesible. Lo recomiendo."</p>
        <cite>— Carlos M.</cite>
      </div>

      <div class="review-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p>"Impecable la atención. Volveríamos sin dudarlo."</p>
        <cite>— Laura P.</cite>
      </div>
    </div>
  </div>
</section>
```

### CSS

```css
.social-proof {
  padding: 4rem 2rem;
  background: #f9fafb;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-card strong {
  display: block;
  font-size: 2.5rem;
  color: #822DE2;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-card span {
  color: #666;
  font-size: 0.9rem;
}

.featured-reviews h3 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1a1a1a;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.review-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.review-card .stars {
  color: #FFD700;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.review-card p {
  color: #333;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.review-card cite {
  color: #666;
  font-style: normal;
  font-weight: 600;
}
```

---

## 11. Filtros con URL Params

### Beneficios
- URLs compartibles
- SEO-friendly
- Bookmarkeable
- Back button funciona

### Ejemplo de URLs

```
/motels?city=asuncion
/motels?city=asuncion&rating=4
/motels?city=asuncion&rating=4&amenities=wifi,parking
/motels?city=asuncion&minPrice=50000&maxPrice=150000
```

### Implementación con Next.js

```typescript
import { useRouter, useSearchParams } from 'next/navigation';

const MotelsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Leer params actuales
  const city = searchParams.get('city');
  const rating = searchParams.get('rating');
  const amenities = searchParams.get('amenities')?.split(',') || [];

  // Actualizar filtros
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/motels?${params.toString()}`);
  };

  // Ejemplo: filtro por ciudad
  <select
    value={city || ''}
    onChange={(e) => updateFilters('city', e.target.value)}
  >
    <option value="">Todas las ciudades</option>
    <option value="asuncion">Asunción</option>
    <option value="cde">Ciudad del Este</option>
  </select>
};
```

---

## 12. Progressive Web App (PWA)

### Beneficios
- Instalable en home screen
- Funciona offline
- Notificaciones web push
- Carga más rápida

### manifest.json

```json
{
  "name": "Jahatelo - Moteles en Paraguay",
  "short_name": "Jahatelo",
  "description": "Encontrá el motel perfecto en Paraguay",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#822DE2",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["travel", "lifestyle"]
}
```

### Service Worker Básico

```javascript
// service-worker.js
const CACHE_NAME = 'jahatelo-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/script/main.js',
  '/offline.html'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit
        if (response) {
          return response;
        }

        // Fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Offline fallback
        return caches.match('/offline.html');
      })
  );
});
```

### Registrar Service Worker

```javascript
// En tu app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

---

## 13. Performance Optimizations

### 13.1 Image Optimization (Next.js)

```typescript
import Image from 'next/image';

<Image
  src={motel.photo}
  alt={motel.name}
  width={400}
  height={300}
  quality={80} // Ajustar calidad (default: 75)
  priority={index < 3} // Cargar primeras 3 sin lazy
  placeholder="blur" // Blur-up effect
  blurDataURL={motel.thumbnail}
/>
```

### 13.2 Code Splitting

```typescript
// Lazy load de componentes
import { lazy, Suspense } from 'react';

const MotelMap = lazy(() => import('./MotelMap'));
const MotelGallery = lazy(() => import('./MotelGallery'));

<Suspense fallback={<Skeleton />}>
  <MotelMap />
</Suspense>
```

### 13.3 Prefetch de Links

```typescript
import Link from 'next/link';

// Next.js prefetch automáticamente links visibles
<Link href={`/motels/${motel.id}`} prefetch>
  Ver motel
</Link>
```

### 13.4 Debounce en Búsqueda

```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

const debouncedSearch = useMemo(
  () => debounce((query) => {
    fetchResults(query);
  }, 300),
  []
);

<input
  type="text"
  onChange={(e) => debouncedSearch(e.target.value)}
/>
```

### 13.5 Infinite Scroll

```typescript
import { useInfiniteScroll } from 'react-infinite-scroll-hook';

const [loading, setLoading] = useState(false);
const [hasNextPage, setHasNextPage] = useState(true);
const [items, setItems] = useState([]);

const loadMore = async () => {
  setLoading(true);
  const newItems = await fetchMoreMotels(page);
  setItems([...items, ...newItems]);
  setHasNextPage(newItems.length > 0);
  setLoading(false);
};

const [sentryRef] = useInfiniteScroll({
  loading,
  hasNextPage,
  onLoadMore: loadMore,
  rootMargin: '0px 0px 400px 0px', // Cargar antes de llegar al final
});

// En el render
<div>
  {items.map(item => <MotelCard key={item.id} motel={item} />)}
  {(loading || hasNextPage) && <div ref={sentryRef}>Loading...</div>}
</div>
```

---

## 14. Micro-interactions

### Animaciones Sutiles que Mejoran UX

```css
/* 1. Botón de favorito con scale */
.favorite-btn {
  transition: transform 0.2s ease;
}

.favorite-btn:active {
  transform: scale(0.9);
}

/* 2. Loading skeleton con shimmer */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 3. Transición suave de filtros */
.results-grid {
  transition: opacity 0.3s ease;
}

.results-grid.loading {
  opacity: 0.5;
}

/* 4. Hover en badges con scale */
.badge {
  transition: transform 0.2s ease;
}

.card:hover .badge {
  transform: scale(1.1);
}

/* 5. Input focus con glow */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(130, 45, 226, 0.1);
  border-color: #822DE2;
}

/* 6. Ripple effect en botones */
.button {
  position: relative;
  overflow: hidden;
}

.button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.button:active::after {
  width: 300px;
  height: 300px;
}

/* 7. Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* 8. Tooltip con fade */
.tooltip {
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.has-tooltip:hover .tooltip {
  opacity: 1;
}
```

---

## 15. Accesibilidad (A11y)

### Principios
- **Perceptible:** Todos pueden ver/oír el contenido
- **Operable:** Todos pueden usar la interfaz
- **Comprensible:** Contenido y UI claros
- **Robusto:** Compatible con tecnologías asistivas

### Implementación

#### 15.1 Semantic HTML

```html
<!-- ✅ BIEN -->
<nav aria-label="Navegación principal">
  <ul>
    <li><a href="/">Inicio</a></li>
    <li><a href="/motels">Moteles</a></li>
  </ul>
</nav>

<main id="main-content">
  <h1>Moteles en Asunción</h1>
  <article>...</article>
</main>

<footer>...</footer>

<!-- ❌ MAL -->
<div class="nav">
  <div><div onclick="goHome()">Inicio</div></div>
</div>
```

#### 15.2 Alt Text Descriptivo

```html
<!-- ✅ BIEN -->
<img
  src="paradise.jpg"
  alt="Habitación suite con jacuzzi y cama king size del Paradise Motel"
/>

<!-- ❌ MAL -->
<img src="paradise.jpg" alt="imagen" />
<img src="paradise.jpg" alt="" />
```

#### 15.3 Labels para Form Fields

```html
<!-- ✅ BIEN -->
<label for="search">Buscar moteles</label>
<input
  id="search"
  type="text"
  name="search"
  aria-label="Buscar moteles por nombre o ciudad"
/>

<!-- Con label visual oculto -->
<label for="search" class="sr-only">Buscar moteles</label>
<input
  id="search"
  type="text"
  placeholder="Buscar..."
/>
```

#### 15.4 Focus Visible

```css
/* Estilos de focus visibles */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #822DE2;
  outline-offset: 2px;
}

/* NO hacer esto */
*:focus {
  outline: none; /* ❌ */
}
```

#### 15.5 ARIA Landmarks

```html
<header role="banner">
  <nav role="navigation" aria-label="Navegación principal">
    ...
  </nav>
</header>

<main role="main" id="main-content">
  <section aria-labelledby="results-heading">
    <h2 id="results-heading">Resultados de búsqueda</h2>
    ...
  </section>
</main>

<aside role="complementary" aria-label="Filtros">
  ...
</aside>

<footer role="contentinfo">
  ...
</footer>
```

#### 15.6 Keyboard Navigation

```javascript
// Cerrar modal con ESC
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, []);

// Tab order lógico
<div>
  <input tabIndex={1} />
  <button tabIndex={2}>Buscar</button>
  <button tabIndex={3}>Limpiar</button>
</div>
```

#### 15.7 ARIA Live Regions

```html
<!-- Anunciar cambios dinámicos -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {loading ? 'Cargando moteles...' : `${motels.length} moteles encontrados`}
</div>

<!-- Para errores urgentes -->
<div
  role="alert"
  aria-live="assertive"
>
  {error && 'Error al cargar moteles. Por favor intentá de nuevo.'}
</div>
```

#### 15.8 Skip Links

```html
<a href="#main-content" class="skip-link">
  Saltar al contenido principal
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #822DE2;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

#### 15.9 Color Contrast

```css
/* WCAG AA requiere ratio mínimo de 4.5:1 */

/* ✅ BIEN */
.text {
  color: #1a1a1a; /* Sobre fondo blanco: ratio 16:1 */
}

/* ❌ MAL */
.text {
  color: #aaa; /* Sobre fondo blanco: ratio 2.3:1 ❌ */
}

/* Herramienta: https://webaim.org/resources/contrastchecker/ */
```

---

# 📊 SISTEMA DE ANALYTICS Y TRACKING

## Objetivo

Identificar **usuarios únicos**, medir **frecuencia de visitas**, diferenciar por **plataforma detallada** (Android, iOS, Web Desktop, Web Mobile) y entender el comportamiento del usuario.

---

## 📋 Estado Actual del Sistema

### ✅ Lo que YA tienen implementado:

1. **Tracking de eventos específicos**
   - Vista de motel (VIEW)
   - Click en teléfono (CLICK_PHONE)
   - Click en WhatsApp (CLICK_WHATSAPP)
   - Click en mapa (CLICK_MAP)
   - Click en sitio web (CLICK_WEBSITE)
   - Favoritos (FAVORITE_ADD/REMOVE)

2. **Diferenciación básica por plataforma**
   ```typescript
   deviceType: 'WEB' | 'MOBILE'
   ```

3. **Dashboard de analytics en admin**
   - Vista global en `/admin/analytics`
   - Filtros por período (7, 30, 90 días)
   - Métricas: Views, clicks, favoritos, conversión
   - Gráficos por día, fuente, dispositivo
   - Top moteles y ciudades

### ❌ Gaps críticos:

1. **No identifican usuarios únicos** - Cada evento es anónimo
2. **No miden frecuencia de visitas** - No saben si un usuario volvió 3 o 30 veces
3. **No agrupan eventos en sesiones** - No hay concepto de "visita"
4. **No hay identificador persistente** del usuario entre visitas
5. **No trackean page views globales** - Solo eventos específicos de moteles

---

## 🚀 SOLUCIÓN: 3 Capas de Analytics

### Capa 1: Analytics Anónimo Mejorado ⭐ RECOMENDADO

**Esfuerzo:** 4-6 horas
**Costo:** $0
**Herramienta:** Cookies + localStorage + fingerprinting básico

#### Qué resuelve:
- ✅ **Usuarios únicos:** Identificación anónima persistente
- ✅ **Frecuencia de visitas:** Cuántas veces volvió cada usuario
- ✅ **Sesiones:** Agrupar eventos por visita (timeout 30 min)
- ✅ **Plataforma detallada:** Android, iOS, Web Desktop, Web Mobile
- ✅ **Page views globales:** Trackear navegación completa
- ✅ **100% control de datos:** Todo en tu base de datos

#### Dashboard nuevo te daría:
```
📊 Usuarios Únicos (últimos 30 días): 1,247
├─ 💻 Web Desktop: 523 (42%)
├─ 📱 Web Mobile: 418 (33%)
├─ 🤖 Android App: 218 (17%)
└─ 🍎 iOS App: 88 (7%)

🔄 Frecuencia de Visitas:
├─ 1 día: 847 usuarios (68%)
├─ 2-3 días: 245 usuarios (20%)
├─ 4-7 días: 98 usuarios (8%)
└─ 7+ días: 57 usuarios (5%)

⏱️ Sesiones:
├─ Total: 2,834 sesiones
├─ Duración promedio: 4.3 min
└─ Páginas por sesión: 3.8
```

#### Implementación técnica:

**1. Sistema de identificación de usuarios**

Crear `lib/userIdentification.ts`:
- Generar User ID único por dispositivo
- Persistir en localStorage + cookie (2 años)
- Generar Session ID (timeout 30 min en sessionStorage)
- Detectar plataforma: OS, browser, mobile/desktop

**2. Actualizar eventos existentes**

Modificar `lib/analyticsService.ts`:
- Agregar `userId` y `sessionId` a cada evento
- Mejorar `deviceType` de "WEB/MOBILE" a "web-desktop", "web-mobile", "mobile-android", "mobile-ios"
- Agregar `deviceOs` y `deviceBrowser`

**3. Nuevas tablas en Prisma**

```prisma
model MotelAnalytics {
  // ... campos existentes
  userId       String?   // ⭐ NUEVO
  sessionId    String?   // ⭐ NUEVO
  deviceOs     String?   // ⭐ NUEVO
  deviceBrowser String?  // ⭐ NUEVO

  @@index([userId, timestamp])
  @@index([sessionId])
}

model PageView {
  id            String   @id @default(cuid())
  pagePath      String
  pageTitle     String?
  timestamp     DateTime @default(now())
  userId        String
  sessionId     String
  deviceType    String?
  deviceOs      String?
  deviceBrowser String?
  duration      Int?     // Tiempo en página

  @@index([userId, timestamp])
  @@index([sessionId])
}

model UserSession {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String   @unique
  startTime     DateTime @default(now())
  endTime       DateTime?
  duration      Int?
  pageViewCount Int      @default(0)
  eventCount    Int      @default(0)
  pagesVisited  String[]

  @@index([userId, startTime])
}
```

**4. Nuevos endpoints**

- `POST /api/analytics/pageview` - Trackear cada cambio de página
- `GET /api/admin/analytics/users` - Dashboard de usuarios únicos
- Actualizar `POST /api/analytics/track` con nuevos campos

**5. Auto-tracking de page views**

Crear hook `usePageTracking()` que trackea automáticamente cada cambio de ruta en Next.js.

#### Queries disponibles después:

```sql
-- Usuarios únicos por período
SELECT COUNT(DISTINCT "userId")
FROM "MotelAnalytics"
WHERE "timestamp" >= NOW() - INTERVAL '30 days';

-- Usuarios por plataforma
SELECT
  "deviceType",
  COUNT(DISTINCT "userId") as unique_users
FROM "MotelAnalytics"
WHERE "timestamp" >= NOW() - INTERVAL '30 days'
GROUP BY "deviceType";

-- Usuarios recurrentes (visitaron 2+ días)
SELECT
  COUNT(*) as returning_users
FROM (
  SELECT "userId", COUNT(DISTINCT DATE("timestamp")) as visit_days
  FROM "MotelAnalytics"
  WHERE "timestamp" >= NOW() - INTERVAL '30 days'
  GROUP BY "userId"
  HAVING COUNT(DISTINCT DATE("timestamp")) > 1
) subquery;

-- Páginas más visitadas
SELECT
  "pagePath",
  COUNT(*) as views,
  COUNT(DISTINCT "userId") as unique_visitors
FROM "PageView"
WHERE "timestamp" >= NOW() - INTERVAL '7 days'
GROUP BY "pagePath"
ORDER BY views DESC
LIMIT 10;
```

---

### Capa 2: Google Analytics 4 ⭐ COMPLEMENTARIO

**Esfuerzo:** 2 horas
**Costo:** $0 (gratis hasta 10M eventos/mes)
**Herramienta:** GA4 + Google Tag Manager

#### Ventajas:
- ✅ **Dashboards profesionales** listos para usar
- ✅ **Reportes automáticos** por email
- ✅ **Comparación con benchmarks** de la industria
- ✅ **Audiencias** para remarketing si hacen publicidad
- ✅ **Análisis de flujo** de usuarios
- ✅ **Integración con Google Ads** si lo usan
- ✅ **Data backup** - Si falla tu DB, tenés datos en GA4

#### Implementación:

**1. Crear cuenta GA4**
- Ir a https://analytics.google.com
- Crear propiedad nueva
- Obtener Measurement ID (G-XXXXXXXXX)

**2. Instalar en Next.js**

```bash
npm install @next/third-parties
```

```typescript
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleTagManager gtmId="GTM-XXXXXX" />
      </body>
    </html>
  )
}
```

**3. Dual tracking**

Modificar `lib/analyticsService.ts` para enviar a ambos:

```typescript
export const trackEvent = async (params) => {
  // 1. Tu base de datos (como antes)
  await fetch('/api/analytics/track', { ... });

  // 2. Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', params.eventType.toLowerCase(), {
      motel_id: params.motelId,
      source: params.source,
      device_type: params.deviceType,
    });
  }
};
```

**4. Eventos a configurar en GTM**
- `page_view` (automático)
- `motel_view`
- `click_phone`
- `click_whatsapp`
- `add_to_favorites`
- `share_motel`

#### Reportes que tendrías en GA4:
- **Adquisición:** De dónde vienen los usuarios (Google, Facebook, directo)
- **Engagement:** Tiempo promedio, páginas por sesión
- **Retención:** Usuarios que vuelven
- **Conversiones:** Funnels personalizados
- **Real-time:** Usuarios activos ahora mismo
- **Demografía:** Edad y género (si está disponible)
- **Tecnología:** Dispositivos, navegadores, resoluciones

---

### Capa 3: Mixpanel / Amplitude 💎 AVANZADO

**Esfuerzo:** 6-8 horas
**Costo:** $89-299/mes (según volumen)
**Herramienta:** Mixpanel o Amplitude

#### Cuándo considerarlo:

Después de 2-3 meses con Capa 1 + 2, SI necesitan:

1. **Funnels avanzados** con tasas de conversión automáticas
   - Ejemplo: "Cuántos que vieron motel → hicieron click → llamaron"

2. **Cohorte analysis**
   - Ejemplo: "Usuarios que se registraron en enero, ¿cuántos volvieron en febrero?"

3. **Retention curves**
   - Gráficos automáticos de retención día 1, 7, 30

4. **A/B testing nativo**
   - Probar 2 versiones de una feature y ver cuál funciona mejor

5. **User profiles**
   - Ver el recorrido completo de un usuario específico

6. **Predictive analytics**
   - "Este usuario tiene 80% probabilidad de hacer conversión"

#### Ventajas:
- Dashboards más potentes que GA4
- Queries visuales sin SQL
- Exportación de audiencias
- Alerts automáticas

#### Desventajas:
- Costo mensual
- Curva de aprendizaje
- Vendor lock-in

---

## 📊 Comparación de las 3 Capas

| Feature | Capa 1 (Custom) | Capa 2 (GA4) | Capa 3 (Mixpanel) |
|---------|----------------|--------------|-------------------|
| **Usuarios únicos** | ✅ | ✅ | ✅ |
| **Frecuencia visitas** | ✅ | ✅ | ✅ |
| **Plataformas** | ✅ Detallado | ✅ Básico | ✅ Detallado |
| **Sesiones** | ✅ | ✅ | ✅ |
| **Page views** | ✅ | ✅ | ✅ |
| **Costo** | $0 | $0 | $89-299/mes |
| **Setup time** | 4-6 horas | 2 horas | 6-8 horas |
| **Dashboards** | Custom | Built-in | Built-in Pro |
| **Funnels** | Manual | Básico | Avanzado |
| **Retention** | Manual | Básico | Avanzado |
| **A/B Testing** | ❌ | ❌ | ✅ |
| **Data ownership** | 100% tuyo | Google | Mixpanel |
| **SQL access** | ✅ | ❌ | ⚠️ Limited |
| **Privacy** | ✅ Total | ⚠️ Google | ⚠️ Third-party |

---

## 💡 Recomendación

### Fase 1 (AHORA): Capa 1 + Capa 2

**Razón:**
1. **Capa 1** te da control total y datos propios
2. **GA4** te da dashboards gratis de nivel empresarial
3. Entre ambas cubren el 95% de necesidades
4. **Total: 6-8 horas, $0 de costo**
5. Backup de datos mutuo (si una falla, tenés la otra)

### Fase 2 (2-3 meses después): Evaluar Capa 3

Solo si:
- Necesitan funnels avanzados con tasas de conversión automáticas
- Quieren hacer A/B testing de features
- Necesitan cohorte analysis frecuente
- Tienen budget para $100-300/mes

---

## 🎯 Métricas Clave a Trackear

### Para Negocio:
1. **DAU (Daily Active Users)** - Usuarios únicos por día
2. **MAU (Monthly Active Users)** - Usuarios únicos por mes
3. **Retention D1, D7, D30** - % que vuelve después de 1, 7, 30 días
4. **Session Duration** - Tiempo promedio de sesión
5. **Conversion Rate** - % que llama/WhatsApp después de ver motel

### Para Producto:
1. **Feature Adoption** - % usuarios que usan cada feature
2. **Drop-off Points** - Dónde abandonan el sitio
3. **Most Viewed Pages** - Páginas más visitadas
4. **Search Success Rate** - % búsquedas que resultan en click
5. **Error Rate** - Errores 404, 500, etc.

### Para Marketing:
1. **Traffic Sources** - De dónde vienen (Google, Facebook, directo)
2. **Campaign Performance** - ROI de campañas publicitarias
3. **Referrals** - Quién les refiere tráfico
4. **Conversion by Channel** - Cuál canal convierte mejor
5. **Cost per Acquisition** - Costo de adquirir cada usuario

---

## 📋 Plan de Implementación

### Sprint 1: Capa 1 (Custom Analytics)
**Duración:** 1-2 días

**Tareas:**
1. [ ] Crear `lib/userIdentification.ts` con lógica de User ID
2. [ ] Actualizar `lib/analyticsService.ts` con nuevos campos
3. [ ] Agregar tablas a Prisma schema: `PageView`, `UserSession`
4. [ ] Actualizar tabla `MotelAnalytics` con nuevos campos
5. [ ] Ejecutar migración: `npx prisma migrate dev`
6. [ ] Crear endpoint `POST /api/analytics/pageview`
7. [ ] Actualizar endpoint `POST /api/analytics/track`
8. [ ] Crear hook `usePageTracking()` para auto-tracking
9. [ ] Integrar hook en layouts públicos
10. [ ] Crear endpoint `GET /api/admin/analytics/users`
11. [ ] Crear página de dashboard en `/admin/analytics/users`
12. [ ] Testing en desarrollo
13. [ ] Deploy a producción

### Sprint 2: Capa 2 (GA4)
**Duración:** 3-4 horas

**Tareas:**
1. [ ] Crear cuenta Google Analytics 4
2. [ ] Obtener Measurement ID (G-XXXXXXXXX)
3. [ ] Instalar `@next/third-parties`
4. [ ] Agregar GTM a `app/layout.tsx`
5. [ ] Configurar eventos custom en GTM
6. [ ] Implementar dual tracking en `analyticsService.ts`
7. [ ] Verificar eventos en GA4 Real-time
8. [ ] Configurar conversiones (goals)
9. [ ] Crear dashboard personalizado en GA4

### Sprint 3: Dashboard Avanzado
**Duración:** 1-2 días

**Tareas:**
1. [ ] Crear gráficos de usuarios únicos por día
2. [ ] Implementar comparación período anterior
3. [ ] Agregar filtros por plataforma
4. [ ] Crear reporte de usuarios recurrentes
5. [ ] Implementar funnel de conversión
6. [ ] Exportar reportes a CSV
7. [ ] Agregar alertas automáticas (ej: drop en usuarios)

---

## 🔒 Consideraciones de Privacidad

### GDPR / Privacidad
1. **Consentimiento:** Pedir permiso antes de cookies analíticas
2. **Anonimización:** No guardar IPs ni datos personales
3. **Derecho al olvido:** Permitir borrar datos de usuario
4. **Transparencia:** Política de privacidad clara

### Implementación de Consent Banner

```typescript
// components/CookieConsent.tsx
'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('analytics_consent', 'accepted');
    setShowBanner(false);
    // Iniciar tracking
    initializeAnalytics();
  };

  const rejectCookies = () => {
    localStorage.setItem('analytics_consent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm">
          Usamos cookies para mejorar tu experiencia.{' '}
          <a href="/privacidad" className="underline">
            Ver política de privacidad
          </a>
        </p>
        <div className="flex gap-2">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 bg-slate-700 rounded"
          >
            Rechazar
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 bg-purple-600 rounded"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing y Validación

### Verificar implementación:

**1. User ID persiste entre visitas**
```javascript
// En browser console
const userId1 = localStorage.getItem('jahatelo_user_id');
console.log('User ID:', userId1);

// Recargar página
const userId2 = localStorage.getItem('jahatelo_user_id');
console.log('User ID después de reload:', userId2);

// Deberían ser iguales
```

**2. Sesiones se crean correctamente**
```sql
-- Verificar en DB
SELECT * FROM "UserSession"
WHERE "startTime" >= NOW() - INTERVAL '1 hour'
ORDER BY "startTime" DESC;
```

**3. Page views se registran**
```sql
-- Últimos page views
SELECT * FROM "PageView"
ORDER BY "timestamp" DESC
LIMIT 10;
```

**4. Usuarios únicos por plataforma**
```sql
SELECT
  "deviceType",
  COUNT(DISTINCT "userId") as unique_users
FROM "MotelAnalytics"
WHERE "timestamp" >= NOW() - INTERVAL '7 days'
GROUP BY "deviceType";
```

---

## 📚 Documentación de Referencia

- **Plan completo:** `docs/ANALYTICS-UPGRADE-PLAN.md`
- **Código de implementación:** Ver plan completo para snippets
- **Queries SQL:** Ver plan completo para queries útiles
- **GA4 Setup:** https://support.google.com/analytics
- **GTM Setup:** https://tagmanager.google.com

---

# 📊 MÉTRICAS PARA MEDIR IMPACTO

## App Móvil

### 1. Tasa de Conversión
**Métrica:** % que llaman/WhatsApp después de ver motel
**Target:** >15%
**Cómo medir:** Analytics en botones de llamar/WhatsApp

### 2. Time to Action
**Métrica:** Tiempo desde abrir app hasta contactar motel
**Target:** <2 minutos
**Cómo medir:** Firebase Analytics con custom events

### 3. Retention
**Métrica:** % que vuelve después de 7 días
**Target:** >40%
**Cómo medir:** Firebase Analytics retention reports

### 4. Favorite Rate
**Métrica:** % que agrega a favoritos
**Target:** >25%
**Cómo medir:** Track evento "add_to_favorites"

### 5. Session Duration
**Métrica:** Tiempo promedio en la app
**Target:** >3 minutos
**Cómo medir:** Firebase Analytics

### 6. Crash Rate
**Métrica:** % de sesiones con crashes
**Target:** <1%
**Cómo medir:** Crashlytics

---

## Web

### 1. Bounce Rate
**Métrica:** % que abandona sin interactuar
**Target:** <50%
**Cómo medir:** Google Analytics

### 2. Time on Page
**Métrica:** Tiempo en detalle de motel
**Target:** >2 minutos
**Cómo medir:** Google Analytics

### 3. Click-through Rate
**Métrica:** % que hace click en motel desde lista
**Target:** >30%
**Cómo medir:** Google Analytics events

### 4. Core Web Vitals

**LCP (Largest Contentful Paint)**
- Target: <2.5s
- Mide: Velocidad de carga del contenido principal

**FID (First Input Delay)**
- Target: <100ms
- Mide: Tiempo hasta que el sitio responde a interacciones

**CLS (Cumulative Layout Shift)**
- Target: <0.1
- Mide: Estabilidad visual (contenido que se mueve)

**Cómo medir:** Google PageSpeed Insights, Lighthouse

### 5. Conversion Rate
**Métrica:** % que contacta motel desde web
**Target:** >10%
**Cómo medir:** Google Analytics goals

### 6. Search Success Rate
**Métrica:** % de búsquedas que resultan en click
**Target:** >60%
**Cómo medir:** Custom tracking de búsquedas

---

# 🚀 PRIORIZACIÓN SUGERIDA

## Quick Wins (1-2 días)

### Alta Prioridad
1. ✅ **Skeleton loaders** en lugar de spinners
   - Impacto: Alto
   - Esfuerzo: Bajo
   - Mejora percepción de velocidad

2. ✅ **Pull-to-refresh** en app
   - Impacto: Alto
   - Esfuerzo: Muy Bajo
   - Gesture estándar esperado por usuarios

3. ✅ **Empty states amigables**
   - Impacto: Medio
   - Esfuerzo: Bajo
   - Mejor UX en casos de error

4. ✅ **Hover effects** en web
   - Impacto: Medio
   - Esfuerzo: Muy Bajo
   - Feedback visual básico

5. ✅ **Lazy loading de imágenes**
   - Impacto: Alto (performance)
   - Esfuerzo: Muy Bajo
   - Mejora Core Web Vitals

---

## Medium Effort (3-5 días)

### Alta Prioridad
1. 🟡 **Bottom sheet para filtros** (app)
   - Impacto: Alto
   - Esfuerzo: Medio
   - Mejor UX que modal fullscreen

2. 🟡 **Lightbox de galería** (web)
   - Impacto: Alto
   - Esfuerzo: Medio
   - Feature esperada para ver fotos

3. 🟡 **Favoritos con animación**
   - Impacto: Alto
   - Esfuerzo: Medio
   - Engagement y retention

4. 🟡 **Modo oscuro**
   - Impacto: Medio
   - Esfuerzo: Medio
   - Preferencia de muchos usuarios

---

## Long Term (1-2 semanas)

### Alta Prioridad
1. 🔴 **Onboarding completo**
   - Impacto: Alto
   - Esfuerzo: Alto
   - Primera impresión crítica

2. 🔴 **Mapa interactivo**
   - Impacto: Alto
   - Esfuerzo: Alto
   - Feature muy solicitada

3. 🔴 **PWA con offline support**
   - Impacto: Alto (web)
   - Esfuerzo: Alto
   - Instalable, mejor performance

4. 🔴 **Notificaciones push inteligentes**
   - Impacto: Alto (retention)
   - Esfuerzo: Alto
   - Marketing directo a usuarios

5. 🔴 **Sistema de reviews**
   - Impacto: Muy Alto
   - Esfuerzo: Muy Alto
   - Social proof, confianza

---

## Matriz de Priorización

```
      │ ALTO IMPACTO        │ BAJO IMPACTO
──────┼────────────────────┼─────────────────
BAJO  │ • Skeleton loaders │ • Breadcrumbs
ESFU. │ • Pull-to-refresh  │ • Micro-anim.
      │ • Lazy loading     │ • Tooltips
      │ • Empty states     │
──────┼────────────────────┼─────────────────
MEDIO │ • Bottom sheet     │ • Dark mode
ESFU. │ • Lightbox         │ • Share motel
      │ • Favoritos anim.  │ • Social proof
──────┼────────────────────┼─────────────────
ALTO  │ • Onboarding       │ • PWA
ESFU. │ • Mapa interactivo │ • Filtros URL
      │ • Push notif.      │ • A11y completo
      │ • Reviews system   │
```

**Leyenda:**
- **BAJO ESFU. + ALTO IMPACTO** = Hacer YA ✅
- **MEDIO ESFU. + ALTO IMPACTO** = Hacer pronto 🟡
- **ALTO ESFU. + ALTO IMPACTO** = Planificar bien 🔴
- **BAJO IMPACTO** = Hacer si sobra tiempo

---

## Roadmap Sugerido

### Sprint 1 (Semana 1-2)
**Tema:** Quick Wins
- Skeleton loaders
- Pull-to-refresh
- Empty states
- Hover effects
- Lazy loading

**Resultado esperado:** App y web se sienten más rápidas y pulidas

---

### Sprint 2 (Semana 3-4)
**Tema:** Engagement
- Bottom sheet filtros
- Favoritos con animación
- Compartir motel
- FAB con acciones

**Resultado esperado:** Usuarios interactúan más con la app

---

### Sprint 3 (Semana 5-6)
**Tema:** Galería y Media
- Lightbox de galería
- Gallery fullscreen (app)
- Optimización de imágenes
- Lazy loading avanzado

**Resultado esperado:** Fotos son protagonistas

---

### Sprint 4 (Semana 7-8)
**Tema:** Discovery
- Mapa interactivo (web)
- Filtros avanzados
- Búsqueda predictiva

**Resultado esperado:** Usuarios encuentran moteles más fácil

---

### Sprint 5 (Semana 9-10)
**Tema:** First-time Experience
- Onboarding completo
- Tour guiado
- Tips contextuales
- Empty states mejorados

**Resultado esperado:** Nuevos usuarios se enganchan rápido

---

### Sprint 6 (Semana 11-12)
**Tema:** Retention & Marketing
- Notificaciones push
- Sistema de favoritos mejorado
- PWA setup
- Deep linking

**Resultado esperado:** Usuarios vuelven regularmente

---

### Sprint 7+ (Mes 4+)
**Tema:** Social & Trust
- Sistema de reviews
- Social proof
- Integración social media
- Programa de referidos

**Resultado esperado:** Comunidad activa, crecimiento orgánico

---

# 📝 NOTAS FINALES

## Sugerencias adicionales (2025)

1. **Privacidad y permisos**
   - Definir consentimiento explícito para ubicación, notificaciones y analítica.
   - Asegurar fallback sin permisos (no bloquear navegación).

2. **Métricas mínimas por feature**
   - Antes de implementar, definir eventos y umbrales de éxito por canal (web vs app).
   - Mantener un checklist de tracking obligatorio por feature.

3. **MVP por iteraciones**
   - Para features complejas, definir un MVP medible antes de expandir.
   - Ejemplo: solo 1 variante de onboarding y 3 eventos clave.

4. **Performance con presupuesto**
   - Definir límites por página (LCP, CLS, tamaño JS).
   - Usar Lighthouse + métricas reales (RUM) para validar cada release.

5. **Accesibilidad pragmática**
   - Priorizar focus visible, labels correctos y contraste.
   - ARIA avanzada solo cuando el HTML semántico no alcanza.

6. **Push y PWA con validación previa**
   - Validar impacto con campañas in‑app o email antes de push.
   - PWA solo si hay retorno claro en engagement y performance.

## Principios de Diseño a Seguir

1. **Mobile-first:** Diseñar primero para móvil, luego desktop
2. **Progresive enhancement:** Funcionalidad básica siempre, features avanzadas como bonus
3. **Performance budget:** LCP < 2.5s, FID < 100ms
4. **Accesibilidad:** WCAG AA mínimo
5. **Feedback constante:** Siempre dar feedback al usuario (loading, success, error)

---

## Herramientas Recomendadas

### Testing
- **Lighthouse:** Performance y accesibilidad
- **WebPageTest:** Performance detallado
- **axe DevTools:** Accesibilidad
- **BrowserStack:** Testing cross-browser

### Analytics
- **Firebase Analytics:** App móvil
- **Google Analytics 4:** Web
- **Hotjar:** Heatmaps y recordings
- **Mixpanel:** Funnels y retention

### Performance
- **Next.js:** Framework con optimizaciones built-in
- **Vercel:** Hosting optimizado
- **Cloudinary:** Image CDN y optimization

---

## Recursos Adicionales

- [Material Design](https://material.io/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev](https://web.dev/)
- [Smashing Magazine](https://www.smashingmagazine.com/)

---

**Documento creado:** Enero 2025
**Versión:** 1.0
**Próxima revisión:** Después de implementar Sprint 1
