const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-constants',
  'ios',
  'EXConstants.podspec'
);

if (!fs.existsSync(podspecPath)) {
  process.exit(0);
}

const source = fs.readFileSync(podspecPath, 'utf8');
const original = ':script => "bash -l -c \\\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\"",';
const patched = ':script => "bash -l -c \\\"#{env_vars}\\\\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\\\\"\\\"",';

if (!source.includes(original) || source.includes(patched)) {
  // Continúa: el parche de Expo puede estar aplicado desde una instalación anterior.
} else {
  fs.writeFileSync(podspecPath, source.replace(original, patched));
}

// react-native-maps 1.20.1 con Google Maps + Fabric en iOS puede recibir un
// subview nulo o un índice obsoleto al reconciliar marcadores dinámicos. El
// arreglo oficial equivalente aún no fue publicado en una versión estable.
const googleMapPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-maps',
  'ios',
  'AirGoogleMaps',
  'AIRGoogleMap.m'
);
const unsafeGoogleMapInsert = '  // Our desired API is to pass up markers/overlays as children to the mapview component.\n  // This is where we intercept them and do the appropriate underlying mapview action.\n';
const safeGoogleMapInsert = '  // Fabric puede reenviar una inserción con un subview nulo o un índice de un árbol anterior.\n  // Ignoramos la entrada nula y normalizamos el índice antes de tocar NSMutableArray.\n  if (!subview) return;\n  atIndex = MAX(0, MIN(atIndex, (NSInteger)_reactSubviews.count));\n\n' + unsafeGoogleMapInsert;

if (fs.existsSync(googleMapPath)) {
  const googleMapSource = fs.readFileSync(googleMapPath, 'utf8');
  if (googleMapSource.includes(unsafeGoogleMapInsert) && !googleMapSource.includes(safeGoogleMapInsert)) {
    fs.writeFileSync(googleMapPath, googleMapSource.replace(unsafeGoogleMapInsert, safeGoogleMapInsert));
  }
}
