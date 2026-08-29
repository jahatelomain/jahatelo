const MOTEL_PLACEHOLDER = require('../assets/motel-placeholder.png');

export const getMotelImageSource = (uri) => (uri ? { uri } : MOTEL_PLACEHOLDER);

export const hasRemoteMotelImage = (uri) => typeof uri === 'string' && uri.trim().length > 0;
