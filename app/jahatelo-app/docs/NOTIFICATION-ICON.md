# Ícono de Notificaciones Push

## Requisitos para Android

Android requiere un **ícono monocromático** (blanco sobre transparente) para las notificaciones push.

**Especificaciones:**
- Formato: PNG con transparencia
- Tamaño recomendado: **96x96 px** o **192x192 px**
- Color: **Blanco (#FFFFFF)** sobre fondo transparente
- Estilo: Silueta simple, sin gradientes ni sombras
- Ubicación: `assets/notification-icon.png`

---

## Opción 1: Generar desde logo existente (Automático)

Si tienes ImageMagick instalado:

```bash
# Instalar ImageMagick (si no lo tienes)
# macOS:
brew install imagemagick

# Ubuntu/Debian:
sudo apt-get install imagemagick

# Windows: Descargar desde https://imagemagick.org/script/download.php
```

```bash
# Convertir logo-icon.png a monocromático blanco sobre transparente
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app/assets

# Crear ícono monocromático de 192x192
convert logo-icon.png \
  -resize 192x192 \
  -alpha extract \
  -negate \
  -colorspace Gray \
  -alpha copy \
  -fill white -colorize 100 \
  notification-icon.png

# Verificar que se creó correctamente
ls -lh notification-icon.png
```

---

## Opción 2: Crear manualmente (Figma/Photoshop)

### En Figma:

1. Crear frame de **192x192 px**
2. Importar `logo-icon.png`
3. Aplicar estilo:
   - Color: `#FFFFFF` (blanco)
   - Eliminar gradientes y sombras
   - Simplificar a silueta
4. Exportar como PNG:
   - Formato: PNG
   - Escala: 1x
   - Incluir transparencia: ✅
5. Guardar como `assets/notification-icon.png`

### En Photoshop:

1. Abrir `logo-icon.png`
2. Menú → Imagen → Tamaño de imagen → 192x192 px
3. Capa → Estilo de capa → Superposición de color:
   - Color: Blanco (#FFFFFF)
   - Modo de fusión: Normal
4. Eliminar efectos de sombra y gradientes
5. Archivo → Exportar → PNG
   - Transparencia: ✅
6. Guardar como `assets/notification-icon.png`

---

## Opción 3: Usar herramienta online

1. Ir a: https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
2. Subir `logo-icon.png`
3. Ajustar:
   - Tamaño: 100%
   - Color: Blanco
   - Padding: 10-15%
4. Descargar ZIP
5. Extraer y copiar `res/drawable-xxxhdpi/ic_stat_notification.png` como `assets/notification-icon.png`

---

## Opción 4: Usar asset existente temporalmente

Si necesitas probar rápidamente sin crear el ícono monocromático:

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app/assets

# Copiar el favicon como temporal (no es ideal pero funciona)
cp favicon.png notification-icon.png
```

**Nota:** Esto no es ideal porque `favicon.png` probablemente tiene colores y no es monocromático. Android lo mostrará pero puede verse mal.

---

## iOS

iOS usa el ícono principal de la app (`icon` en `app.json`) y no requiere un ícono separado para notificaciones.

**Ya configurado:** `./assets/ios-icon-1024.png`

---

## Verificar Configuración

### 1. Verificar que el archivo existe

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
ls -lh assets/notification-icon.png
```

Deberías ver algo como:
```
-rw-r--r--  1 user  staff   5.2K Jan 16 12:00 assets/notification-icon.png
```

### 2. Verificar que app.json tiene la configuración

```json
{
  "expo": {
    "android": {
      "notification": {
        "icon": "./assets/notification-icon.png",
        "color": "#822DE2"
      }
    }
  }
}
```

### 3. Rebuild la app

**IMPORTANTE:** Después de agregar el ícono de notificación, debes hacer un **nuevo build** (no sirve con hot reload):

```bash
# Development build
eas build --profile development --platform android

# O si ya tienes un build:
eas build --profile development --platform android --clear-cache
```

---

## Testing

### 1. Enviar notificación de prueba

```bash
# Desde el backend
curl -X POST http://localhost:3000/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Test Notification Icon",
    "body": "Verifica que el ícono sea el logo de Jahatelo",
    "sendNow": true,
    "type": "announcement",
    "category": "maintenance",
    "targetUserIds": ["tu-user-id"]
  }'
```

### 2. Verificar en el dispositivo

1. Bloquea la pantalla del dispositivo
2. Recibe la notificación
3. Verifica que el ícono sea el logo de Jahatelo (no el logo de Expo)

**Apariencia esperada:**
- ✅ Ícono monocromático blanco con fondo circular morado (#822DE2)
- ❌ Logo colorido de Expo (si aún ves esto, el ícono no está configurado correctamente)

---

## Troubleshooting

### El ícono no aparece / sigue siendo el de Expo

**Causa:** El build de la app no incluye el nuevo ícono.

**Solución:**
1. Verificar que `assets/notification-icon.png` existe
2. Hacer un nuevo build: `eas build --profile development --platform android --clear-cache`
3. Desinstalar app antigua e instalar el nuevo APK

### El ícono se ve pixelado

**Causa:** El ícono es muy pequeño.

**Solución:** Crear un ícono de al menos 192x192 px (ver Opción 1 o 2).

### El ícono tiene colores / se ve mal

**Causa:** El ícono no es monocromático.

**Solución:** Asegurar que el PNG sea blanco (#FFFFFF) sobre fondo transparente.

---

## Resumen

1. ✅ Configuración agregada en `app.json` → `android.notification.icon`
2. ⏳ Crear archivo `assets/notification-icon.png` (blanco sobre transparente, 192x192 px)
3. ⏳ Hacer nuevo build: `eas build --profile development --platform android`
4. ✅ Probar notificación en dispositivo

---

## Recursos

- **Android Icon Guidelines:** https://developer.android.com/studio/write/create-app-icons
- **Expo Notifications Docs:** https://docs.expo.dev/push-notifications/overview/
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
