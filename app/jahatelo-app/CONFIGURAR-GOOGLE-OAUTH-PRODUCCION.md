# 🔐 Configurar Google OAuth para Producción - Jahatelo

**Fecha:** 19 Enero 2025
**Keystore:** Build Credentials 3qNdEPGrlx (Producción EAS)
**Tiempo estimado:** 25 minutos

---

## ✅ INFORMACIÓN LISTA PARA USAR

### 📱 Android
```
Package name: app.jahatelo.mobile
SHA-1: 42:39:8A:71:18:C9:12:EB:D8:88:E6:8F:1B:2F:7A:8C:AA:4D:05:23
```

### 🍎 iOS
```
Bundle ID: app.jahatelo.mobile
```

### 🌐 Web
```
Expo Username: jmongelos
Redirect URI: https://auth.expo.io/@jmongelos/jahatelo
Authorized domains: jahatelo.com
```

---

# 🚀 GUÍA PASO A PASO

## PASO 1: Acceder a Google Cloud Console

1. Abre tu navegador
2. Ve a: **https://console.cloud.google.com/**
3. Inicia sesión con tu cuenta de Google

---

## PASO 2: Crear/Seleccionar Proyecto

### Si NO tienes proyecto "Jahatelo":

1. Click en el selector de proyectos (arriba a la izquierda)
2. Click **"NEW PROJECT"**
3. **Project name:** `Jahatelo`
4. Click **"CREATE"**
5. Espera 10-20 segundos
6. Selecciona el proyecto "Jahatelo"

### Si YA tienes proyecto "Jahatelo":

1. Click en el selector de proyectos
2. Selecciona **"Jahatelo"**

✅ **Verificación:** Arriba deberías ver "Jahatelo"

---

## PASO 3: Habilitar Google+ API

1. Click en el menú **☰** (hamburguesa)
2. **APIs & Services** → **Library**
3. Busca: `Google+ API`
4. Click en **"Google+ API"**
5. Click **"ENABLE"**
6. Espera 10-20 segundos

✅ **Verificación:** Deberías ver "Manage"

---

## PASO 4: Configurar OAuth Consent Screen

### 4.1 Ir a Consent Screen

1. Menú lateral → **"OAuth consent screen"**
2. Selecciona **"External"**
3. Click **"CREATE"**

### 4.2 Página 1: App Information

**App information:**
- **App name:** `Jahatelo`
- **User support email:** [Selecciona tu email]

**App domain:**
- **Application home page:** `https://jahatelo.com`
- **Application privacy policy link:** `https://jahatelo.com/privacy`
- **Application terms of service:** `https://jahatelo.com/terms`

**Authorized domains:**
- Click **"ADD DOMAIN"**
- Escribe: `jahatelo.com`
- Presiona Enter

**Developer contact information:**
- **Email addresses:** [Tu email]

Click **"SAVE AND CONTINUE"**

### 4.3 Página 2: Scopes

1. Click **"ADD OR REMOVE SCOPES"**
2. Marca estos 3:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

### 4.4 Página 3: Test users

- (OPCIONAL) Agrega emails de prueba si quieres
- Click **"SAVE AND CONTINUE"**

### 4.5 Página 4: Summary

- Revisa todo
- Click **"BACK TO DASHBOARD"**

✅ **Verificación:** Status debe ser "Testing" o "In production"

---

## PASO 5: Crear Credencial ANDROID

### 5.1 Ir a Credentials

1. Menú lateral → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"**
3. Selecciona **"OAuth client ID"**

### 5.2 Configurar

1. **Application type:** **Android**
2. **Name:** `Jahatelo Android Production`
3. **Package name:**
   ```
   app.jahatelo.mobile
   ```
4. **SHA-1 certificate fingerprint:**
   ```
   42:39:8A:71:18:C9:12:EB:D8:88:E6:8F:1B:2F:7A:8C:AA:4D:05:23
   ```
   *(Copia y pega EXACTAMENTE esto)*

5. Click **"CREATE"**

### 5.3 Guardar Client ID

Aparecerá un popup con tu **Android Client ID**:

