export function getUserFacingNetworkError(error, fallback = 'No pudimos completar la operación.') {
  if (!error) return fallback;
  if (error.name === 'AbortError') return 'La solicitud tardó demasiado. Intentá nuevamente.';
  const message = String(error.message || '');
  if (/network|conexi[oó]n|internet|fetch|tiempo de espera/i.test(message)) {
    return 'Revisá tu conexión a internet e intentá nuevamente.';
  }
  return message || fallback;
}
