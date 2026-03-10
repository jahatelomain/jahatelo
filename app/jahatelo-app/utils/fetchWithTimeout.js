/**
 * Utilidad compartida para hacer fetch con timeout y retry logic
 * Usado por authApi, motelsApi, advertisementsApi, etc.
 */

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

// Timeout balanceado: staging puede tener latencia pero no debería pasar de 15s
const REQUEST_TIMEOUT_MS = 15000; // 15 segundos
const MAX_RETRIES = 1; // 2 intentos totales (original + 1 retry)

/**
 * Hace fetch con manejo de timeout, retry y errores
 * @param {string} url - URL a consultar
 * @param {Object} options - Opciones de fetch
 * @param {number} retryCount - Contador interno de reintentos
 * @returns {Promise<any>} Datos JSON de la respuesta
 */
export async function fetchWithTimeout(url, options = {}, retryCount = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    debugLog(`🌐 [FETCH] ${url} (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);

    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    debugLog(`📥 [FETCH] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Si es 401 (Unauthorized), probablemente falta Basic Auth en staging
      if (response.status === 401) {
        throw new Error('Error de autenticación (401). Verifica credenciales de staging.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog(`✅ [FETCH] Datos recibidos exitosamente`);
    return data;
  } catch (error) {
    debugLog(`❌ [FETCH] Error:`, error);

    if (error?.name === 'AbortError') {
      // Timeout - reintentar si quedan intentos
      if (retryCount < MAX_RETRIES) {
        debugLog(`🔄 [FETCH] Timeout - reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
        clearTimeout(timeoutId);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Backoff exponencial
        return fetchWithTimeout(url, options, retryCount + 1);
      }
      throw new Error('Tiempo de espera agotado después de varios intentos. Verifica tu conexión.');
    }

    // Otros errores de red - reintentar si quedan intentos y no es 401
    if (retryCount < MAX_RETRIES && !error.message.includes('401')) {
      debugLog(`🔄 [FETCH] Error de red - reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
      clearTimeout(timeoutId);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchWithTimeout(url, options, retryCount + 1);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
