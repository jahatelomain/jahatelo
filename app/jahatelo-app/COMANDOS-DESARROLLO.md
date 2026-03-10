# Comandos de Desarrollo - Jahatelo App (Expo Dev Client)

Este proyecto usa **Expo Dev Client**, NO React Native CLI puro. Usa siempre comandos `npx expo ...`.

---

## Desarrollo Diario

### Iniciar Metro Bundler
```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
npx expo start
```

### Limpiar cache y reiniciar
```bash
npx expo start --clear
```

### Correr en iOS Simulator
```bash
# Primera vez o después de cambios nativos
npx expo run:ios

# Subsecuentes ejecuciones (con Metro ya corriendo)
# Presiona 'i' en terminal donde corre npx expo start
```

### Correr en dispositivo físico iOS
```bash
# Con dispositivo conectado por USB
npx expo run:ios --device
```

### Correr en Android
```bash
npx expo run:android
```

---

## Limpieza y Troubleshooting

### Limpiar todo el cache
```bash
# Limpiar cache de Expo
npx expo start --clear

# Limpiar cache de Metro
rm -rf /tmp/metro-*

# Limpiar node_modules y reinstalar
rm -rf node_modules
npm install
```

### Regenerar carpetas nativas (iOS/Android)
```bash
# Solo si tuviste cambios en plugins nativos o app.json
npx expo prebuild --clean
```

### Logs detallados

#### Ver logs del simulador iOS
```bash
# Terminal 1: Metro bundler
npx expo start

# Terminal 2: Logs del sistema iOS
xcrun simctl spawn booted log stream --level=debug --predicate 'processImagePath contains "jahatelo"'
```

#### Ver solo logs de staging auth
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "jahatelo"' | grep -E "\[APP\]|\[STAGING AUTH\]|\[API\]"
```

---

## Staging con Basic Auth

### Primera vez - sin credenciales guardadas
```bash
# 1. Iniciar app
npx expo start

# 2. Presionar 'i' para iOS
# 3. Ingresar credenciales en popup
# 4. Credenciales se guardan automáticamente
```

### Debug detallado de staging auth
```bash
# Habilitar logs detallados de autenticación
EXPO_PUBLIC_DEBUG_STAGING=1 npx expo start
```

### Limpiar credenciales guardadas
```bash
# Desinstalar app del simulador y reinstalar
# O usar botón de "reset" si existe en settings de la app
```

---

## Builds de Producción (EAS)

### Preview build (staging)
```bash
eas build --profile preview --platform ios
```

### Production build
```bash
eas build --profile production --platform ios
```

### Submit a App Store
```bash
eas submit --platform ios
```

---

## Comandos que NO debes usar

❌ **NUNCA uses estos comandos (son de React Native CLI, no Expo):**
```bash
npx react-native run-ios        # ❌ INCORRECTO
npx react-native start          # ❌ INCORRECTO
npx react-native clean          # ❌ No existe en Expo
```

✅ **Usa en su lugar:**
```bash
npx expo run:ios                # ✅ CORRECTO
npx expo start                  # ✅ CORRECTO
npx expo start --clear          # ✅ CORRECTO
```

---

## Variables de Entorno

### Staging
```bash
EXPO_PUBLIC_API_URL=https://staging.jahatelo.com
EXPO_PUBLIC_DEBUG_STAGING=1  # Solo para debug detallado
```

### Producción
```bash
EXPO_PUBLIC_API_URL=https://jahatelo.com
```

---

## Checklist de Validación después de cambios

Después de aplicar cambios de staging auth, validar:

### 1. Logs al iniciar (sin credenciales guardadas)
```
✅ 🚀 [APP] Inicializando autenticación staging...
✅ 🔐 [STAGING AUTH] Interceptor de fetch instalado correctamente
✅ 🔐 [APP] Entorno ES staging, cargando credenciales...
✅ ⚠️  [APP] NO hay credenciales guardadas, mostrar popup
```

### 2. Logs al ingresar credenciales
```
✅ 🔐 [APP] Usuario ingresó credenciales, guardando...
✅ ✅ [APP] Credenciales guardadas, habilitando app
```

### 3. Logs al hacer fetch a staging
```
✅ 🌐 [API] Fetch: https://staging.jahatelo.com/... (intento 1/2)
✅ ✅ [STAGING AUTH] Authorization header adjuntado
✅ 📥 [API] Response: 200 OK
✅ ✅ [API] Datos recibidos exitosamente
```

### 4. UI esperada
- ✅ Popup staging (primera vez)
- ✅ Splash animado
- ✅ HomeScreen con moteles
- ✅ Si error: Pantalla con botón "Reintentar"

---

## Troubleshooting Común

### App queda en spinner infinito
**Causa:** Timeout de staging
**Solución:**
```bash
# 1. Ver logs para confirmar error
xcrun simctl spawn booted log stream | grep -E "API|STAGING"

# 2. Verificar conectividad a staging desde Mac
curl -I https://staging.jahatelo.com

# 3. Si Mac sí accede pero simulador no, problema de DNS
# Agregar a /etc/hosts:
sudo nano /etc/hosts
# <IP-STAGING>  staging.jahatelo.com
```

### Credenciales inválidas
**Causa:** 401 Unauthorized
**Solución:**
```bash
# Ver logs para confirmar
# Deberías ver: "Error de autenticación (401)"
# Desinstalar app y volver a instalar con credenciales correctas
```

### Cambios nativos no se reflejan
**Causa:** Carpetas ios/android desactualizadas
**Solución:**
```bash
npx expo prebuild --clean
npx expo run:ios
```

---

**Última actualización:** 2026-03-09
**Proyecto:** Jahatelo App (Expo Dev Client + React Native New Architecture)
