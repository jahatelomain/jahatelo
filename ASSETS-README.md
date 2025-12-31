# Guía de Generación de Assets - Jahatelo

## 🎨 Paleta de Colores Oficial
- **Primary Purple**: `#822DE2`
- **Primary Pink**: `#F56565`
- **Pink Dark**: `#D53F8C`
- **Text/Accent Grey**: `#424A54`
- **White**: `#FFFFFF`
- **Gradient**: `linear-gradient(135deg, #F56565 0%, #D53F8C 50%, #822DE2 100%)`

## 📐 Tipografía
- **Principal**: Lato (Regular 400, Bold 700)
- **Secundaria** (opcional): Grand Hotel para acentos

---

## 🛠️ Cómo Generar los Assets

### ✅ Ya Creado
- ✅ `web/jahatelo-web/public/logo.svg` - Logo vectorial base

### ⏳ Pendiente (Necesitas generar manualmente)

Usa una de estas opciones:

### Opción 1: AppIcon.co (Más Fácil) ⭐
1. Ve a https://appicon.co/
2. Sube `logo.svg`
3. Descarga el ZIP con todos los tamaños
4. Extrae los archivos según la estructura abajo

### Opción 2: RealFaviconGenerator.net (Mejor para Web)
1. Ve a https://realfavicongenerator.net/
2. Sube `logo.svg`
3. Configura:
   - iOS: fondo transparente
   - Android: fondo #822DE2
   - Favicon: multi-resolución
4. Descarga el paquete

### Opción 3: Figma/Photoshop
1. Importa `logo.svg`
2. Exporta cada tamaño manualmente
3. Para splash: canvas 2732x2732, fondo #822DE2, logo centrado

### Opción 4: CLI (ImageMagick)
```bash
cd web/jahatelo-web/public

# Generar PNGs desde SVG
magick logo.svg -resize 1024x1024 -background none logo-1024.png
magick logo.svg -resize 512x512 -background none android-chrome-512x512.png
magick logo.svg -resize 192x192 -background none android-chrome-192x192.png
magick logo.svg -resize 180x180 -background none apple-touch-icon.png
magick logo.svg -resize 32x32 -background none logo-32.png
magick logo.svg -resize 16x16 -background none logo-16.png

# Generar favicon.ico multi-resolución
magick logo-16.png logo-32.png favicon.ico

# Generar OG image (1200x630, fondo blanco)
magick -size 1200x630 canvas:white \
  \( logo.svg -resize 400x400 \) -gravity center -composite \
  og-image.png

# Generar splash (2732x2732, fondo morado)
magick -size 2732x2732 canvas:#822DE2 \
  \( logo.svg -resize 800x800 \) -gravity center -composite \
  ../../../app/jahatelo-app/assets/splash-2732.png
```

---

## 📁 Estructura de Archivos Necesaria

### Web (Next.js)
```
web/jahatelo-web/public/
├── favicon.ico                     ✅ (genera con magick o RealFaviconGenerator)
├── logo.svg                        ✅ (ya creado)
├── logo-16.png                     ⏳
├── logo-32.png                     ⏳
├── android-chrome-192x192.png      ⏳
├── android-chrome-512x512.png      ⏳
├── apple-touch-icon.png (180x180)  ⏳
├── og-image.png (1200x630)         ⏳
└── manifest.json                   ✅ (ya creado)
```

### App Móvil (Expo)
```
app/jahatelo-app/assets/
├── logo-1024.png                   ⏳ (icono principal)
├── ios-icon-1024.png               ⏳ (iOS específico)
├── android-foreground-1080.png     ⏳ (foreground con padding 20%)
├── splash-2732.png                 ⏳ (splash screen)
└── favicon.png                     ⏳
```

---

## 🎯 Especificaciones por Asset

### 1. **logo-1024.png** (App icon base)
- Tamaño: 1024x1024
- Fondo: Transparente
- Contenido: Logo completo centrado
- Uso: Icono principal de la app

### 2. **android-foreground-1080.png** (Adaptive icon)
- Tamaño: 1080x1080
- Fondo: Transparente
- Padding: ~20% (safe area)
- Logo debe estar en el 80% central
- Uso: Foreground del adaptive icon Android

### 3. **splash-2732.png** (Splash screen)
- Tamaño: 2732x2732
- Fondo: #822DE2 (morado sólido)
- Logo: Centrado, ~800x800
- Uso: Pantalla de carga

### 4. **og-image.png** (Social sharing)
- Tamaño: 1200x630
- Fondo: Blanco o muy claro
- Logo: Centrado con texto "Jahatelo"
- Uso: Preview en redes sociales

### 5. **favicon.ico** (Web favicon)
- Multi-resolución: 16x16, 32x32, 48x48
- Fondo: Transparente
- Uso: Favicon del navegador

---

## ✅ Checklist de Implementación

### Web (Next.js)
- [x] `logo.svg` creado
- [x] `manifest.json` creado
- [x] `layout.tsx` actualizado con metadata
- [x] `globals.css` actualizado con variables de color
- [ ] Generar todos los PNGs
- [ ] Generar `favicon.ico`
- [ ] Generar `og-image.png`

### App Móvil (Expo)
- [x] `app.json` actualizado con nuevos colores
- [ ] Generar `logo-1024.png`
- [ ] Generar `android-foreground-1080.png`
- [ ] Generar `splash-2732.png`
- [ ] Generar `ios-icon-1024.png`

---

## 🧪 Verificación

### Web
1. Abre Chrome DevTools
2. Application → Manifest → Ver que carga correctamente
3. Network → Ver que favicon.ico se carga
4. Compartir en redes → Ver og-image

### App Móvil
1. Ejecuta `npx expo prebuild --clean`
2. Verifica `android/app/src/main/res/` tenga los iconos
3. Verifica `ios/[AppName]/Images.xcassets/` tenga los iconos
4. Ejecuta `npx expo start` y verifica splash screen

---

## 🎨 Recursos Útiles

- **Logo vectorial**: `web/jahatelo-web/public/logo.svg`
- **Generador de iconos**: https://appicon.co/
- **Generador de favicon**: https://realfavicongenerator.net/
- **Editor SVG online**: https://editor.method.ac/
- **Conversor SVG a PNG**: https://cloudconvert.com/svg-to-png

---

## 💡 Notas Importantes

1. **Fondo transparente**: Todos los iconos excepto splash y og-image
2. **Padding safe area**: Android adaptive icon necesita 20% de padding
3. **Colores consistentes**: Usar siempre #822DE2 para fondos morados
4. **Splash screen**: Logo centrado, no debe recortarse
5. **OG image**: Probar en https://www.opengraph.xyz/

---

## 🚀 Comando Rápido (después de generar assets)

```bash
# Web
cd web/jahatelo-web
git add public/*
git commit -m "feat: add Jahatelo brand assets and configuration"

# App
cd app/jahatelo-app
git add assets/* app.json
git commit -m "feat: update Jahatelo brand assets"
```
