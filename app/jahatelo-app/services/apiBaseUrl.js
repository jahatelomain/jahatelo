import Constants from 'expo-constants';

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const getHostUri = () => {
  return (
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.extra?.expoClient?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.hostUri ||
    Constants.manifest?.debuggerHost ||
    null
  );
};

const deriveLocalApiUrl = () => {
  const hostUri = getHostUri();
  if (!hostUri) return null;
  const cleaned = hostUri.replace(/^https?:\/\//, '');
  const host = cleaned.split('/')[0]?.split(':')[0];
  if (!host || host === 'localhost') return null;
  return `http://${host}:3000`;
};

export const getApiRoot = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeBaseUrl(envUrl.trim());
  }

  if (__DEV__) {
    const derived = deriveLocalApiUrl();
    if (derived) return normalizeBaseUrl(derived);
  }

  return 'http://localhost:3000';
};

export const getApiBase = () => `${getApiRoot()}/api`;

export const getMobileApiBase = () => `${getApiRoot()}/api/mobile`;
