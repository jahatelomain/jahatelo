# 🎨 Mejoras Visuales y Microanimaciones - Jahatelo App

## 📋 Índice

1. [Animaciones de Entrada](#1-animaciones-de-entrada)
2. [Feedback Táctil y Gestos](#2-feedback-táctil-y-gestos)
3. [Transiciones entre Pantallas](#3-transiciones-entre-pantallas)
4. [Microanimaciones por Componente](#4-microanimaciones-por-componente)
5. [Estados de Carga y Placeholders](#5-estados-de-carga-y-placeholders)
6. [Animaciones de Éxito/Error](#6-animaciones-de-éxito-error)
7. [Detalles de Pulido Visual](#7-detalles-de-pulido-visual)
8. [Dependencias Necesarias](#8-dependencias-necesarias)
9. [Priorización](#9-priorización)

---

## 1. Animaciones de Entrada

### 🏠 **HomeScreen**

#### A. Animación de Header al Montar
- **Efecto**: Slide down + fade in
- **Duración**: 400ms
- **Timing**: Easing out
- **Implementación**:
  ```javascript
  // Header entra desde arriba
  translateY: -50 → 0
  opacity: 0 → 1
  ```

#### B. Animación de PromoCarousel
- **Efecto**: Fade in + scale up
- **Duración**: 500ms
- **Delay**: 100ms después del header
- **Implementación**:
  ```javascript
  scale: 0.95 → 1
  opacity: 0 → 1
  ```

#### C. Animación de Categories Grid
- **Efecto**: Staggered fade in (cascada)
- **Duración**: 300ms por item
- **Delay entre items**: 80ms
- **Implementación**:
  ```javascript
  // Cada categoría entra con delay incremental
  Item 1: delay 200ms
  Item 2: delay 280ms
  Item 3: delay 360ms...
  ```

#### D. Animación de Social Icons
- **Efecto**: Bounce in desde abajo
- **Duración**: 600ms
- **Delay**: 400ms
- **Implementación**:
  ```javascript
  translateY: 20 → 0
  opacity: 0 → 1
  // Con spring physics
  ```

---

### 🔍 **SearchScreen**

#### A. SearchBar Focus Animation
- **Efecto**: Expand + glow
- **Duración**: 250ms
- **Implementación**:
  ```javascript
  // Al hacer focus:
  scale: 1 → 1.02
  borderWidth: 1 → 2
  borderColor: gray → primary
  shadowRadius: 4 → 8
  ```

#### B. Resultados Entrando
- **Efecto**: Slide up + fade in (staggered)
- **Duración**: 300ms
- **Delay entre cards**: 50ms
- **Implementación**:
  ```javascript
  translateY: 20 → 0
  opacity: 0 → 1
  ```

#### C. Empty State Animation
- **Efecto**: Pulsating icon + fade in text
- **Duración**: 1200ms (loop)
- **Implementación**:
  ```javascript
  // Icono de búsqueda pulsa suavemente
  scale: 1 → 1.1 → 1 (loop)
  opacity: 0.5 → 1 → 0.5 (loop)
  ```

---

### ❤️ **FavoritesScreen**

#### A. Empty State Heart Animation
- **Efecto**: Beating heart
- **Duración**: 1500ms (loop)
- **Implementación**:
  ```javascript
  scale: 1 → 1.15 → 1 (loop)
  // Con easing ease-in-out
  ```

#### B. Lista de Favoritos
- **Efecto**: Slide in desde la derecha (staggered)
- **Duración**: 350ms
- **Delay**: 60ms entre items
- **Implementación**:
  ```javascript
  translateX: 30 → 0
  opacity: 0 → 1
  ```

#### C. Agregar/Remover Favorito
- **Efecto**: Heart pop + particles
- **Duración**: 500ms
- **Implementación**:
  ```javascript
  // Al agregar:
  scale: 1 → 1.5 → 1.2 → 1
  rotation: 0 → 360
  // Con 3-5 mini corazones que salen
  ```

---

### 👤 **ProfileScreen**

#### A. Avatar Pulse al Montar
- **Efecto**: Subtle pulse
- **Duración**: 800ms
- **Implementación**:
  ```javascript
  scale: 1 → 1.05 → 1
  ```

#### B. Options Cascada
- **Efecto**: Staggered slide in
- **Duración**: 250ms por item
- **Delay**: 40ms entre items
- **Implementación**:
  ```javascript
  translateX: -20 → 0
  opacity: 0 → 1
  ```

---

### 🏨 **MotelDetailScreen**

#### A. Galería de Fotos Parallax
- **Efecto**: Parallax scroll
- **Duración**: Según scroll
- **Implementación**:
  ```javascript
  // La imagen del header se mueve a diferente velocidad que el contenido
  imageTranslateY = scrollY * 0.5
  ```

#### B. Amenities Entrando
- **Efecto**: Pop in con bounce
- **Duración**: 400ms
- **Delay**: 50ms entre pills
- **Implementación**:
  ```javascript
  scale: 0 → 1.1 → 1
  opacity: 0 → 1
  ```

#### C. Precio Highlight
- **Efecto**: Subtle glow pulsante
- **Duración**: 2000ms (loop)
- **Implementación**:
  ```javascript
  shadowOpacity: 0.2 → 0.4 → 0.2
  shadowRadius: 4 → 8 → 4
  ```

#### D. Botón "Ver disponibilidad"
- **Efecto**: Shimmer effect
- **Duración**: 2000ms (loop)
- **Implementación**:
  ```javascript
  // Gradient se mueve de izq a derecha
  translateX: -100% → 100%
  ```

---

## 2. Feedback Táctil y Gestos

### A. **MotelCard Press**
- **Efecto Actual**: activeOpacity={0.7}
- **Mejora**: Scale down + shadow reduce
- **Duración**: 150ms
- **Implementación**:
  ```javascript
  // onPressIn:
  scale: 1 → 0.98
  shadowOpacity: 0.1 → 0.05

  // onPressOut:
  scale: 0.98 → 1 (con bounce)
  shadowOpacity: 0.05 → 0.1
  ```

### B. **Favorite Button Press**
- **Efecto**: Scale up + rotation
- **Duración**: 300ms
- **Implementación**:
  ```javascript
  // Al tocar:
  scale: 1 → 1.3 → 1
  rotation: 0 → 15 → -10 → 0
  ```

### C. **Category Card Press**
- **Efecto**: Ripple effect + lift
- **Duración**: 200ms
- **Implementación**:
  ```javascript
  // onPress:
  elevation: 3 → 8
  translateY: 0 → -2
  // + ripple desde el punto de toque
  ```

### D. **SearchBar Clear Button**
- **Efecto**: Rotate + fade out
- **Duración**: 250ms
- **Implementación**:
  ```javascript
  rotation: 0 → 180
  opacity: 1 → 0
  scale: 1 → 0
  ```

### E. **Long Press en MotelCard**
- **Efecto**: Vibración + menu contextual
- **Duración**: 400ms
- **Implementación**:
  ```javascript
  // Haptic feedback + animación de presionado profundo
  scale: 1 → 0.95
  // Mostrar menu: Compartir, Ver en mapa, etc.
  ```

---

## 3. Transiciones entre Pantallas

### A. **Home → MotelDetail**
- **Efecto**: Shared element transition
- **Duración**: 400ms
- **Implementación**:
  ```javascript
  // La imagen de MotelCard crece hasta llenar el header
  // Resto del contenido fade in
  ```

### B. **Home → Search**
- **Efecto**: SearchBar expand
- **Duración**: 350ms
- **Implementación**:
  ```javascript
  // SearchBar del HomeHeader se expande
  // Background slide up
  ```

### C. **Lista → Detalle → Atrás**
- **Efecto**: Hero transition reversa
- **Duración**: 350ms
- **Implementación**:
  ```javascript
  // La card vuelve a su posición original
  // Con morph animation
  ```

---

## 4. Microanimaciones por Componente

### 🎠 **PromoCarousel**

#### A. Auto-scroll Indicator
- **Efecto**: Dots pulsantes
- **Duración**: 3000ms (tiempo entre slides)
- **Implementación**:
  ```javascript
  // Dot activo pulsa mientras está visible
  scale: 1 → 1.2 → 1
  ```

#### B. Card Parallax al Scroll
- **Efecto**: Profundidad 3D
- **Implementación**:
  ```javascript
  // Cards laterales tienen scale reducido
  scale = 1 - (distance * 0.15)
  opacity = 1 - (distance * 0.3)
  ```

#### C. Hover Effect (si el usuario mantiene presionado)
- **Efecto**: Subtle zoom
- **Duración**: 200ms
- **Implementación**:
  ```javascript
  scale: 1 → 1.05
  ```

---

### 🏷️ **MotelCard**

#### A. Thumbnail Loading Skeleton
- **Efecto**: Shimmer effect
- **Duración**: 1500ms (loop)
- **Implementación**:
  ```javascript
  // Gradient se mueve
  translateX: -100% → 100%
  colors: [gray100, gray200, gray100]
  ```

#### B. Badge "PROMO" Pulsante
- **Efecto**: Gentle pulse
- **Duración**: 2000ms (loop)
- **Implementación**:
  ```javascript
  scale: 1 → 1.08 → 1
  opacity: 1 → 0.8 → 1
  ```

#### C. Precio Slide In
- **Efecto**: Slide from bottom
- **Duración**: 300ms
- **Delay**: 100ms después del card
- **Implementación**:
  ```javascript
  translateY: 10 → 0
  opacity: 0 → 1
  ```

#### D. Rating Stars Aparición
- **Efecto**: Pop in secuencial
- **Duración**: 200ms por estrella
- **Delay**: 50ms entre estrellas
- **Implementación**:
  ```javascript
  scale: 0 → 1.2 → 1
  rotation: -180 → 0
  ```

---

### 🎯 **HomeCategoryCard**

#### A. Icon Bounce al Montar
- **Efecto**: Bounce in
- **Duración**: 500ms
- **Implementación**:
  ```javascript
  scale: 0 → 1.2 → 0.95 → 1
  translateY: -10 → 0
  ```

#### B. Hover Glow
- **Efecto**: Glow al presionar
- **Duración**: 200ms
- **Implementación**:
  ```javascript
  shadowRadius: 4 → 12
  shadowOpacity: 0.1 → 0.3
  ```

---

### 🎪 **Social Icons (HomeCategoriesGrid)**

#### A. Wave Animation al Montar
- **Efecto**: Ola de entrada
- **Duración**: 400ms
- **Delay entre iconos**: 100ms
- **Implementación**:
  ```javascript
  translateY: 20 → 0
  scale: 0 → 1
  opacity: 0 → 1
  ```

#### B. Rotate on Press
- **Efecto**: 360° rotation
- **Duración**: 300ms
- **Implementación**:
  ```javascript
  rotation: 0 → 360
  scale: 1 → 1.1 → 1
  ```

---

### 🔔 **OfflineIndicator**

#### A. Mejorar Slide Down
- **Efecto Actual**: Spring slide
- **Mejora**: Agregar icon bounce
- **Implementación**:
  ```javascript
  // Banner slide down (ya existe)
  // + Icon rotate
  iconRotation: -45 → 0
  ```

#### B. Pulsating Icon cuando Offline
- **Efecto**: Warning pulse
- **Duración**: 1500ms (loop)
- **Implementación**:
  ```javascript
  scale: 1 → 1.1 → 1
  opacity: 1 → 0.7 → 1
  ```

---

### 📍 **Location Badge (si se agrega)**
- **Efecto**: Ping animation
- **Duración**: 2000ms (loop)
- **Implementación**:
  ```javascript
  // Círculo exterior expande y fade out
  scale: 1 → 2
  opacity: 0.6 → 0
  ```

---

## 5. Estados de Carga y Placeholders

### A. **Skeleton Screens**

#### Para MotelCard:
```javascript
// Estructura de skeleton animado
┌─────────────────────────┐
│ [████████████████████]  │ ← Shimmer horizontal
│ [██████]  [████]        │ ← Shimmer en texto
│ [████████]              │ ← Shimmer en precio
│ [▪][▪][▪]              │ ← Pills con shimmer
└─────────────────────────┘
```

#### Implementación:
- **Biblioteca**: `react-native-shimmer-placeholder`
- **Colores**: gray100 → gray200 → gray100
- **Velocidad**: 1.5s por ciclo

---

### B. **Pull to Refresh Custom**

#### HomeScreen:
- **Efecto**: Rotating logo
- **Duración**: Durante el refresh
- **Implementación**:
  ```javascript
  // Logo de Jahatelo rotando
  rotation: 0 → 360 (loop durante refresh)
  scale: pulse 1 → 1.1 → 1
  ```

---

### C. **Infinite Scroll Loader**

#### SearchScreen/MotelList:
- **Efecto**: Bouncing dots
- **Duración**: 1200ms (loop)
- **Implementación**:
  ```javascript
  // 3 dots bounce secuencialmente
  Dot 1: translateY: 0 → -10 → 0 (delay: 0ms)
  Dot 2: translateY: 0 → -10 → 0 (delay: 200ms)
  Dot 3: translateY: 0 → -10 → 0 (delay: 400ms)
  ```

---

## 6. Animaciones de Éxito/Error

### A. **Agregar a Favoritos (Éxito)**
- **Efecto**: Heart explosion
- **Duración**: 800ms
- **Implementación**:
  ```javascript
  // Heart principal
  scale: 1 → 1.5 → 1
  rotation: 0 → 360

  // Partículas (5-8 mini corazones)
  translateY: 0 → -50
  translateX: random(-30, 30)
  opacity: 1 → 0
  scale: 1 → 0
  ```

### B. **Error de Red (Toast)**
- **Efecto**: Shake + fade in
- **Duración**: 500ms
- **Implementación**:
  ```javascript
  translateX: 0 → -10 → 10 → -5 → 5 → 0
  opacity: 0 → 1
  ```

### C. **Limpiar Caché (ProfileScreen)**
- **Efecto**: Success checkmark animation
- **Duración**: 600ms
- **Implementación**:
  ```javascript
  // Círculo verde crece
  scale: 0 → 1.2 → 1

  // Checkmark dibuja con path animation
  pathLength: 0 → 1
  ```

---

## 7. Detalles de Pulido Visual

### A. **Sombras Dinámicas**

Mejorar sombras en cards:
```javascript
// En reposo
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,

// Al presionar
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.05,
shadowRadius: 2,

// Al hacer hover (si aplica)
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 8,
```

---

### B. **Gradientes Animados**

#### Botones principales:
```javascript
// Gradient que se mueve suavemente
colors: ['#FF2E93', '#B01E6F']
locations: [0, 1]

// Animado:
locations: [0, 1] → [-0.5, 0.5] → [0, 1] (loop)
```

---

### C. **Blur Effects**

#### Overlay en PromoCarousel:
```javascript
// Usar BlurView en lugar de View con overlay estático
<BlurView
  intensity={80}
  tint="dark"
  style={StyleSheet.absoluteFill}
/>
```

---

### D. **Border Radius Suave en Transiciones**
```javascript
// Al expandir una card
borderRadius: 16 → 0 (smooth)
// Para transición a fullscreen
```

---

### E. **Text Truncate con Fade**

En MotelCard cuando nombre es largo:
```javascript
// Agregar gradient overlay al final del texto
<LinearGradient
  colors={['transparent', 'white']}
  start={{ x: 0.7, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.textFade}
/>
```

---

### F. **Haptic Feedback**

Agregar vibración en:
- Tocar favorito: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`
- Long press: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)`
- Agregar a favoritos: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
- Error: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`

---

## 8. Dependencias Necesarias

### Instalar:

```bash
# React Native Reanimated (para animaciones avanzadas)
npx expo install react-native-reanimated

# React Native Gesture Handler (para gestos)
npx expo install react-native-gesture-handler

# Shimmer para placeholders
npm install react-native-shimmer-placeholder

# Linear Gradient
npx expo install expo-linear-gradient

# Haptics
npx expo install expo-haptics

# Blur View
npx expo install expo-blur

# Lottie (para animaciones JSON)
npx expo install lottie-react-native
```

---

## 9. Priorización

### 🔴 **Prioridad ALTA** (2-3 días)

1. **Feedback táctil en MotelCard** (2h)
   - Scale down on press
   - Shadow reduce

2. **Favorite button animation** (1h)
   - Heart pop con partículas

3. **Skeleton screens para loading** (3h)
   - MotelCard skeleton
   - SearchScreen skeleton

4. **SearchBar focus animation** (1h)
   - Expand + glow

5. **Haptic feedback básico** (2h)
   - Integrar en botones principales

6. **Pull to refresh custom** (2h)
   - Logo rotando

### 🟡 **Prioridad MEDIA** (3-4 días)

7. **Animaciones de entrada en HomeScreen** (4h)
   - Header slide
   - Carousel fade
   - Categories stagger

8. **PromoCarousel parallax** (3h)
   - Scale y opacity según posición

9. **Badge "PROMO" pulsante** (1h)
   - Pulse loop

10. **Empty states animados** (3h)
    - FavoritesScreen heart
    - SearchScreen icon

11. **Transition improvements** (4h)
    - Shared element transitions básicas

12. **Blur effects en overlays** (2h)
    - PromoCarousel
    - Modals

### 🟢 **Prioridad BAJA** (Nice to have)

13. **MotelDetail parallax header** (3h)
14. **Social icons wave animation** (2h)
15. **Text fade en truncate** (2h)
16. **Gradientes animados en botones** (3h)
17. **Long press menu contextual** (4h)
18. **Success/Error toasts animados** (3h)
19. **Lottie animations para splash** (4h)

---

## 📊 Estimación Total

- **Alta prioridad**: ~11 horas (~1.5 días)
- **Media prioridad**: ~17 horas (~2 días)
- **Baja prioridad**: ~21 horas (~2.5 días)

**Total**: ~49 horas (~6 días de trabajo)

---

## 🎯 Plan de Implementación Sugerido

### Fase 1: Feedback y Básicos (Día 1-2)
- Implementar todas las animaciones de prioridad ALTA
- Testing en dispositivo real
- Ajustes de performance

### Fase 2: Entrada y Transiciones (Día 3-4)
- Animaciones de entrada en pantallas principales
- Skeleton screens
- Empty states

### Fase 3: Detalles y Pulido (Día 5-6)
- Blur effects
- Gradientes
- Lottie animations
- Haptics avanzados

---

## 📝 Notas Importantes

1. **Performance First**: Usar `react-native-reanimated` en lugar de `Animated` de RN
2. **Testing en Dispositivos Reales**: Las animaciones pueden verse diferente en simulador
3. **Accessibility**: Respetar `prefers-reduced-motion` del sistema
4. **60 FPS**: Todas las animaciones deben correr a 60fps mínimo
5. **Native Driver**: Usar `useNativeDriver: true` siempre que sea posible

---

¡Con estas mejoras, Jahatelo tendrá animaciones profesionales y una UX de primer nivel! 🚀
