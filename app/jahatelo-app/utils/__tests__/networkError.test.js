/* global describe, expect, it */
import { getUserFacingNetworkError } from '../networkError';

describe('getUserFacingNetworkError', () => {
  it('normaliza errores de conexión', () => {
    expect(getUserFacingNetworkError(new Error('Network request failed'))).toContain('conexión');
  });

  it('conserva errores de negocio', () => {
    expect(getUserFacingNetworkError(new Error('Motel no encontrado.'))).toBe('Motel no encontrado.');
  });
});
