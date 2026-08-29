/* global beforeEach, describe, expect, it, jest */

jest.mock('../apiBaseUrl', () => ({
  getApiRoot: () => 'https://jahatelo.test',
  getAppHeaders: (headers = {}) => ({ 'Content-Type': 'application/json', ...headers }),
}));
jest.mock('../authApi', () => ({ getStoredToken: jest.fn() }));
jest.mock('../../utils/fetchWithTimeout', () => ({ fetchWithTimeout: jest.fn() }));

import { getStoredToken } from '../authApi';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { recommendMotel, reportMotel } from '../catalogFeedbackApi';

describe('catalogFeedbackApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('envía únicamente nombre y ciudad en una recomendación', async () => {
    fetchWithTimeout.mockResolvedValue({ success: true });
    await recommendMotel({ motelName: 'Motel Nuevo', city: 'Asunción' });
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      'https://jahatelo.test/api/mobile/motel-recommendations',
      expect.objectContaining({ body: JSON.stringify({ motelName: 'Motel Nuevo', city: 'Asunción' }) }),
    );
  });

  it('asocia el token opcional al reporte', async () => {
    getStoredToken.mockResolvedValue('token-prueba');
    fetchWithTimeout.mockResolvedValue({ success: true });
    await reportMotel({ motelId: 'motel-1', reason: 'PRICE', comment: 'Precio anterior' });
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      'https://jahatelo.test/api/mobile/motel-reports',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-prueba' }) }),
    );
  });
});
