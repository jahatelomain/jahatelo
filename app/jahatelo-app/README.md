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
