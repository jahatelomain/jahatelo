import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiRoot } from './apiBaseUrl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = getApiRoot();

const TOKEN_KEY = '@jahatelo_auth_token';
const USER_KEY = '@jahatelo_user';

/**
 * Guarda el token y usuario en AsyncStorage
 */
export async function saveAuthData(token, user) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
}

/**
 * Obtiene el token guardado
 */
export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

/**
 * Obtiene el usuario guardado
 */
export async function getStoredUser() {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
}

/**
 * Elimina datos de autenticación
 */
export async function clearAuthData() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

/**
 * Registro de nuevo usuario
 */
export async function register({ email, password, name, phone }) {
  try {
    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        phone,
        provider: 'email',
      }),
    });

    if (data.success && data.token && data.user) {
      await saveAuthData(data.token, data.user);
    }

    return data;
  } catch (error) {
    console.error('Error in register:', error);
    throw error;
  }
}

/**
 * Login con email/password
 */
export async function login({ email, password, pushToken, deviceInfo }) {
  try {
    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        pushToken,
        deviceInfo,
      }),
    });

    if (data.success && data.token && data.user) {
      await saveAuthData(data.token, data.user);
    }

    return data;
  } catch (error) {
    console.error('Error in login:', error);
    throw error;
  }
}

/**
 * Login con OAuth (Google, Apple)
 */
export async function loginWithOAuth({ provider, providerId, email, name, pushToken, deviceInfo }) {
  try {
    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        provider,
        providerId,
        email,
        name,
        pushToken,
        deviceInfo,
      }),
    });

    if (data.success && data.token && data.user) {
      await saveAuthData(data.token, data.user);
    }

    return data;
  } catch (error) {
    console.error('Error in loginWithOAuth:', error);
    throw error;
  }
}

/**
 * Solicitar OTP por SMS
 */
export async function requestSmsOtp({ phone }) {
  try {
    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/whatsapp/request-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    return data;
  } catch (error) {
    console.error('Error in requestSmsOtp:', error);
    throw error;
  }
}

/**
 * Verificar OTP por SMS
 */
export async function verifySmsOtp({ phone, code, name }) {
  try {
    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/whatsapp/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });

    if (data.success && data.token && data.user) {
      await saveAuthData(data.token, data.user);
    }

    return data;
  } catch (error) {
    console.error('Error in verifySmsOtp:', error);
    throw error;
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getProfile() {
  try {
    const token = await getStoredToken();
    if (!token) {
      throw new Error('No token found');
    }

    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (data.success && data.user) {
      // Actualizar usuario guardado
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    // Si el token es inválido, limpiar datos
    if (error.message?.includes('401')) {
      await clearAuthData();
    }
    console.error('Error in getProfile:', error);
    throw error;
  }
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateProfile({ name, phone, profilePhoto, pushToken, deviceInfo }) {
  try {
    const token = await getStoredToken();
    if (!token) {
      throw new Error('No token found');
    }

    const data = await fetchWithTimeout(`${API_URL}/api/mobile/auth/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        phone,
        profilePhoto,
        pushToken,
        deviceInfo,
      }),
    });

    if (data.success && data.user) {
      // Actualizar usuario guardado
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
}

/**
 * Logout (limpia datos locales)
 */
export async function logout() {
  try {
    await clearAuthData();
  } catch (error) {
    console.error('Error in logout:', error);
    throw error;
  }
}
