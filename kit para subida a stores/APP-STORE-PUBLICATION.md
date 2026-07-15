# 📱 Guía Completa: Publicar Jahatelo App en las Tiendas

Esta guía te llevará paso a paso por todo el proceso de publicación en **Google Play Store** y **Apple App Store**.

---

## 📋 Índice

1. [Prerequisitos Generales](#prerequisitos-generales)
2. [Google Play Store (Android)](#google-play-store-android)
3. [Apple App Store (iOS)](#apple-app-store-ios)
4. [Checklist Pre-Lanzamiento](#checklist-pre-lanzamiento)
5. [Monitoreo Post-Lanzamiento](#monitoreo-post-lanzamiento)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisitos Generales

Antes de comenzar, asegúrate de tener:

### ✅ Materiales Requeridos

- [ ] **Íconos de la app** en múltiples resoluciones:
  - Android: 512x512px (PNG, sin transparencia)
  - iOS: 1024x1024px (PNG, sin canales alpha)

- [ ] **Screenshots** de la app:
  - Mínimo 2 capturas, máximo 8
  - Diferentes tamaños de pantalla (teléfono, tablet)
  - Android: 16:9 o 9:16, mínimo 320px
  - iOS: Capturas específicas por dispositivo (iPhone 6.7", 6.5", 5.5", iPad Pro)

- [ ] **Feature Graphic** (solo Android):
  - 1024x500px (PNG o JPEG)
  - Imagen promocional horizontal

- [ ] **Descripción de la app**:
  - Título corto (≤30 caracteres)
  - Descripción corta (≤80 caracteres)
  - Descripción completa (≤4000 caracteres)
  - Palabras clave (iOS)

- [ ] **Política de Privacidad**:
  - URL pública con política de privacidad
  - **Obligatorio** para ambas tiendas

- [ ] **Cuenta de correo** para soporte:
  - Correo de contacto público
  - Será visible en las tiendas

### 💰 Costos

| Tienda | Costo | Renovación |
|--------|-------|------------|
| **Google Play Store** | $25 USD | Una sola vez (de por vida) |
| **Apple App Store** | $99 USD | Anual |

---

## 🤖 Google Play Store (Android)

### Paso 1: Crear Cuenta de Desarrollador

#### 1.1 Registro Inicial

1. Ve a [Google Play Console](https://play.google.com/console/signup)
2. Inicia sesión con tu cuenta de Google (usa una cuenta empresarial si es posible)
3. Acepta el **Acuerdo de Distribución de Desarrolladores de Google Play**
4. Paga la tarifa única de **$25 USD**
   - Métodos aceptados: Tarjeta de crédito/débito
5. Completa los datos de tu cuenta:
   - **Nombre del desarrollador** (será público): "Jahatelo" o "AKAHATA STUDIO"
   - **Correo de contacto**: soporte@jahatelo.com
   - **Sitio web**: https://jahatelo.com
   - **Dirección** (puede ser requerida)

#### 1.2 Verificación de Identidad

Google puede solicitar:
- Documento de identidad (DNI, pasaporte)
- Comprobante de domicilio
- Información empresarial (si aplica)

**Tiempo de verificación**: 1-3 días hábiles

---

### Paso 2: Preparar la App para Producción

#### 2.1 Configurar `app.json` / `app.config.js`

```json
{
  "expo": {
    "name": "Jahatelo",
    "slug": "jahatelo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#7C3AED"
    },
    "android": {
      "package": "com.mbaretech.jahatelo",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#7C3AED"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "TU_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

#### 2.2 Generar Keystore (Firma de la App)

```bash
# Crear keystore (solo la primera vez)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore jahatelo-release.keystore \
  -alias jahatelo-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# Te pedirá:
# - Contraseña del keystore (guárdala en lugar seguro)
# - Nombre, Organización, Ciudad, País
```

**⚠️ CRÍTICO**:
- Guarda el archivo `.keystore` y la contraseña en lugar **MUY seguro**
- Si lo pierdes, **NO podrás actualizar la app nunca más**
- Recomendación: Guárdalo en 3 lugares (local, Google Drive, físico)

#### 2.3 Configurar Credenciales en Expo

Opción A: **EAS Build (Recomendado)**

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Configurar proyecto
eas build:configure

# Build de producción para Android
eas build --platform android --profile production
```

Opción B: **Build Local**

```bash
# Crear build AAB
npx expo build:android -t app-bundle

# O APK (menos recomendado)
npx expo build:android -t apk
```

#### 2.4 Resultado

Obtendrás un archivo:
- **AAB** (Android App Bundle): `jahatelo-1.0.0.aab` ← **Usa este para Play Store**
- **APK** (solo para testing): `jahatelo-1.0.0.apk`

---

### Paso 3: Crear la App en Google Play Console

#### 3.1 Nueva Aplicación

1. Entra a [Google Play Console](https://play.google.com/console)
2. Click en **"Crear aplicación"**
3. Completa:
   - **Nombre de la app**: "Jahatelo - Moteles y Alojamientos"
   - **Idioma predeterminado**: Español (España) o Español (Latinoamérica)
   - **Tipo**: Aplicación o juego → **Aplicación**
   - **Gratis o de pago**: **Gratis**
4. Acepta las declaraciones y click **"Crear aplicación"**

#### 3.2 Completar Ficha de la Tienda

Ve a **Presencia en la tienda > Ficha de Play Store principal**

**📝 Título corto** (≤30 caracteres)
```
Jahatelo - Moteles
```

**📄 Descripción corta** (≤80 caracteres)
```
Encuentra y compara moteles en tiempo real. Información verificada y actualizada.
```

**📖 Descripción completa** (≤4000 caracteres)
```
🏨 Jahatelo - Tu Guía de Moteles y Alojamientos por Hora

Encuentra el motel perfecto en segundos. Jahatelo te muestra información verificada, precios actualizados y ubicaciones exactas de moteles cerca de ti.

✨ Características principales:

🔍 Búsqueda Inteligente
- Encuentra moteles cerca de tu ubicación
- Filtra por precio, servicios, calificación
- Mapa interactivo con información en tiempo real

💰 Precios Transparentes
- Tarifas actualizadas de habitaciones
- Información de servicios incluidos
- Sin costos ocultos

📍 Información Verificada
- Direcciones exactas con GPS
- Horarios de atención actualizados
- Contacto directo con el establecimiento

⭐ Calificaciones y Reseñas
- Lee experiencias de otros usuarios
- Calificaciones verificadas
- Fotos reales de las instalaciones

🚀 Rápido y Fácil
- Interfaz intuitiva y moderna
- Resultados en segundos
- No requiere registro para buscar

📱 Diseñada para Tu Comodidad
- Llamada directa desde la app
- Navegación GPS integrada
- Compatible con modo oscuro

🔒 Privacidad Garantizada
- Búsquedas anónimas
- Sin compartir datos personales
- Información confidencial protegida

Jahatelo es la app #1 para encontrar moteles y alojamientos por hora en América Latina. Ya sea para una escapada romántica, descanso durante un viaje, o una estancia flexible, Jahatelo te conecta con las mejores opciones cerca de ti.

Descarga ahora y descubre por qué miles de usuarios confían en Jahatelo para sus búsquedas.

¿Tienes un motel? Visita jahatelo.com para registrarte como establecimiento.

---
🌐 Sitio web: https://jahatelo.com
📧 Soporte: soporte@jahatelo.com
```

**📱 Categoría**
- **Categoría**: Viajes y guías locales
- **Subcategoría**: Hoteles y alojamientos

**📧 Datos de contacto**
- **Correo**: soporte@jahatelo.com
- **Teléfono** (opcional): +54 xxx xxx xxxx
- **Sitio web**: https://jahatelo.com
- **Política de privacidad**: https://jahatelo.com/privacy ← **Obligatorio**

#### 3.3 Subir Assets Gráficos

**Ícono de la aplicación**
- Tamaño: **512x512px**
- Formato: PNG (32 bits)
- Sin transparencia
- Diseño: Logo de Jahatelo con fondo

**Gráfico destacado**
- Tamaño: **1024x500px**
- Formato: PNG o JPEG
- Sin transparencia
- Diseño sugerido: Banner promocional con texto "Encuentra tu motel ideal"

**Capturas de pantalla** (mínimo 2)
- Tamaño mínimo: 320px en lado corto
- Proporción: 16:9 o 9:16
- Formato: PNG o JPEG
- Recomendación: 4-6 screenshots mostrando:
  1. Pantalla de inicio con búsqueda
  2. Resultados en mapa
  3. Detalle de motel
  4. Lista de moteles
  5. Filtros
  6. Perfil de motel con fotos

**Video promocional** (opcional)
- YouTube o Vimeo
- Máximo 30 segundos

---

### Paso 4: Configurar la App

#### 4.1 Clasificación de Contenido

Ve a **Política > Clasificación de contenido**

1. Click en **"Empezar"**
2. **Dirección de correo**: soporte@jahatelo.com
3. **Categoría**: Utilidades, Productividad o Referencias
4. Responde el cuestionario:
   - ¿Violencia? → **No**
   - ¿Contenido sexual? → **No** (solo información de moteles)
   - ¿Lenguaje obsceno? → **No**
   - ¿Drogas/alcohol? → **No**
   - ¿Discriminación? → **No**
   - ¿Miedo/terror? → **No**
   - ¿Apuestas/juegos de azar? → **No**
5. **Enviar** → Recibirás calificaciones automáticas (PEGI 3, ESRB Everyone, etc.)

#### 4.2 Público Objetivo y Contenido

Ve a **Política > Público objetivo y contenido**

1. **Grupo de edad objetivo**: 18+
2. **Audiencia menor de 13 años**: **No**
3. **App principalmente para niños**: **No**
4. **Interés especial para niños**: **No**

#### 4.3 Privacidad

Ve a **Política > Seguridad de datos**

1. **¿Recopilas datos?**: **Sí** (si usas analytics)
2. Marca qué recopilas:
   - ✅ Ubicación aproximada (para búsquedas)
   - ✅ Datos de uso de la app (analytics)
   - ❌ Datos personales (si NO pides registro)
3. **¿Compartes datos?**: **No** (o especifica con quién)
4. **URL de política de privacidad**: https://jahatelo.com/privacy

#### 4.4 Seleccionar Países

Ve a **Producción > Países/Regiones**

1. **Seleccionar países**:
   - Opción 1: Todos los países
   - Opción 2: Solo países específicos (Argentina, Chile, Colombia, México, etc.)
2. Click **"Agregar países"**

---

### Paso 5: Crear Lanzamiento de Producción

#### 5.1 Subir el AAB

1. Ve a **Producción > Producción**
2. Click en **"Crear nuevo lanzamiento"**
3. **Subir el AAB**: Arrastra `jahatelo-1.0.0.aab`
4. **Nombre del lanzamiento**: "1.0.0 - Lanzamiento inicial"
5. **Notas de la versión** (lo que verán los usuarios):

```
🎉 Lanzamiento inicial de Jahatelo

✨ Funciones principales:
- Búsqueda de moteles cerca de ti
- Mapa interactivo con ubicaciones
- Información verificada y actualizada
- Contacto directo con establecimientos
- Filtros por precio y servicios
- Modo oscuro

¡Gracias por usar Jahatelo!
```

#### 5.2 Revisión Final

1. Ve a **Panel de control**
2. Verifica que todos los apartados tengan ✅ verde
3. Si hay ⚠️ amarillo o 🔴 rojo, completa esos apartados

#### 5.3 Enviar a Revisión

1. Click en **"Enviar a revisión"**
2. Confirma el envío

**⏱️ Tiempo de revisión**:
- Primera vez: 1-7 días
- Actualizaciones posteriores: 1-3 días

---

### Paso 6: Seguimiento

#### 6.1 Monitorear Estado

Ve a **Panel de control** para ver:
- 🟡 **En revisión**: Google está revisando
- 🔴 **Rechazada**: Necesitas corregir algo
- 🟢 **Publicada**: ¡Ya está en la tienda!

#### 6.2 Link de la App

Una vez publicada:
```
https://play.google.com/store/apps/details?id=com.mbaretech.jahatelo
```

Compártelo en redes sociales y sitio web.

---

## 🍎 Apple App Store (iOS)

### Paso 1: Inscribirse en Apple Developer Program

#### 1.1 Crear Apple ID

1. Ve a [Apple ID](https://appleid.apple.com/)
2. Crea tu Apple ID (si no tienes)
3. Activa **autenticación de dos factores** (obligatorio)

#### 1.2 Inscribirse en Apple Developer Program

1. Ve a [Apple Developer Program](https://developer.apple.com/programs/)
2. Click en **"Enroll"**
3. Inicia sesión con tu Apple ID
4. Elige tipo de cuenta:
   - **Individual**: $99/año (tu nombre aparecerá como desarrollador)
   - **Organization**: $99/año (nombre de la empresa aparecerá)
     - Requiere DUNS number (puedes solicitarlo gratis)
5. Completa formulario:
   - Información de contacto
   - Información de pago
   - Aceptar términos
6. Paga **$99 USD** (anual)

**⏱️ Tiempo de aprobación**:
- Individual: 24-48 horas
- Organization: 1-2 semanas

---

### Paso 2: Configurar Certificados y Perfiles

#### 2.1 Crear App ID

1. Ve a [Apple Developer - Certificates](https://developer.apple.com/account/resources/identifiers/list)
2. Click en **"+"** → **App IDs** → **Continue**
3. **Description**: "Jahatelo App"
4. **Bundle ID**: `com.mbaretech.jahatelo` ← **Debe coincidir con app.json**
5. **Capabilities** (marca las que uses):
   - ✅ Push Notifications (si usas notificaciones push)
   - ✅ Maps (si usas mapas de Apple)
   - ✅ Location Services (si usas GPS)
6. Click **"Continue"** → **"Register"**

#### 2.2 Crear Certificado de Distribución

```bash
# Generar Certificate Signing Request (CSR) en Mac
# Aplicaciones > Utilidades > Acceso a Llaveros
# Menú: Acceso a Llaveros > Asistente de Certificados > Solicitar un certificado de una autoridad de certificación

# Completa:
# - Correo: tu@email.com
# - Nombre común: Jahatelo Distribution
# - Guardar en disco

# Esto genera: CertificateSigningRequest.certSigningRequest
```

1. Ve a [Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click **"+"** → **Apple Distribution** → **Continue**
3. **Subir el CSR** → **Continue**
4. **Descargar** el certificado: `distribution.cer`
5. **Doble click** en el archivo para instalarlo en Llavero

#### 2.3 Crear Perfil de Aprovisionamiento

1. Ve a [Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click **"+"** → **App Store** → **Continue**
3. **App ID**: Selecciona "Jahatelo App"
4. **Certificate**: Selecciona el certificado de distribución
5. **Profile Name**: "Jahatelo App Store Distribution"
6. **Generate** → **Download**: `Jahatelo_App_Store.mobileprovision`

---

### Paso 3: Preparar la App para iOS

#### 3.1 Configurar `app.json` para iOS

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.mbaretech.jahatelo",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Jahatelo necesita tu ubicación para mostrarte moteles cercanos.",
        "NSLocationAlwaysUsageDescription": "Jahatelo necesita tu ubicación para mostrarte moteles cercanos.",
        "NSCameraUsageDescription": "Jahatelo necesita acceso a la cámara para subir fotos.",
        "NSPhotoLibraryUsageDescription": "Jahatelo necesita acceso a tus fotos."
      },
      "config": {
        "googleMapsApiKey": "TU_GOOGLE_MAPS_API_KEY_IOS"
      }
    }
  }
}
```

#### 3.2 Build con EAS (Recomendado)

```bash
# Build de producción para iOS
eas build --platform ios --profile production

# Esto generará un archivo IPA
```

**Nota**: Necesitas tener el certificado y perfil configurados en EAS.

```bash
# Configurar credenciales automáticas
eas credentials

# O manual
eas build:configure
```

#### 3.3 Resultado

Obtendrás un archivo:
- **IPA**: `jahatelo-1.0.0.ipa` ← **Usa este para App Store**

---

### Paso 4: Crear App en App Store Connect

#### 4.1 Crear Nueva App

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Click en **"My Apps"** → **"+"** → **"New App"**
3. Completa:
   - **Platform**: iOS
   - **Name**: "Jahatelo - Moteles y Alojamientos"
   - **Primary Language**: Spanish (Spain) o Spanish (Latin America)
   - **Bundle ID**: `com.mbaretech.jahatelo` (debe coincidir)
   - **SKU**: `jahatelo-app` (identificador interno único)
   - **User Access**: Full Access
4. Click **"Create"**

#### 4.2 Información de la App

**General Information**
- **Name**: "Jahatelo"
- **Subtitle** (≤30 caracteres): "Encuentra tu motel ideal"
- **Category**:
  - Primary: Travel
  - Secondary: Navigation

**Version Information**
- **Screenshots** (OBLIGATORIO - por dispositivo):
  - iPhone 6.7" (iPhone 14 Pro Max): 1290x2796px (2-10 capturas)
  - iPhone 6.5" (iPhone 11 Pro Max): 1242x2688px
  - iPhone 5.5" (iPhone 8 Plus): 1242x2208px
  - iPad Pro 12.9": 2048x2732px (opcional)

**Promotional Text** (≤170 caracteres)
```
Descubre moteles verificados cerca de ti. Información actualizada, precios transparentes y ubicaciones exactas. ¡Descarga gratis!
```

**Description** (≤4000 caracteres)
```
🏨 Jahatelo - Tu Guía de Moteles y Alojamientos por Hora

Encuentra el motel perfecto en segundos. Jahatelo te muestra información verificada, precios actualizados y ubicaciones exactas de moteles cerca de ti.

✨ CARACTERÍSTICAS PRINCIPALES

🔍 Búsqueda Inteligente
• Encuentra moteles cerca de tu ubicación
• Filtra por precio, servicios, calificación
• Mapa interactivo con información en tiempo real

💰 Precios Transparentes
• Tarifas actualizadas de habitaciones
• Información de servicios incluidos
• Sin costos ocultos

📍 Información Verificada
• Direcciones exactas con GPS
• Horarios de atención actualizados
• Contacto directo con el establecimiento

⭐ Calificaciones y Reseñas
• Lee experiencias de otros usuarios
• Calificaciones verificadas
• Fotos reales de las instalaciones

🚀 Rápido y Fácil
• Interfaz intuitiva y moderna
• Resultados en segundos
• No requiere registro para buscar

📱 Diseñada para Tu Comodidad
• Llamada directa desde la app
• Navegación GPS integrada
• Modo oscuro disponible

🔒 Privacidad Garantizada
• Búsquedas anónimas
• Sin compartir datos personales
• Información confidencial protegida

Jahatelo es la app #1 para encontrar moteles y alojamientos por hora en América Latina. Ya sea para una escapada romántica, descanso durante un viaje, o una estancia flexible, Jahatelo te conecta con las mejores opciones cerca de ti.

Descarga ahora y descubre por qué miles de usuarios confían en Jahatelo.

¿Tienes un motel? Visita jahatelo.com para registrarte.

CONTACTO
🌐 Sitio web: https://jahatelo.com
📧 Soporte: soporte@jahatelo.com
```

**Keywords** (≤100 caracteres, separadas por comas)
```
motel,hoteles,alojamiento,habitaciones,romance,pareja,viajes,cerca,mapa,gps
```

**Support URL**: https://jahatelo.com/support

**Marketing URL** (opcional): https://jahatelo.com

**Privacy Policy URL**: https://jahatelo.com/privacy

#### 4.3 App Store Icon

- Tamaño: **1024x1024px**
- Formato: PNG
- Sin canales alpha (sin transparencia)
- Sin bordes redondeados (Apple los agrega automáticamente)

#### 4.4 Clasificación por Edad

Click en **"Edit"** en Rating

Responde el cuestionario:
- Violence: None
- Sexual Content: None
- Profanity: None
- Horror/Fear: None
- Mature/Suggestive Themes: None
- Medical/Treatment: None
- Alcohol/Tobacco: None
- Gambling: None
- Unrestricted Web Access: No

**Resultado**: Likely 4+

---

### Paso 5: Subir el Build

#### 5.1 Usando Transporter (Mac)

1. Descarga [Transporter](https://apps.apple.com/app/transporter/id1450874784) de la App Store
2. Abre Transporter
3. Inicia sesión con tu Apple ID
4. Arrastra el archivo `jahatelo-1.0.0.ipa`
5. Click en **"Deliver"**

#### 5.2 Usando EAS Submit

```bash
# Subir build automáticamente
eas submit --platform ios

# O manual con archivo IPA
eas submit --platform ios --path jahatelo-1.0.0.ipa
```

**⏱️ Tiempo de procesamiento**: 5-30 minutos

#### 5.3 Verificar Build

1. Ve a App Store Connect
2. Click en tu app → **TestFlight** (tab)
3. Espera a que el build aparezca con estado **"Ready to Submit"**
4. Ve al tab **"App Store"**
5. Junto a "Build", click en **"+"**
6. Selecciona el build que subiste

---

### Paso 6: Información Adicional

#### 6.1 Pricing and Availability

1. Click en **"Pricing and Availability"**
2. **Price**: Free (Gratis)
3. **Availability**: Selecciona países (o todos)

#### 6.2 App Privacy

1. Click en **"App Privacy"**
2. **Get Started**
3. **Do you collect data from this app?**: Yes
4. Marca tipos de datos que recopilas:
   - ✅ **Location** → Approximate Location → Used for App Functionality
   - ✅ **Usage Data** → Product Interaction → Used for Analytics
5. **Next** → **Confirm** → **Publish**

#### 6.3 Version Release

1. Click en **"Version Release"**
2. Opciones:
   - **Automatically release**: Se publica automáticamente al ser aprobada
   - **Manually release**: Tú decides cuándo publicarla después de aprobación

---

### Paso 7: Enviar a Revisión

#### 7.1 Revisión Final

Verifica que todo esté completo:
- ✅ App Information
- ✅ Pricing and Availability
- ✅ App Privacy
- ✅ Screenshots
- ✅ Build selected
- ✅ Version Information

#### 7.2 Enviar

1. Ve a la sección principal de la versión
2. Click en **"Add for Review"** (esquina superior derecha)
3. Responde preguntas adicionales:
   - **Export Compliance**: No (si no usas encriptación fuerte)
   - **Advertising Identifier**: No (si no usas ads)
4. Click en **"Submit for Review"**

**⏱️ Tiempo de revisión**:
- Primera vez: 2-7 días
- Actualizaciones: 1-3 días

---

### Paso 8: Seguimiento

#### 8.1 Estados Posibles

- 🟡 **Waiting for Review**: En cola de revisión
- 🟠 **In Review**: Apple está revisando (24-48 horas generalmente)
- 🔴 **Rejected**: Necesitas hacer cambios y reenviar
- 🟢 **Ready for Sale**: ¡Aprobada y publicada!

#### 8.2 Link de la App

Una vez publicada:
```
https://apps.apple.com/app/idXXXXXXXXXX
```

(El ID lo verás en App Store Connect)

---

## ✅ Checklist Pre-Lanzamiento

Antes de enviar a las tiendas, verifica:

### Contenido

- [ ] Todas las pantallas funcionan correctamente
- [ ] No hay lorem ipsum ni texto de prueba
- [ ] Links de política de privacidad y términos funcionan
- [ ] Correo de soporte es válido
- [ ] App funciona sin crashes

### Gráficos

- [ ] Ícono de 512x512px (Android)
- [ ] Ícono de 1024x1024px (iOS)
- [ ] Feature Graphic 1024x500px (Android)
- [ ] 4-6 screenshots de diferentes pantallas
- [ ] Screenshots en alta resolución
- [ ] Sin marcas de agua en imágenes

### Legal

- [ ] Política de privacidad publicada online
- [ ] Términos de servicio (si aplica)
- [ ] Correo de soporte válido
- [ ] Clasificación de contenido completada
- [ ] Permisos de ubicación justificados

### Técnico

- [ ] Build firmada correctamente (Android keystore)
- [ ] Bundle ID correcto (iOS)
- [ ] Versión y versionCode correctos
- [ ] Permisos solo los necesarios
- [ ] Google Maps API key configurada
- [ ] Push notifications configuradas (si aplica)

---

## 📊 Monitoreo Post-Lanzamiento

### Primeras 24-48 Horas

**Monitorear:**
- 📥 Descargas
- ⭐ Calificaciones
- 💬 Reseñas/comentarios
- 🐛 Reportes de crashes
- 📧 Correos de soporte

**Herramientas:**
- Google Play Console → Statistics
- App Store Connect → Analytics
- Firebase Crashlytics (si está configurado)

### Primera Semana

**Métricas Clave:**
- Instalaciones totales
- Instalaciones por país
- Tasa de retención (día 1, día 7)
- Tiempo promedio en la app
- Pantallas más visitadas
- Crashes por versión del OS

### Responder a Reseñas

**Google Play:**
1. Play Console → Ratings and Reviews
2. Responde reseñas (especialmente negativas)
3. Agrádece feedback positivo

**App Store:**
1. App Store Connect → Ratings and Reviews
2. Solo puedes responder una vez por reseña
3. Sé profesional y cortés

---

## 🚨 Troubleshooting

### Google Play - Problemas Comunes

#### 1. "App no compatible con ningún dispositivo"
**Causa**: Permisos o requerimientos muy restrictivos
**Solución**:
```json
// app.json
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",  // Solo permisos necesarios
    "INTERNET"
  ]
}
```

#### 2. "Violación de política de privacidad"
**Causa**: No especificaste qué datos recopilas
**Solución**:
- Ve a Política → Seguridad de datos
- Declara todos los datos que recopilas
- Publica política de privacidad en tu sitio

#### 3. "Firma de la app inválida"
**Causa**: Keystore incorrecto o perdido
**Solución**:
- Regenera el AAB con el keystore correcto
- Si perdiste el keystore, debes crear nueva app (ID diferente)

#### 4. "Ícono tiene transparencia"
**Causa**: PNG con canal alpha
**Solución**:
- Exporta PNG sin transparencia
- Usa fondo sólido en el ícono

---

### Apple App Store - Problemas Comunes

#### 1. "Invalid Binary"
**Causa**: Build no firmada correctamente
**Solución**:
```bash
# Regenerar certificados
eas credentials

# Rebuild
eas build --platform ios --profile production --clear-cache
```

#### 2. "Missing Required Icon"
**Causa**: Ícono de 1024x1024 con transparencia o mal formato
**Solución**:
- Exporta PNG sin canales alpha
- Sin bordes redondeados
- Colores RGB (no CMYK)

#### 3. "Guideline 2.1 - Performance - App Completeness"
**Causa**: App crashea, links rotos, o contenido de prueba
**Solución**:
- Prueba toda la app en dispositivo real
- Verifica todos los links
- Elimina contenido "Lorem ipsum"
- Asegúrate de que todo funcione sin backend si es posible

#### 4. "Guideline 4.2 - Design - Minimum Functionality"
**Causa**: App muy simple o solo es un web wrapper
**Solución**:
- Agrega funcionalidad nativa (GPS, notificaciones, etc.)
- No es solo un WebView de tu sitio
- Tiene valor agregado sobre la web

#### 5. "Guideline 5.1.1 - Legal - Privacy - Data Collection"
**Causa**: Recopilas datos sin declararlo o sin política de privacidad
**Solución**:
- Completa "App Privacy" en App Store Connect
- Publica política de privacidad
- Justifica por qué necesitas cada permiso

---

## 📞 Contacto y Recursos

### Soporte Oficial

**Google Play:**
- [Developer Support](https://support.google.com/googleplay/android-developer/)
- [Policy Center](https://support.google.com/googleplay/android-developer/answer/9904549)

**Apple:**
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [App Review](https://developer.apple.com/app-store/review/)

### Recursos Adicionales

- [Expo Docs - Deploying to App Stores](https://docs.expo.dev/distribution/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

## 🎯 Timeline Estimado

| Tarea | Tiempo Estimado |
|-------|-----------------|
| **Preparación de assets** | 2-4 horas |
| Crear cuentas de desarrollador | 30 min (Google), 1 hora (Apple) |
| Configurar builds y certificados | 2-3 horas |
| Completar fichas de las tiendas | 1-2 horas |
| **Revisión Google Play** | 1-7 días |
| **Revisión Apple** | 2-7 días |
| **TOTAL hasta publicación** | **3-14 días** |

---

## 🏁 Siguientes Pasos Después de Publicación

1. **Marketing:**
   - Compartir links en redes sociales
   - Agregar badges de tiendas en el sitio web
   - Enviar comunicado de prensa

2. **Monitoreo:**
   - Responder reseñas diariamente
   - Monitorear crashes
   - Revisar analytics semanalmente

3. **Actualizaciones:**
   - Corregir bugs reportados
   - Agregar nuevas funcionalidades
   - Actualizar cada 2-4 semanas

4. **ASO (App Store Optimization):**
   - Optimizar keywords según búsquedas
   - Actualizar screenshots con nuevas funcionalidades
   - Pedir a usuarios que dejen reseñas

---

**Última actualización:** Enero 2025

**¿Necesitas ayuda?** Consulta la documentación oficial o escribe a soporte@jahatelo.com

---

## 📝 Notas Finales

- **Guarda tus credenciales en lugar seguro**: Keystore, certificados, contraseñas
- **Haz backups**: De archivos de firma y certificados
- **Documenta tu proceso**: Para futuras actualizaciones
- **Sé paciente**: La primera publicación siempre toma más tiempo
- **Lee las guías oficiales**: Las políticas cambian constantemente

¡Buena suerte con el lanzamiento de Jahatelo! 🚀🎉
