import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Necesario para que funcione el redirect después del login
WebBrowser.maybeCompleteAuthSession();

// Por ahora usamos placeholders. Más adelante los reemplazaremos con credenciales reales
// desde Google Cloud Console
const EXPO_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdExpo || 'PLACEHOLDER_EXPO';
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdIos || 'PLACEHOLDER_IOS';
const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdAndroid || 'PLACEHOLDER_ANDROID';
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdWeb || 'PLACEHOLDER_WEB';

/**
 * Hook personalizado para manejar Google Sign-In
 * Usa expo-auth-session para manejar el flujo OAuth
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
};

/**
 * Obtiene información del usuario desde Google
 * @param {string} accessToken - Token de acceso de Google
 * @returns {Promise<Object|null>} Información del usuario o null si hay error
 */
export const getGoogleUserInfo = async (accessToken) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener información del usuario de Google');
    }

    const user = await response.json();

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
  return !EXPO_CLIENT_ID.includes('PLACEHOLDER') ||
         !IOS_CLIENT_ID.includes('PLACEHOLDER') ||
         !ANDROID_CLIENT_ID.includes('PLACEHOLDER');
};
