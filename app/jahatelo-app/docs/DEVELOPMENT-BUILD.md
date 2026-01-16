# Development Build para Push Notifications

## ⚠️ IMPORTANTE: Expo Go ya no soporta Push Notifications

Desde **Expo SDK 53**, las notificaciones push remotas (`expo-notifications`) fueron **removidas de Expo Go**.

Para probar push notifications necesitas crear un **Development Build**.

---

## Opción 1: Development Build Local (Recomendado para desarrollo)

### Android

#### 1. Instalar dependencias

```bash
# En el directorio de la app móvil
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app

# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login
```

#### 2. Configurar EAS Build

```bash
# Inicializar EAS (si no existe eas.json)
eas build:configure
```

Esto crea `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

#### 3. Crear Development Build

```bash
# Para Android (crea APK que puedes instalar)
eas build --profile development --platform android

# Para instalarlo en tu dispositivo conectado vía USB
eas build --profile development --platform android --local
```

**Nota:** El build puede tardar 10-20 minutos la primera vez.

#### 4. Instalar en dispositivo

Cuando el build termine, recibirás un link para descargar el APK:

- Opción A: Escanear QR con tu dispositivo Android
- Opción B: Descargar APK y transferir a dispositivo via USB
- Opción C: Si usaste `--local`, el APK está en `./android/app/build/outputs/apk/`

```bash
# Instalar APK localmente via ADB
adb install ./android/app/build/outputs/apk/debug/app-debug.apk
```

#### 5. Ejecutar la app

```bash
# En el directorio de la app
npx expo start --dev-client

# O con tunnel para acceder desde cualquier red
npx expo start --dev-client --tunnel
```

La app instalada se conectará automáticamente al bundler de Metro.

---

## Opción 2: Expo Go (Solo para desarrollo sin push notifications)

Si NO necesitas probar push notifications, puedes seguir usando Expo Go:

```bash
npx expo start
```

Pero obtendrás el warning:
```
expo-notifications: Android Push notifications was removed from Expo Go with the release of SDK 53
```

**Para producción:** SIEMPRE necesitas un build nativo (EAS Build o manualmente).

---

## iOS (Requiere Mac con Xcode)

### 1. Development Build

```bash
# Crear build de desarrollo para iOS
eas build --profile development --platform ios

# O local (requiere Xcode)
eas build --profile development --platform ios --local
```

### 2. Instalar en dispositivo

- Conecta tu iPhone via USB
- Instala el archivo `.ipa` usando Xcode o TestFlight

**Nota:** Para iOS, necesitas estar registrado en el Apple Developer Program ($99/año).

---

## Verificar que Push Notifications funciona

### 1. Iniciar el backend

```bash
# En el directorio web
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/web/jahatelo-web
npm run dev
```

El servidor debe estar en: `http://0.0.0.0:3000`

### 2. Configurar API_URL en la app

Editar `.env` o `app.json`:

```bash
# .env en la app móvil
EXPO_PUBLIC_API_URL="http://[TU_IP_LOCAL]:3000"

# Ejemplo
EXPO_PUBLIC_API_URL="http://192.168.10.83:3000"
```

Para obtener tu IP local:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 3. Ejecutar la app con development build

```bash
npx expo start --dev-client
```

### 4. Verificar registro de token

En la app, cuando se ejecute `registerForPushNotificationsAsync()`, deberías ver:

```
✅ Token de push registrado exitosamente
```

Si ves el error:
```
❌ Error al registrar token en el backend: SyntaxError: JSON Parse error
```

Significa:
- El backend no está corriendo
- La URL de API_URL es incorrecta
- Hay un problema de red entre el dispositivo y tu PC

---

## Troubleshooting

### Error: "expo-notifications was removed from Expo Go"

**Solución:** Usa development build en lugar de Expo Go.

### Error: "JSON Parse error: Unexpected end of input"

**Causas posibles:**
1. Backend no está corriendo en `http://[TU_IP]:3000`
2. `EXPO_PUBLIC_API_URL` apunta a URL incorrecta
3. Firewall bloqueando conexión desde dispositivo

**Solución:**
```bash
# 1. Verificar que el backend está corriendo
curl http://localhost:3000/api/health
# Debe responder: {"status":"ok"}

# 2. Verificar desde tu dispositivo móvil (usando navegador del teléfono)
# Abrir: http://[TU_IP]:3000/api/health

# 3. Si no funciona, verificar firewall
# macOS: System Preferences → Security & Privacy → Firewall → Allow Node
```

### Error: "projectId faltante para Expo Push"

**Solución:** Agregar `projectId` en `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tu-project-id"
      }
    }
  }
}
```

Obtener `projectId`:
```bash
eas project:info
```

O crearlo:
```bash
eas init
```

### Build falla en EAS

**Error común:** "Android SDK not found"

**Solución para build local:**
```bash
# Instalar Android Studio
# Descargar desde: https://developer.android.com/studio

# Configurar ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Solución para build en la nube:** Usar `eas build` sin `--local`.

---

## Resumen: ¿Qué opción usar?

| Escenario | Solución |
|-----------|----------|
| Desarrollo SIN push notifications | Expo Go (`npx expo start`) |
| Desarrollo CON push notifications | Development Build (`eas build --profile development`) |
| Testing interno | Preview Build (`eas build --profile preview`) |
| Producción (Google Play / App Store) | Production Build (`eas build --profile production`) |

---

## Recursos

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Development Builds:** https://docs.expo.dev/develop/development-builds/introduction/
- **Expo Notifications:** https://docs.expo.dev/push-notifications/overview/
- **Local Builds:** https://docs.expo.dev/build-reference/local-builds/

---

## Configuración del Ícono de Notificaciones (Opcional)

Para que las notificaciones muestren el logo de Jahatelo en lugar del logo de Expo:

```bash
# Si tienes ImageMagick instalado
./scripts/generate-notification-icon.sh

# O sigue la guía manual
# Ver: docs/NOTIFICATION-ICON.md
```

**Nota:** El ícono actual (`assets/notification-icon.png`) es temporal y tiene colores. Para un resultado óptimo, crea un ícono monocromático (blanco sobre transparente).

---

## Próximos pasos

1. ✅ Crear development build: `eas build --profile development --platform android`
2. ✅ Instalar APK en dispositivo físico
3. ✅ Iniciar backend: `npm run dev` en puerto 3000
4. ✅ Configurar `EXPO_PUBLIC_API_URL` con tu IP local
5. ✅ Ejecutar app: `npx expo start --dev-client`
6. ✅ Verificar que el token se registra correctamente en la base de datos
7. 🎨 (Opcional) Generar ícono monocromático para notificaciones
