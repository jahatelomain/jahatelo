# 🔐 Configuración Google OAuth - Jahatelo

**Fecha:** 19 Enero 2025
**Proyecto:** Jahatelo App

---

## 📋 Información del Proyecto

- **Package Name (Android):** `app.jahatelo.mobile`
- **Bundle ID (iOS):** `app.jahatelo.mobile`
- **Expo Username:** `jmongelos`
- **EAS Project ID:** `98e7ed1c-2b9c-45e9-8058-4e8f94cd7235`

---

## 🔧 Credenciales a Crear en Google Cloud Console

Ve a: https://console.cloud.google.com/apis/credentials

---

### 1️⃣ CREDENCIAL ANDROID

**Tipo:** OAuth 2.0 Client ID → Android

**Configuración:**
```
Name: Jahatelo Android
Package name: app.jahatelo.mobile
SHA-1 certificate fingerprint: [AQUÍ VA TU SHA-1 QUE YA TIENES]
```

**SHA-1 para Desarrollo con Expo Go (si usas Expo Go):**
```
E7:99:7A:F7:A3:25:2B:9E:93:1B:EE:AA:54:93:59:D6:3F:84:97:DB
```

**Resultado:**
```
Client ID: _____________________________.apps.googleusercontent.com
```

---

### 2️⃣ CREDENCIAL iOS

**Tipo:** OAuth 2.0 Client ID → iOS

**Configuración:**
```
Name: Jahatelo iOS
Bundle ID: app.jahatelo.mobile
```

**Resultado:**
```
Client ID: _____________________________.apps.googleusercontent.com
```

---

### 3️⃣ CREDENCIAL WEB

**Tipo:** OAuth 2.0 Client ID → Web application

**Configuración:**
```
Name: Jahatelo Web

Authorized JavaScript origins:
- https://jahatelo.com
- https://www.jahatelo.com
- https://auth.expo.io

Authorized redirect URIs:
- https://auth.expo.io/@jmongelos/jahatelo
- https://jahatelo.com/auth/callback
- https://www.jahatelo.com/auth/callback
```

**Resultado:**
```
Client ID: _____________________________.apps.googleusercontent.com
```

---

## 📝 Pasos en Google Cloud Console

### Paso 1: OAuth Consent Screen (si no lo hiciste)
1. Ve a: APIs & Services → OAuth consent screen
2. External → Create
3. App name: `Jahatelo`
4. User support email: tu email
5. Developer email: tu email
6. Authorized domains: `jahatelo.com`
7. Save and Continue

### Paso 2: Crear las 3 Credenciales
1. Ve a: APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Crea las 3 credenciales (Android, iOS, Web) con los datos de arriba
4. Guarda los 3 Client IDs que te da Google

### Paso 3: Actualizar app.json
Una vez tengas los 3 Client IDs, actualiza el `app.json`:

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

**Nota:** `googleClientIdExpo` y `googleClientIdWeb` usan el mismo Web Client ID.

---

## 🚀 Testing

Después de actualizar el `app.json`:

```bash
cd /Users/jota/Desktop/IA/MBARETECH/projects/jahatelo/app/jahatelo-app
npm start
```

En la app, ve a Login → presiona el botón de Google → debería funcionar.

---

## ✅ Checklist

- [ ] OAuth Consent Screen configurado
- [ ] Credencial Android creada (con SHA-1)
- [ ] Credencial iOS creada (con Bundle ID)
- [ ] Credencial Web creada (con redirect URIs)
- [ ] Los 3 Client IDs guardados
- [ ] `app.json` actualizado con los Client IDs reales
- [ ] Expo reiniciado
- [ ] Google login probado y funcionando

---

**Última actualización:** 19 Enero 2025
