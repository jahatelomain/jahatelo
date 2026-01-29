# 🔐 Implementación de Autenticación OAuth - Jahatelo App

**Fecha**: Enero 2025
**Estado**: Pendiente de implementación

---

## 📋 Estado Actual

### ✅ Ya Implementado
- **Backend**: API `/api/mobile/auth/login` ya soporta OAuth
- **Frontend**: AuthContext, LoginScreen, authApi.js tienen la estructura

### ❌ Falta Implementar
- Configuración de credenciales OAuth
- Integración real con Google Sign-In
- Login con SMS/WhatsApp
- Conectar botones con funcionalidad

---

## 🎯 Métodos de Autenticación a Implementar

### 1. **Google Sign-In** 🟢 PRIORITARIO
- Método recomendado: `expo-auth-session`
- Alternativa: `@react-native-google-signin/google-signin`
- Requiere: Google Cloud Console credentials

- Método recomendado: `expo-auth-session`
- Alternativa: `react-native-fbsdk-next`

### 3. **SMS/WhatsApp** 🟡 OPCIONAL
- Opción A: Firebase Phone Authentication (recomendado)
- Opción B: Twilio SMS
- Opción C: WhatsApp Business API

---

## 🔧 Opción 1: Expo Auth Session (RECOMENDADO)

**Ventajas:**
- ✅ Ya incluido en Expo
- ✅ Funciona en iOS, Android y Web
- ✅ Maneja redirects automáticamente
- ✅ No requiere configuraciones nativas complejas

**Desventajas:**
- ⚠️ Requiere configurar deep linking
- ⚠️ Requiere Expo Application Services (EAS) para iOS

### Instalación

```bash
cd app/jahatelo-app

# Ya está instalado con Expo SDK 54
# expo-auth-session viene incluido
# Verificar:
npx expo install expo-auth-session expo-crypto expo-web-browser
```

---

## 📱 Implementación Google Sign-In

### Paso 1: Crear Credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona existente
3. Habilita **Google+ API**
4. Ve a **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configura 3 credenciales:

#### **Web Client** (para Expo Go y testing)
```
Application type: Web application
Authorized redirect URIs:
  - https://auth.expo.io/@your-username/jahatelo-app
```

#### **Android Client**
```
Application type: Android
Package name: com.mbaretech.jahatelo
SHA-1: (obtenido con: keytool -list -v -keystore android-release.keystore)
```

#### **iOS Client**
```
Application type: iOS
Bundle ID: com.mbaretech.jahatelo
```

### Paso 2: Configurar `app.json`

```json
{
  "expo": {
    "scheme": "jahatelo",
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### Paso 3: Crear Servicio de Google Auth

**Archivo:** `app/jahatelo-app/services/googleAuthService.js`

```javascript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const EXPO_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com';
const IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
};

export const getGoogleUserInfo = async (accessToken) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const user = await response.json();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
};
```

### Paso 4: Actualizar `LoginScreen.js`

```javascript
import { useGoogleAuth, getGoogleUserInfo } from '../services/googleAuthService';

export default function LoginScreen({ navigation }) {
  const { loginWithOAuth } = useAuth();
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogleAsync } = useGoogleAuth();

  // Manejar respuesta de Google
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (accessToken) => {
    try {
      setIsLoading(true);

      // Obtener info del usuario de Google
      const userInfo = await getGoogleUserInfo(accessToken);
      if (!userInfo) {
        Alert.alert('Error', 'No se pudo obtener información de Google');
        return;
      }

      // Login con backend de Jahatelo
      const result = await loginWithOAuth({
        provider: 'google',
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      });

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ...
    <TouchableOpacity
      style={styles.oauthButton}
      onPress={() => promptGoogleAsync()}
      disabled={!googleRequest}
    >
      <Ionicons name="logo-google" size={24} color="#DB4437" />
    </TouchableOpacity>
    // ...
  );
}
```

---



2. **Create App** → **Consumer**
3. **Settings** → **Basic**:
   - iOS Bundle ID: `com.mbaretech.jahatelo`
   - Android Package Name: `com.mbaretech.jahatelo`
   - Android Key Hashes: (obtenido con keytool)



```javascript
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


  });

  return { request, response, promptAsync };
};

  try {
    const response = await fetch(
    );
    const user = await response.json();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture?.data?.url,
    };
  } catch (error) {
    return null;
  }
};
```

### Paso 3: Configurar `app.json`

```json
{
  "expo": {
  }
}
```

---

## 📱 Implementación SMS/WhatsApp

### Opción A: Firebase Phone Auth (RECOMENDADO)

#### Ventajas:
- ✅ Gratuito hasta 10K verificaciones/mes
- ✅ Funciona globalmente
- ✅ Integración simple con Expo
- ✅ Envío automático de SMS

#### Paso 1: Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea proyecto nuevo
3. **Authentication** → **Sign-in method** → Habilitar **Phone**
4. Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)

#### Paso 2: Instalar Firebase

```bash
cd app/jahatelo-app
npx expo install firebase
```

#### Paso 3: Crear Servicio de Phone Auth

**Archivo:** `app/jahatelo-app/services/phoneAuthService.js`

```javascript
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... resto de config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const sendVerificationCode = async (phoneNumber) => {
  try {
    // Configurar reCAPTCHA (solo en web, en mobile es automático)
    const appVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
    }, auth);

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );

    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: error.message };
  }
};

