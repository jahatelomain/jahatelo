# 🔑 Guía: Obtener Credenciales de Google Cloud Console

**Para**: Google Sign-In en Jahatelo App
**Fecha**: Enero 2025
**Tiempo estimado**: 15-20 minutos

---

## 📋 Prerequisitos

- Cuenta de Google (Gmail)
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Paso 1: Crear Proyecto en Google Cloud

### 1.1 Acceder a la Consola

1. Ve a [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google

### 1.2 Crear Nuevo Proyecto

1. Click en el selector de proyectos (arriba a la izquierda, junto a "Google Cloud")
2. Click en **"New Project"** (Nuevo proyecto)
3. Completa:
   - **Project name**: `Jahatelo`
   - **Organization**: (si tienes, opcional)
   - **Location**: (si tienes, opcional)
4. Click **"Create"** (Crear)
5. Espera 10-20 segundos mientras se crea el proyecto
6. Selecciona el nuevo proyecto desde el selector

---

## 🔧 Paso 2: Habilitar Google+ API

### 2.1 Buscar la API

1. En el menú lateral (hamburguesa ☰), ve a **"APIs & Services"** → **"Library"**
2. En el buscador, escribe: `Google+ API` o `Google People API`
3. Click en **"Google+ API"** (o "People API" si no encuentras +)

### 2.2 Habilitar

1. Click en **"Enable"** (Habilitar)
2. Espera a que se habilite (10-20 segundos)

---

## 🎯 Paso 3: Configurar OAuth Consent Screen

**IMPORTANTE**: Debes hacer esto ANTES de crear credenciales.

### 3.1 Acceder a Consent Screen

1. En el menú lateral, ve a **"APIs & Services"** → **"OAuth consent screen"**

### 3.2 Configurar Tipo de Usuario

1. Selecciona **"External"** (para que cualquiera pueda usar la app)
2. Click **"Create"**

### 3.3 Completar Información de la App

**App information:**
- **App name**: `Jahatelo`
- **User support email**: tu_email@gmail.com (o el correo del proyecto)
- **App logo**: (opcional, puedes subirlo después)

**App domain:**
- **Application home page**: `https://jahatelo.com`
- **Application privacy policy link**: `https://jahatelo.com/privacy`
- **Application terms of service link**: `https://jahatelo.com/terms` (opcional)

**Authorized domains:**
- Agregar: `jahatelo.com`

**Developer contact information:**
- **Email addresses**: tu_email@gmail.com

3. Click **"Save and Continue"**

### 3.4 Configurar Scopes

1. Click **"Add or Remove Scopes"**
2. Busca y marca:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. Click **"Update"**
4. Click **"Save and Continue"**

### 3.5 Test Users (Opcional si está en modo Testing)

Si la app está en modo "Testing":
1. Click **"Add Users"**
2. Agregar emails de prueba (máx. 100)
3. Click **"Save and Continue"**

### 3.6 Resumen

1. Revisa todo
2. Click **"Back to Dashboard"**

**Estado**: Ahora debería aparecer como "Testing" o "In production"

---

## 🔐 Paso 4: Crear Credenciales OAuth

Ahora sí, vamos a crear las credenciales para Android, iOS y Web/Expo.

### 4.1 Acceder a Credentials

1. En el menú lateral, ve a **"APIs & Services"** → **"Credentials"**
2. Click en **"+ Create Credentials"** (arriba)
3. Selecciona **"OAuth 2.0 Client ID"**

---

## 📱 Paso 4.2: Credencial para ANDROID

### A. Obtener SHA-1 Fingerprint

**Opción 1: Desarrollo con Expo (más fácil)**

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
npx expo fetch:android:hashes
```

Copia el **SHA-1** que aparece.

**Opción 2: Con keytool (si tienes keystore)**

```bash
keytool -list -v -keystore jahatelo-release.keystore -alias jahatelo-key-alias
```

Busca la línea: `SHA1: XX:XX:XX:...`

### B. Crear Credencial

1. **Application type**: Android
2. **Name**: `Jahatelo Android`
3. **Package name**: `app.jahatelo.mobile` (del app.json)
4. **SHA-1 certificate fingerprint**: (pega el que obtuviste arriba)
5. Click **"Create"**

**Resultado**: Verás el **Client ID** de Android

```
EJEMPLO:
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

✅ **Copia y guárdalo** (lo necesitarás después)

---

## 🍎 Paso 4.3: Credencial para iOS

### A. Obtener Bundle ID

Ya lo tienes en `app.json`: `app.jahatelo.mobile`

### B. Crear Credencial

1. Click en **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
2. **Application type**: iOS
3. **Name**: `Jahatelo iOS`
4. **Bundle ID**: `app.jahatelo.mobile`
5. Click **"Create"**

**Resultado**: Verás el **Client ID** de iOS

```
EJEMPLO:
987654321-zyxwvutsrqponm.apps.googleusercontent.com
```

✅ **Copia y guárdalo**

---

## 🌐 Paso 4.4: Credencial para WEB (Expo / Testing)

### A. Crear Credencial Web

1. Click en **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
2. **Application type**: Web application
3. **Name**: `Jahatelo Web`
4. **Authorized JavaScript origins**:
   - `https://jahatelo.com`
   - `https://www.jahatelo.com`
   - `https://auth.expo.io` (para testing con Expo Go)
5. **Authorized redirect URIs**:
   - `https://auth.expo.io/@jmongelos/jahatelo` (reemplaza `jmongelos` con tu username de Expo)
   - `https://jahatelo.com/auth/callback` (si tienes web login)
6. Click **"Create"**

**Resultado**: Verás el **Client ID** de Web

```
EJEMPLO:
555666777-qwertyuiop.apps.googleusercontent.com
```

✅ **Copia y guárdalo**

---

## 🔧 Paso 5: Configurar las Credenciales en la App

Ahora tienes **3 Client IDs**:
- ✅ Android Client ID
- ✅ iOS Client ID
- ✅ Web Client ID

### 5.1 Actualizar `app.json`

Abre: `app/jahatelo-app/app.json`

Reemplaza los placeholders en `extra`:

```json
"extra": {
  "eas": {
    "projectId": "98e7ed1c-2b9c-45e9-8058-4e8f94cd7235"
  },
  "router": {},
  "googleClientIdExpo": "TU_WEB_CLIENT_ID.apps.googleusercontent.com",
  "googleClientIdIos": "TU_IOS_CLIENT_ID.apps.googleusercontent.com",
  "googleClientIdAndroid": "TU_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  "googleClientIdWeb": "TU_WEB_CLIENT_ID.apps.googleusercontent.com"
}
```

**Nota**: `googleClientIdExpo` y `googleClientIdWeb` usan el **mismo** Web Client ID.

### 5.2 Verificar Configuración

```bash
cd app/jahatelo-app
cat app.json | grep "googleClientId"
```

Deberías ver tus Client IDs reales (no "PLACEHOLDER").

---

## ✅ Paso 6: Testing

### 6.1 Reiniciar Expo

```bash
cd app/jahatelo-app
npm start
# O
npx expo start --clear
```

### 6.2 Probar en Expo Go (Desarrollo)

1. Abre la app en tu teléfono con Expo Go
2. Ve a **Login**
3. Presiona el botón de **Google**
4. Debería abrir el navegador y mostrar la pantalla de login de Google
5. Selecciona tu cuenta
6. Acepta permisos
7. Debería regresar a la app y mostrar "¡Bienvenido!"

### 6.3 Probar en Dispositivo Real (Build)

Para testing en dispositivo sin Expo Go:

```bash
cd app/jahatelo-app

# Android
npx expo run:android

# iOS (solo en Mac)
npx expo run:ios
```

---

## 🚨 Troubleshooting

### Error: "Error 400: redirect_uri_mismatch"

**Causa**: El redirect URI no está autorizado.

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Click en tu **Web Client ID**
3. En "Authorized redirect URIs", agrega:
   ```
   https://auth.expo.io/@TU_USERNAME/jahatelo
   ```
4. Reemplaza `TU_USERNAME` con tu username de Expo
5. Guarda

Para saber tu username:
```bash
npx expo whoami
```

---

### Error: "Error 401: invalid_client"

**Causa**: Client ID incorrecto en `app.json`.

**Solución**:
1. Verifica que los Client IDs en `app.json` sean exactos
2. No debe haber espacios ni caracteres extra
3. Debe incluir `.apps.googleusercontent.com`

---

### Error: "Google+ API not enabled"

**Causa**: No habilitaste la API en el Paso 2.

**Solución**:
1. Ve a Google Cloud Console → APIs & Services → Library
2. Busca "Google+ API"
3. Click **"Enable"**
4. Espera 1 minuto y reintenta

---

### Botón de Google deshabilitado (gris)

**Causa**: Las credenciales siguen como "PLACEHOLDER".

**Solución**:
1. Verifica que reemplazaste los placeholders en `app.json`
2. Reinicia Expo: `npx expo start --clear`
3. Recarga la app

---

## 📚 Recursos Adicionales

- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo Auth Session Docs](https://docs.expo.dev/guides/authentication/)
- [Google Sign-In iOS Setup](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Google Sign-In Android Setup](https://developers.google.com/identity/sign-in/android/start-integrating)

---

## 📝 Checklist Final

Antes de declarar que está funcionando, verifica:

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google+ API habilitada
- [ ] OAuth Consent Screen configurado
- [ ] Credencial de Android creada con SHA-1
- [ ] Credencial de iOS creada con Bundle ID
- [ ] Credencial de Web creada con redirect URIs
- [ ] `app.json` actualizado con los 3 Client IDs (sin PLACEHOLDER)
- [ ] Expo reiniciado (`npx expo start --clear`)
- [ ] Botón de Google habilitado (no gris)
- [ ] Login funciona en Expo Go
- [ ] Usuario aparece en backend después del login

---

## 🎉 ¡Listo!

Si llegaste hasta aquí, ya tienes Google Sign-In funcionando en Jahatelo.

**Próximos pasos:**
2. Implementar SMS/WhatsApp auth con Firebase
3. Publicar en las tiendas

---

**Última actualización:** Enero 2025
**Creado por:** Claude Code (MBARETECH)
