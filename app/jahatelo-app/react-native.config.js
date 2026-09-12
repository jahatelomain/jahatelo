module.exports = {
  dependencies: {
    // iOS usa el adaptador estático de utils/reanimatedCompat.ios.js. Evitar
    // enlazar estos módulos permite usar la arquitectura clásica y elimina la
    // ruta TurboModule que provoca SIGSEGV en dispositivos con iOS 26.
    'react-native-reanimated': {
      platforms: { ios: null },
    },
    'react-native-worklets': {
      platforms: { ios: null },
    },
  },
};
