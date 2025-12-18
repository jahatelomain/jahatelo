# Sistema de Caché y Modo Offline - Jahatelo App

## 📦 Dependencias Requeridas

Para que el sistema funcione correctamente, instala la siguiente dependencia:

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
npx expo install @react-native-community/netinfo
```

**Nota:** `@react-native-async-storage/async-storage` ya está instalado.

---

## ✅ Archivos Implementados

### 1. **Servicio de Caché**
`/services/cacheService.js`

Servicio completo para gestionar caché local con AsyncStorage:
- ✅ Caché de lista de moteles (30 min)
- ✅ Caché de detalle de moteles (1 hora)
- ✅ Historial de vistos recientemente (últimos 20)
- ✅ Historial de búsquedas (últimas 50)
- ✅ Timestamp de última sincronización
- ✅ Gestión de expiración automática
- ✅ Utilidades para limpiar caché

### 2. **API con Caché**
`/services/motelsApi.js` (modificado)

- ✅ `fetchMotels()` usa caché y fallback offline
- ✅ `fetchMotelBySlug()` usa caché y fallback offline
- ✅ Guarda automáticamente en caché al hacer fetch exitoso
- ✅ Agrega moteles a "Vistos recientemente"
- ✅ Logs en consola para debugging (✅ caché, ⚠️ offline)

### 3. **Hook de Estado de Red**
`/hooks/useNetworkStatus.js`

Hook personalizado que monitorea el estado de la red:
- ✅ Detecta conexión/desconexión
- ✅ Verifica si internet es alcanzable
- ✅ Identifica tipo de conexión (wifi, cellular)
- ✅ Actualización en tiempo real

### 4. **Indicador Offline**
`/components/OfflineIndicator.js`

Banner animado que aparece cuando no hay conexión:
- ✅ Animación slide desde arriba
- ✅ Se muestra solo cuando está offline
- ✅ Color rojo para alertar
- ✅ Ícono y texto claro

### 5. **Gestión de Caché en Perfil**
`/screens/ProfileScreen.js` (modificado)

Nueva sección "Almacenamiento y datos":
- ✅ Muestra tamaño de datos guardados
- ✅ Contador de vistos recientemente
- ✅ Última sincronización
- ✅ Botón para limpiar historial de búsquedas
- ✅ Botón para limpiar todos los datos (con confirmación)
- ✅ Loading state mientras limpia

### 6. **App Global**
`/App.js` (modificado)

- ✅ `<OfflineIndicator />` agregado globalmente
- ✅ Visible en todas las pantallas

---

## 🚀 Funcionalidades Implementadas

### Caché Automático
- Al cargar moteles en `HomeScreen`, se guardan en caché
- Al ver un motel, se guarda su detalle en caché
- Próximas cargas usan el caché si está disponible

### Modo Offline
- Si no hay internet, la app usa datos del caché
- Banner visible cuando está offline
- Los favoritos funcionan siempre (ya están en AsyncStorage)

### Vistos Recientemente
- Cada motel visto se guarda automáticamente
- Máximo 20 moteles
- Persiste entre sesiones
- Accesible desde `/services/cacheService.js` con `getRecentViews()`

### Gestión de Almacenamiento
- Ver tamaño de datos guardados
- Limpiar historial de búsquedas
- Limpiar todo el caché (excepto favoritos)
- Información de última sincronización

---

## 📊 Estructura de Datos en AsyncStorage

```javascript
@jahatelo:motels_list         // Lista de moteles (30 min)
@jahatelo:motel_detail_{id}   // Detalle por motel (1 hora)
@jahatelo:recent_views        // Últimos 20 vistos (7 días)
@jahatelo:search_history      // Últimas 50 búsquedas (30 días)
@jahatelo:last_sync           // Timestamp de última sync
@jahatelo/favorites           // Favoritos (sin expiración)
```

---

## 🔧 Cómo Usar

### En el código:

```javascript
// Obtener moteles (usa caché automáticamente)
const motels = await fetchMotels();

// Obtener motel por slug (usa caché automáticamente)
const motel = await fetchMotelBySlug('sunset-motel');

// Forzar fetch sin caché
const freshMotels = await fetchMotels({}, false);

// Verificar estado de red
const { isOnline, connectionType } = useNetworkStatus();

// Limpiar caché manualmente
import { clearCache } from './services/cacheService';
await clearCache();

// Obtener vistos recientemente
import { getRecentViews } from './services/cacheService';
const recentViews = await getRecentViews();
```

---

## 🎯 Próximas Mejoras Sugeridas

1. **Pantalla de "Vistos Recientemente"**
   - Crear una nueva pantalla que muestre los moteles del historial
   - Agregar botón en HomeScreen

2. **Sincronización Inteligente**
   - Al recuperar conexión, sincronizar automáticamente
   - Toast notification "Datos sincronizados"

3. **Prefetch Estratégico**
   - Pre-cachear moteles destacados al abrir la app
   - Pre-cachear imágenes de moteles cercanos

4. **Indicador de Caché**
   - Badge pequeño en tarjetas que indique si vienen del caché
   - Diferente color o ícono

---

## 🐛 Testing

### Simular modo offline:
1. En el dispositivo: Activar modo avión
2. En simulator iOS: Hardware > Network Link Conditioner > 100% Loss
3. En emulator Android: Configuración > Red > Desactivar WiFi y datos

### Verificar logs:
- ✅ "Usando moteles del caché"
- ✅ "Usando detalle de motel del caché"
- ⚠️ "Error al obtener moteles, intentando caché..."
- 📡 "Sin conexión a internet" / "Conectado via wifi"

---

## 📝 Notas Importantes

- **Favoritos NO se borran** al limpiar caché (usan clave diferente)
- El caché expira automáticamente según el tiempo configurado
- Los datos persisten entre cierres de la app
- El sistema es totalmente transparente para el usuario

---

## 🎨 Personalización

Para ajustar tiempos de expiración, edita `/services/cacheService.js`:

```javascript
const CACHE_EXPIRY = {
  MOTELS_LIST: 1000 * 60 * 30,      // 30 min -> Cambiar aquí
  MOTEL_DETAIL: 1000 * 60 * 60,     // 1 hora -> Cambiar aquí
  RECENT_VIEWS: 1000 * 60 * 60 * 24 * 7,  // 7 días
};
```

---

¡Sistema de caché y offline completamente funcional! 🎉
