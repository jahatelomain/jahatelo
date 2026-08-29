import { getApiRoot, getAppHeaders } from './apiBaseUrl';
import { getStoredToken } from './authApi';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export const recommendMotel = ({ motelName, city }) => fetchWithTimeout(
  `${getApiRoot()}/api/mobile/motel-recommendations`,
  {
    method: 'POST',
    headers: getAppHeaders(),
    body: JSON.stringify({ motelName, city }),
  },
);

export async function reportMotel({ motelId, reason, comment }) {
  const token = await getStoredToken();
  return fetchWithTimeout(
    `${getApiRoot()}/api/mobile/motel-reports`,
    {
      method: 'POST',
      headers: getAppHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify({ motelId, reason, comment: comment || undefined }),
    },
  );
}
