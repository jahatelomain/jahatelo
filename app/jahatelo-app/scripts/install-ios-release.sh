#!/usr/bin/env bash
set -euo pipefail

# Instalación temporal rápida en un iPhone físico, sin Metro.
# Uso: npm run ios:device -- <UDID>
# Solo usar --clean / cambiar DERIVED_DATA_DIR cuando cambien Pods, iOS,
# permisos, firma o configuración nativa.

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || "$#" -ne 1 ]]; then
  echo "Uso: npm run ios:device -- <UDID-del-iPhone>"
  exit 0
fi

DEVICE_ID="$1"
DERIVED_DATA_DIR="${DERIVED_DATA_DIR:-/tmp/jahatelo-ios-release}"
APP_PATH="$DERIVED_DATA_DIR/Build/Products/Release-iphoneos/Jahatelo.app"

xcodebuild \
  -workspace ios/Jahatelo.xcworkspace \
  -scheme Jahatelo \
  -configuration Release \
  -destination "id=$DEVICE_ID" \
  -derivedDataPath "$DERIVED_DATA_DIR" \
  -allowProvisioningUpdates \
  build

test -f "$APP_PATH/Info.plist"
test -f "$APP_PATH/main.jsbundle"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
