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
  process.exit(0);
}

fs.writeFileSync(podspecPath, source.replace(original, patched));
