import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApiRoot, getAppHeaders } from './apiBaseUrl';

const currentVersion = Constants.expoConfig?.version || '1.0.0';

export async function fetchAppUpdateConfig() {
  const response = await fetch(`${getApiRoot()}/api/mobile/app-config`, {
    headers: getAppHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo consultar la configuración de la app.');
  return response.json();
}

export function trackAppUpdateAction(action, config) {
  return fetch(`${getApiRoot()}/api/mobile/app-config`, {
    method: 'POST',
    headers: getAppHeaders(),
    body: JSON.stringify({
      action,
      platform: Platform.OS,
      currentVersion,
      targetVersion: config?.recommendedVersion || config?.minimumVersion,
    }),
  }).catch(() => null);
}