export const verifyCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;

    return {
      success: true,
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
      },
    };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, error: error.message };
  }
};
```

#### Paso 4: Crear Pantalla de Phone Login

**Archivo:** `app/jahatelo-app/screens/PhoneLoginScreen.js`

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { sendVerificationCode, verifyCode } from '../services/phoneAuthService';
import { useAuth } from '../contexts/AuthContext';

export default function PhoneLoginScreen({ navigation }) {
  const { loginWithOAuth } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    try {
      setIsLoading(true);
      const result = await sendVerificationCode(phoneNumber);

      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        Alert.alert('Éxito', 'Código enviado a tu teléfono');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      const result = await verifyCode(confirmationResult, code);

      if (result.success) {
        // Login con backend de Jahatelo
        const loginResult = await loginWithOAuth({
          provider: 'phone',
          providerId: result.user.uid,
          email: `${result.user.phoneNumber}@phone.jahatelo.com`, // Email dummy
          name: null,
        });

        if (loginResult.success) {
          navigation.goBack();
        } else {
          Alert.alert('Error', loginResult.error);
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {!confirmationResult ? (
        <>
          <TextInput
            placeholder="+54 9 11 1234-5678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity onPress={handleSendCode} disabled={isLoading}>
            <Text>Enviar Código</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Código de 6 dígitos"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity onPress={handleVerifyCode} disabled={isLoading}>
            <Text>Verificar Código</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
```

---

### Opción B: Twilio SMS

#### Ventajas:
- ✅ Control total del flujo
- ✅ Personalización completa
- ✅ Sin dependencias de Firebase

#### Desventajas:
- 💰 Costo por SMS (~$0.01-0.05 USD por mensaje)
- ⚙️ Requiere backend para verificación

#### Implementación:

1. **Backend Endpoint** (Next.js API Route)

**Archivo:** `web/jahatelo-web/app/api/mobile/auth/send-sms/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    return NextResponse.json({ success: true, status: verification.status });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Error al enviar SMS' },
      { status: 500 }
    );
  }
}
```

**Archivo:** `web/jahatelo-web/app/api/mobile/auth/verify-sms/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json();

    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code });

    if (verificationCheck.status === 'approved') {
      // Crear o buscar usuario con phoneNumber
      // ...
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al verificar código' }, { status: 500 });
  }
}
```

---

## 🔒 Configuración de Seguridad

### Variables de Entorno

**Backend:** `.env.local`

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret


# Twilio (si usas SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Firebase (si usas Phone Auth)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
```

**App:** `app.json` o `eas.json`

```json
{
  "expo": {
    "extra": {
      "googleClientIdExpo": "YOUR_EXPO_CLIENT_ID",
      "googleClientIdIos": "YOUR_IOS_CLIENT_ID",
      "googleClientIdAndroid": "YOUR_ANDROID_CLIENT_ID",
    }
  }
}
```

---

## 📊 Resumen de Costos

| Servicio | Costo Mensual | Límite Gratis |
|----------|---------------|---------------|
| **Google OAuth** | $0 | Ilimitado |
| **Firebase Phone Auth** | $0 - $50 | 10K verificaciones/mes |
| **Twilio SMS** | ~$10 - $100 | Sin límite gratis |


---

## 🎯 Plan de Implementación Sugerido

### Fase 1: Google OAuth (1-2 días)
1. Crear credenciales en Google Cloud Console
2. Instalar y configurar `expo-auth-session`
3. Crear `googleAuthService.js`
4. Actualizar `LoginScreen.js`
5. Probar en iOS, Android y Expo Go

3. Configurar `app.json`
4. Actualizar `LoginScreen.js`
5. Probar en dispositivos

### Fase 3: SMS/WhatsApp (2-3 días)
1. Decidir: Firebase o Twilio
2. Configurar servicio elegido
3. Crear `PhoneLoginScreen.js`
4. Agregar botón en `LoginScreen.js`
5. Implementar endpoints backend (si Twilio)
6. Probar flujo completo

### Fase 4: Testing y Pulido (1 día)
1. Probar todos los flujos
2. Manejar errores específicos
3. Mejorar UX (loading, mensajes)
4. Documentar proceso

**Total: 5-7 días de desarrollo**

---

## 🚦 Próximos Pasos

1. **Definir prioridad**:
   - ¿Solo Google?
   - ¿Incluir SMS desde el inicio?

2. **Crear credenciales**:
   - Google Cloud Console
   - (Opcional) Firebase / Twilio

3. **Comenzar implementación**:
   - Empezar con Google (más usado)
   - Evaluar necesidad de SMS

---

## 📚 Referencias

- [Expo Auth Session Docs](https://docs.expo.dev/guides/authentication/)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios)
- [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)
- [Twilio Verify](https://www.twilio.com/docs/verify/api)

---

**Última actualización:** Enero 2025
