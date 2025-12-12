# Jahatelo App

Aplicación móvil de Jahatelo para descubrir y explorar moteles. Construida con Expo y React Native.

## Stack Tecnológico

- **Framework:** Expo
- **UI:** React Native
- **Navegación:** React Navigation
- **Gestión de Estado:** React Context API
- **Almacenamiento:** AsyncStorage
- **API:** Cliente HTTP que consume el backend de Next.js

## Configuración de Variables de Entorno

El proyecto usa variables de entorno para configurar la URL del API backend. Expo lee automáticamente variables que comienzan con `EXPO_PUBLIC_`.

### Archivos de Entorno

- `.env.development` - Para desarrollo local
- `.env.production` - Para producción

### Configuración para Desarrollo

El archivo `.env.development` ya está configurado con:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**IMPORTANTE:** Asegúrate de que el backend de Next.js esté corriendo en `http://localhost:3000` antes de iniciar la app móvil.

### Configuración para Producción

Cuando despliegues la app, actualiza `.env.production` con la URL del dominio desplegado:

```bash
EXPO_PUBLIC_API_URL=https://jahatelo.com
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Asegúrate de que el backend (Next.js) esté corriendo en `http://localhost:3000`

   ```bash
   cd ../../web/jahatelo-web
   npm run dev
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Funcionalidades Principales

### Búsqueda por Ubicación GPS

La app incluye funcionalidad para encontrar moteles cercanos usando la ubicación del dispositivo:

1. **Botón "Cerca mío"**: En el header de la pantalla principal, el usuario puede tocar el botón de ubicación
2. **Solicitud de permisos**: La app solicita permisos de ubicación (ACCESS_FINE_LOCATION en Android, NSLocationWhenInUseUsageDescription en iOS)
3. **Filtrado por distancia**: Utiliza la fórmula de Haversine para calcular distancias y mostrar solo moteles dentro de un radio de 10km
4. **Resultados**: Se muestra un modal con los moteles cercanos ordenados por distancia

**Dependencias**: `expo-location`

**Implementación**:
- Utilidad de cálculo de distancias: `utils/location.js`
- Componente principal: `components/HomeHeader.js`

### Exploración por Ciudad

Los usuarios pueden explorar moteles agrupados por ciudad:

1. **Categoría "Moteles por ciudad"**: Tarjeta en la pantalla principal
2. **Lista de ciudades**: Se agrupan automáticamente todos los moteles por ciudad
3. **Vista de moteles por ciudad**: Al seleccionar una ciudad, se muestran todos los moteles disponibles en esa ubicación

**Navegación**:
- `CitySelectorScreen`: Lista de ciudades con conteo de moteles
- `CityMotelsScreen`: Lista de moteles filtrados por ciudad seleccionada

### Tema Visual

La aplicación utiliza un sistema de diseño centralizado mediante `constants/theme.js`, que define:

- **Color principal**: `#2A0038` (morado oscuro del splash screen)
- **Colores semánticos**: success, warning, error, info
- **Escalas de espaciado**: xs, sm, md, lg, xl, xxl, xxxl
- **Tamaños de fuente**: xs (12px) hasta huge (32px)
- **Border radius**: sm (8px) hasta round (9999px)

**Implementación**: Todas las pantallas y componentes importan `{ COLORS }` desde `../constants/theme` para mantener consistencia visual. Esto permite actualizar la paleta de colores globalmente desde un solo archivo.

**Ventajas**:
- Consistencia visual en toda la aplicación
- Fácil mantenimiento y actualización de colores
- Escalabilidad para futuras pantallas

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
