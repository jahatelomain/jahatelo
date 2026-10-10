import * as Crypto from 'expo-crypto';
import { getApiBase } from './apiBaseUrl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export const newHomeVisitId = () => Crypto.randomUUID();

// The same visit ID is reused by fetchWithTimeout on a retry, so the server
// does not consume a second shared turn on a network timeout.
export async function claimHomeRotation(scope, visitId) {
  const result = await fetchWithTimeout(`${getApiBase()}/home/rotation`, {
    method: 'POST',
    body: JSON.stringify({ scope, visitId }),
  });
  if (!Array.isArray(result?.slides)) throw new Error('Respuesta de rotación inválida');
  return result.slides;
}