```
EJEMPLO: 123456789012-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

**IMPORTANTE:**
1. Click en el ícono de copiar 📋
2. Pégalo en un archivo de texto
3. Etiqueta: `ANDROID_CLIENT_ID`
4. Click **"OK"**

✅ **Guardado:** Android Client ID copiado

---

## PASO 6: Crear Credencial iOS

### 6.1 Nueva Credencial

1. Click **"+ CREATE CREDENTIALS"**
2. Selecciona **"OAuth client ID"**

### 6.2 Configurar

1. **Application type:** **iOS**
2. **Name:** `Jahatelo iOS Production`
3. **Bundle ID:**
   ```
   app.jahatelo.mobile
   ```
4. Click **"CREATE"**

### 6.3 Guardar Client ID

1. Click en el ícono de copiar 📋
2. Pégalo en tu archivo de texto
3. Etiqueta: `IOS_CLIENT_ID`
4. Click **"OK"**

✅ **Guardado:** iOS Client ID copiado

---

## PASO 7: Crear Credencial WEB

### 7.1 Nueva Credencial

1. Click **"+ CREATE CREDENTIALS"**
2. Selecciona **"OAuth client ID"**

### 7.2 Configurar

1. **Application type:** **Web application**
2. **Name:** `Jahatelo Web Production`

### 7.3 Authorized JavaScript origins

Click **"+ ADD URI"** y agrega uno por uno:

```
https://jahatelo.com
https://www.jahatelo.com
https://auth.expo.io
```

### 7.4 Authorized redirect URIs

Click **"+ ADD URI"** y agrega uno por uno:

```
https://auth.expo.io/@jmongelos/jahatelo
https://jahatelo.com/auth/callback
https://www.jahatelo.com/auth/callback
```

3. Click **"CREATE"**

### 7.5 Guardar Client ID

1. Click en el ícono de copiar 📋
2. Pégalo en tu archivo de texto
3. Etiqueta: `WEB_CLIENT_ID`
4. Click **"OK"**

✅ **Guardado:** Web Client ID copiado

---

## PASO 8: Verificar Client IDs

Ahora debes tener en tu archivo de texto:

```
ANDROID_CLIENT_ID: xxxxxxxxxx-yyyyyyyyyyyy.apps.googleusercontent.com
IOS_CLIENT_ID: aaaaaaaaaa-bbbbbbbbbbbb.apps.googleusercontent.com
WEB_CLIENT_ID: zzzzzzzzzz-cccccccccccc.apps.googleusercontent.com
```

✅ **Verificación:** Tienes los 3 Client IDs

---

## 🎉 LISTO EN GOOGLE CLOUD CONSOLE

Has terminado la configuración en Google Cloud Console.

---

## 📲 SIGUIENTE PASO

**Dame los 3 Client IDs** y yo actualizaré el código automáticamente.

Formato:
```
ANDROID_CLIENT_ID: xxxxx.apps.googleusercontent.com
IOS_CLIENT_ID: yyyyy.apps.googleusercontent.com
WEB_CLIENT_ID: zzzzz.apps.googleusercontent.com
```

---

## ❓ Problemas Comunes

**Error: "OAuth Consent Screen required"**
→ Completa el Paso 4 primero

**Error: "Invalid SHA-1"**
→ Verifica que copiaste exactamente:
```
42:39:8A:71:18:C9:12:EB:D8:88:E6:8F:1B:2F:7A:8C:AA:4D:05:23
```

**No veo el botón CREATE CREDENTIALS**
→ Asegúrate de que seleccionaste el proyecto "Jahatelo"

---

## 📝 Checklist

- [ ] Proyecto "Jahatelo" creado/seleccionado
- [ ] Google+ API habilitada
- [ ] OAuth Consent Screen completado
- [ ] Credencial Android creada con SHA-1 correcto
- [ ] Credencial iOS creada con Bundle ID
- [ ] Credencial Web creada con redirect URIs
- [ ] Los 3 Client IDs copiados y guardados

---

**Cuando termines, dame los 3 Client IDs y actualizaré el app.json.**
