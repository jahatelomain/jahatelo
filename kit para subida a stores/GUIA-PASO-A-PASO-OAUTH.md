# 🔐 Guía Paso a Paso: Configurar Google OAuth en Jahatelo

**Fecha:** 19 Enero 2025
**Tiempo estimado:** 20-30 minutos

---

## 📋 INFORMACIÓN QUE NECESITAS

### Para Android:
```
Package name: app.jahatelo.mobile
SHA-1: E7:99:7A:F7:A3:25:2B:9E:93:1B:EE:AA:54:93:59:D6:3F:84:97:DB
```
*Este es el SHA-1 oficial de Expo Go para desarrollo*

### Para iOS:
```
Bundle ID: app.jahatelo.mobile
```

### Para Web:
```
Redirect URI: https://auth.expo.io/@jmongelos/jahatelo
Domains: jahatelo.com
```

---

## 🚀 PASO 1: Acceder a Google Cloud Console

1. Abre tu navegador
2. Ve a: **https://console.cloud.google.com/**
3. Inicia sesión con tu cuenta de Google
4. Espera a que cargue la consola

---

## 📁 PASO 2: Crear el Proyecto (si no existe)

1. Mira arriba a la izquierda, al lado del logo de Google Cloud
2. Verás un selector de proyecto (dice "Select a project" o el nombre del proyecto actual)
3. Click en ese selector
4. Click en **"NEW PROJECT"** (arriba a la derecha)
5. Llena:
   - **Project name:** `Jahatelo`
   - Deja lo demás como está
6. Click **"CREATE"**
7. Espera 10-20 segundos
8. Click en el selector de proyecto nuevamente
9. Selecciona **"Jahatelo"** de la lista

✅ **Verificación:** Arriba deberías ver "Jahatelo" como proyecto activo

---

## 🔧 PASO 3: Habilitar APIs Necesarias

### 3.1 Abrir el menú de APIs

1. Click en el **menú hamburguesa** (☰) arriba a la izquierda
2. Busca y click en: **"APIs & Services"**
3. Click en **"Library"**

### 3.2 Habilitar Google+ API

1. En el buscador de la página, escribe: `Google+ API`
2. Click en **"Google+ API"** (o "People API")
3. Click en el botón azul **"ENABLE"**
4. Espera 10-20 segundos hasta que diga "API enabled"

✅ **Verificación:** Deberías ver "Manage" en lugar de "Enable"

---

## 🎯 PASO 4: Configurar OAuth Consent Screen

**IMPORTANTE:** Hazlo antes de crear credenciales.

### 4.1 Ir a Consent Screen

1. En el menú lateral izquierdo, click en **"OAuth consent screen"**
2. Selecciona **"External"**
3. Click **"CREATE"**

### 4.2 Completar la información (Página 1)

**App information:**
- **App name:** `Jahatelo`
- **User support email:** Selecciona tu email del dropdown
- **App logo:** (OMITIR por ahora, puedes subirlo después)

**App domain:**
- **Application home page:** `https://jahatelo.com`
- **Application privacy policy link:** `https://jahatelo.com/privacy`
- **Application terms of service link:** `https://jahatelo.com/terms`

**Authorized domains:**
1. Click en **"ADD DOMAIN"**
2. Escribe: `jahatelo.com`
3. Presiona Enter

**Developer contact information:**
- **Email addresses:** Escribe tu email

4. Scroll down y click **"SAVE AND CONTINUE"**

### 4.3 Configurar Scopes (Página 2)

1. Click en **"ADD OR REMOVE SCOPES"**
2. En el panel que se abre, busca y **marca** estos 3:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. Scroll down en el panel y click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

### 4.4 Test users (Página 3)

1. Si quieres agregar emails de prueba (OPCIONAL):
   - Click **"ADD USERS"**
   - Agrega tu email u otros emails
   - Click **"ADD"**
2. Click **"SAVE AND CONTINUE"**

### 4.5 Resumen (Página 4)

1. Revisa todo
2. Click **"BACK TO DASHBOARD"**

✅ **Verificación:** Deberías ver el dashboard con "Publishing status: Testing"

---

## 🔐 PASO 5: Crear Credencial para ANDROID

### 5.1 Ir a Credentials

1. En el menú lateral izquierdo, click en **"Credentials"**
2. Click en **"+ CREATE CREDENTIALS"** (arriba)
3. Selecciona **"OAuth client ID"**

