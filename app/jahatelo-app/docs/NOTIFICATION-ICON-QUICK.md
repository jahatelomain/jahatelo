# Ícono de Notificaciones - Guía Rápida

## ✅ Ya Configurado

- ✅ `app.json` actualizado con configuración de notification icon
- ✅ `assets/notification-icon.png` creado (versión temporal, 192x192 px)

---

## 🎯 Estado Actual

**Antes (logo de Expo):**
```
🔵 [Expo logo] "Nueva promoción"
```

**Después (logo de Jahatelo - temporal):**
```
🟣 [Logo Jahatelo colorido] "Nueva promoción"
```

**Después (logo de Jahatelo - IDEAL):**
```
🟣 [Logo Jahatelo monocromático blanco] "Nueva promoción"
```

---

## 📝 Para Aplicar los Cambios

### 1. Hacer Nuevo Build

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app

# Development build con el nuevo ícono
eas build --profile development --platform android
```

**Tiempo estimado:** 10-15 minutos

### 2. Instalar APK

Cuando termine el build:
1. Recibirás un link de descarga
2. Escanea el QR con tu dispositivo Android
3. Instala el APK

### 3. Probar Notificación

```bash
# Enviar notificación de prueba
curl -X POST http://localhost:3000/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Test Logo",
    "body": "Verifica el ícono de Jahatelo",
    "sendNow": true,
    "type": "announcement",
    "category": "maintenance",
    "targetUserIds": ["tu-user-id"]
  }'
```

### 4. Verificar

1. Bloquea la pantalla
2. Recibe la notificación
3. **Verifica:** ¿El ícono es el logo de Jahatelo? ✅

---

## 🎨 Mejorar a Ícono Monocromático (Opcional)

El ícono actual funciona, pero Android recomienda usar un **ícono monocromático** (blanco sobre transparente).

### Opción A: Script Automático (requiere ImageMagick)

```bash
# Instalar ImageMagick (solo una vez)
brew install imagemagick

# Generar ícono monocromático
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
./scripts/generate-notification-icon.sh

# Hacer nuevo build
eas build --profile development --platform android --clear-cache
```

### Opción B: Herramienta Online (más fácil)

1. Ir a: https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
2. Subir `assets/logo-icon.png`
3. Ajustar:
   - Color: Blanco
   - Padding: 10-15%
4. Descargar ZIP
5. Copiar `res/drawable-xxxhdpi/ic_stat_notification.png` → `assets/notification-icon.png`
6. Hacer nuevo build

### Opción C: Figma/Photoshop

Ver guía completa: `docs/NOTIFICATION-ICON.md`

---

## ❓ Troubleshooting

### El ícono sigue siendo el de Expo

**Causa:** No has hecho un nuevo build después de agregar el ícono.

**Solución:**
```bash
eas build --profile development --platform android --clear-cache
```

### El ícono se ve pixelado

**Causa:** El ícono es muy pequeño.

**Solución:** El ícono actual es 192x192 px (suficiente). Si aún se ve mal, verifica que el build se hizo correctamente.

### El ícono tiene fondos extraños

**Causa:** El ícono tiene colores (no es monocromático).

**Solución:** Usa la Opción A o B para crear un ícono monocromático blanco sobre transparente.

---

## 📋 Resumen

1. ✅ Configuración agregada a `app.json`
2. ✅ Ícono temporal creado en `assets/notification-icon.png`
3. ⏳ Hacer nuevo build: `eas build --profile development --platform android`
4. ⏳ Instalar APK en dispositivo
5. ⏳ Probar notificación
6. 🎨 (Opcional) Mejorar a ícono monocromático

---

## 📚 Docs Completas

- **Guía Completa de Ícono:** `docs/NOTIFICATION-ICON.md`
- **Development Build:** `docs/DEVELOPMENT-BUILD.md`
- **Push Notifications:** `../../web/jahatelo-web/docs/PUSH-NOTIFICATIONS-SETUP.md`
