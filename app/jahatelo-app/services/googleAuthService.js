import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdWeb || null;

// Configurar Google Sign-In una sola vez al cargar el módulo
if (WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
}

/**
 * Hook personalizado para manejar Google Sign-In
 * Usa @react-native-google-signin (SDK nativo) en lugar de expo-auth-session
 * Esto evita problemas con redirect URIs personalizadas en Google Console
 */
export const useGoogleAuth = () => {
  const promptAsync = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        return { type: 'error', error: { message: 'No se obtuvo idToken de Google' } };
      }

      return {
        type: 'success',
        authentication: { idToken },
        params: { id_token: idToken },
      };
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { type: 'dismiss' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { type: 'error', error: { message: 'Login ya en progreso' } };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { type: 'error', error: { message: 'Google Play Services no disponible' } };
      } else {
        console.error('Google Sign-In Error:', error);
        return { type: 'error', error: { message: error.message || 'Error desconocido' } };
      }
    }
  };

  // Compatibilidad con la interfaz anterior de expo-auth-session
  const request = WEB_CLIENT_ID ? { url: 'native-sdk' } : null;
  const response = null; // El SDK nativo maneja todo internamente

  if (__DEV__) {
    console.log('Google Auth Config (Native SDK):', {
      webClientId: WEB_CLIENT_ID,
      configured: Boolean(WEB_CLIENT_ID),
    });
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
  return Boolean(WEB_CLIENT_ID);
};
