/**
 * Helpers para manejar respuestas fetch de forma segura
 * Previene errores de parsing cuando el servidor devuelve HTML en lugar de JSON
 */

/**
 * Verifica si una respuesta es JSON válido y parsea de forma segura
 * @param {Response} response - Fetch Response object
 * @returns {Promise<{ok: boolean, data: any, error: string}>}
 */
export async function safeFetchJson(response) {
  try {
    // Verificar Content-Type
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      console.error('Error: respuesta no es JSON', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: response.url,
      });

      return {
        ok: false,
        data: null,
        error: 'El servidor devolvió una respuesta inválida',
        status: response.status,
      };
    }

    // Parsear JSON
    const data = await response.json();

    return {
      ok: response.ok,
      data,
      error: response.ok ? null : (data.error || 'Error desconocido'),
      status: response.status,
    };

  } catch (error) {
    console.error('Error al parsear respuesta:', error);
    return {
      ok: false,
      data: null,
      error: 'Error al procesar la respuesta del servidor',
      status: response.status,
    };
  }
}

/**
 * Wrapper para fetch con manejo automático de JSON
 * @param {string} url - URL del endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<{ok: boolean, data: any, error: string}>}
 */
export async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await safeFetchJson(response);
  } catch (error) {
    console.error('Error en fetchJson:', error);
    return {
      ok: false,
      data: null,
      error: error.message || 'Error de conexión',
      status: 0,
    };
  }
}

/**
 * Helper para construir headers con autenticación
 * @param {string} token - JWT token
 * @param {object} additionalHeaders - Headers adicionales
 * @returns {object} Headers object
 */
export function buildAuthHeaders(token, additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