### 5.2 Configurar Android

1. **Application type:** Selecciona **"Android"**
2. **Name:** `Jahatelo Android`
3. **Package name:** `app.jahatelo.mobile`
4. **SHA-1 certificate fingerprint:**
   ```
   E7:99:7A:F7:A3:25:2B:9E:93:1B:EE:AA:54:93:59:D6:3F:84:97:DB
   ```
   *(Copia y pega exactamente esto)*

5. Click **"CREATE"**

### 5.3 Copiar el Client ID

Aparecerá un popup con tu Client ID. Se ve así:
```
123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

**IMPORTANTE:**
1. Click en el **ícono de copiar** 📋
2. Pega el Client ID en un archivo de texto temporal
3. Ponle etiqueta: `ANDROID_CLIENT_ID`
4. Click **"OK"** para cerrar el popup

✅ **Guardado:** Client ID de Android copiado

---

## 🍎 PASO 6: Crear Credencial para iOS

### 6.1 Crear nueva credencial

1. Nuevamente en la página de Credentials
2. Click en **"+ CREATE CREDENTIALS"**
3. Selecciona **"OAuth client ID"**

### 6.2 Configurar iOS

1. **Application type:** Selecciona **"iOS"**
2. **Name:** `Jahatelo iOS`
3. **Bundle ID:** `app.jahatelo.mobile`
4. Click **"CREATE"**

### 6.3 Copiar el Client ID

1. Click en el **ícono de copiar** 📋
2. Pega en tu archivo de texto temporal
3. Ponle etiqueta: `IOS_CLIENT_ID`
4. Click **"OK"**

✅ **Guardado:** Client ID de iOS copiado

---

## 🌐 PASO 7: Crear Credencial para WEB

### 7.1 Crear nueva credencial

1. Nuevamente en la página de Credentials
2. Click en **"+ CREATE CREDENTIALS"**
3. Selecciona **"OAuth client ID"**

### 7.2 Configurar Web

1. **Application type:** Selecciona **"Web application"**
2. **Name:** `Jahatelo Web`

### 7.3 Authorized JavaScript origins

1. En la sección **"Authorized JavaScript origins"**, click **"+ ADD URI"**
2. Agrega uno por uno:
   - `https://jahatelo.com`
   - `https://www.jahatelo.com`
   - `https://auth.expo.io`

### 7.4 Authorized redirect URIs

1. En la sección **"Authorized redirect URIs"**, click **"+ ADD URI"**
2. Agrega uno por uno:
   - `https://auth.expo.io/@jmongelos/jahatelo`
   - `https://jahatelo.com/auth/callback`
   - `https://www.jahatelo.com/auth/callback`

3. Click **"CREATE"**

### 7.5 Copiar el Client ID

1. Click en el **ícono de copiar** 📋
2. Pega en tu archivo de texto temporal
3. Ponle etiqueta: `WEB_CLIENT_ID`
4. Click **"OK"**

✅ **Guardado:** Client ID de Web copiado

---

## 📝 PASO 8: Verificar tus Client IDs

Ahora deberías tener en tu archivo de texto 3 Client IDs:

```
ANDROID_CLIENT_ID: xxxxxxxxxx-yyyyyyyyyyyy.apps.googleusercontent.com
IOS_CLIENT_ID: aaaaaaaaaa-bbbbbbbbbbbb.apps.googleusercontent.com
WEB_CLIENT_ID: zzzzzzzzzz-cccccccccccc.apps.googleusercontent.com
```

✅ **Verificación:** Tienes los 3 Client IDs guardados

---

## 🎉 LISTO EN GOOGLE CLOUD CONSOLE

Has completado toda la configuración en Google Cloud Console.

**Ahora avísame que terminaste y dame los 3 Client IDs para actualizar el código.**

---

## 📲 Próximos Pasos (YO LOS HARÉ)

Una vez me des los Client IDs, yo haré:
1. Actualizar el `app.json` con tus credenciales
2. Reiniciar Expo
3. Probar que el login funcione

---

## ❓ Si tienes algún problema

**Error: "OAuth Consent Screen required"**
→ Asegúrate de completar el Paso 4 primero

**Error: No puedo crear credenciales**
→ Verifica que seleccionaste el proyecto "Jahatelo" arriba

**No encuentro el menú**
→ Click en el menú hamburguesa (☰) arriba a la izquierda

---

**¡Cuando termines, avísame y dame los 3 Client IDs!**
