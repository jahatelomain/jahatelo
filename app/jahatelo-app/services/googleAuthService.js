import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Necesario para cerrar el browser y capturar la respuesta del redirect
WebBrowser.maybeCompleteAuthSession();

const EXPO_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdExpo || null;
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdIos || null;
const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdAndroid || null;
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdWeb || null;

// Detecta si estamos corriendo en Expo Go (vs build compilado)
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Hook personalizado para manejar Google Sign-In
 * Usa expo-auth-session para manejar el flujo OAuth
 */
export const useGoogleAuth = () => {
  // En Expo Go: Desktop app client (sin proxy)
  // En build nativo: usar el Client ID específico de la plataforma
  const clientId = isExpoGo
    ? EXPO_CLIENT_ID
    : Platform.OS === 'ios'
      ? IOS_CLIENT_ID
      : ANDROID_CLIENT_ID;

  // makeRedirectUri genera automáticamente el formato correcto según el entorno:
  // - Expo Go (simulador): exp://127.0.0.1:8081 (Desktop app client, sin proxy)
  // - Build nativo: jahatelo://oauth/google (con scheme)
  const redirectUri = AuthSession.makeRedirectUri(
    isExpoGo
      ? {} // Desktop app client - sin proxy
      : { scheme: 'jahatelo', path: 'oauth/google' }
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  if (__DEV__) {
    console.log('Google Auth Config:', {
      clientId,
      platform: Platform.OS,
      isExpoGo,
      redirectUri,
    });
    if (request) {
      console.log('Google Auth Request URL:', request.url);
    }
  }

  return { request, response, promptAsync };
};

/**
 * Obtiene información del usuario desde Google
 * @param {string} accessToken - Token de acceso de Google
 * @returns {Promise<Object|null>} Información del usuario o null si hay error
 */
export const getGoogleUserInfo = async (accessToken) => {
  try {
    const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error('Error al obtener información del usuario de Google');
    }

    const user = await res.json();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      givenName: user.given_name,
      familyName: user.family_name,
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
};

/**
 * Verifica si las credenciales de Google están configuradas
 * @returns {boolean} true si hay credenciales reales configuradas
 */
export const isGoogleConfigured = () => {
  return Boolean(WEB_CLIENT_ID || IOS_CLIENT_ID || ANDROID_CLIENT_ID);
};
