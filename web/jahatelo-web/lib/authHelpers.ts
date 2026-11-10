/**
 * Helpers centralizados para detección de errores de autenticación/autorización.
 *
 * Uso del lado del servidor: importar las constantes UNAUTHORIZED_MESSAGE / FORBIDDEN_MESSAGE
 * y usarlas en NextResponse.json({ error: ... }, { status: 401|403 }).
 *
 * Uso del lado del cliente (fetch helpers): llamar a isUnauthorized(error) con el objeto
 * capturado en un catch o con la Response devuelta por fetch.
 */

export const UNAUTHORIZED_MESSAGE = 'No autorizado';
export const FORBIDDEN_MESSAGE = 'Acceso denegado';

const UNAUTHORIZED_PATTERN = /unauthorized|no autorizado|token inv[aá]lido|sesi[oó]n expirada/i;

type ErrorLike = {
  status?: number;
  statusCode?: number;
  message?: string;
  error?: string | { message?: string };
};

/**
 * Detecta si un error representa una respuesta 401 o 403.
 * - Prioriza el código de estado numérico cuando está disponible.
 * - Como fallback, inspecciona el mensaje de error con un patrón que cubre
 *   las variantes históricas en español e inglés.
 */
export function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as ErrorLike;
  const status = err.status ?? err.statusCode;
  if (typeof status === 'number') {
    return status === 401 || status === 403;
  }

  const message =
    typeof err.message === 'string'
      ? err.message
      : typeof err.error === 'string'
        ? err.error
        : typeof err.error?.message === 'string'
          ? err.error.message
          : '';

  return UNAUTHORIZED_PATTERN.test(message);
}