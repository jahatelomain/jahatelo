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
GOOGLE_MAPS_IOS_API_KEY="$(sed -n 's/^IOS_GOOGLE_MAPS_API_KEY=//p' .env.local | tail -n 1)"
BUILD_INFO_PATH="constants/appBuild.js"
INFO_PLIST_PATH="ios/Jahatelo/Info.plist"
BUILD_INFO_BACKUP="$DERIVED_DATA_DIR/.appBuild.before-ios-build.js"
INFO_PLIST_BACKUP="$DERIVED_DATA_DIR/.Info.before-ios-build.plist"

if [[ -z "$GOOGLE_MAPS_IOS_API_KEY" ]]; then
  echo "Falta IOS_GOOGLE_MAPS_API_KEY en .env.local para compilar el mapa de Google en iOS."
  exit 1
fi

node scripts/patch-expo-constants-podspec.js

# Cada instalación manual recibe un identificador visible y un CFBundleVersion
# nuevos. Restauramos los archivos fuente al finalizar: el identificador queda
# dentro de la app instalada, sin ensuciar el repositorio por una build local.
mkdir -p "$DERIVED_DATA_DIR"
cp "$BUILD_INFO_PATH" "$BUILD_INFO_BACKUP"
cp "$INFO_PLIST_PATH" "$INFO_PLIST_BACKUP"
restore_build_sources() {
  cp "$BUILD_INFO_BACKUP" "$BUILD_INFO_PATH"
  cp "$INFO_PLIST_BACKUP" "$INFO_PLIST_PATH"
}
trap restore_build_sources EXIT

IFS='|' read -r NATIVE_BUILD APP_BUILD_LABEL <<< "$(node scripts/prepare-ios-build-label.js "$DERIVED_DATA_DIR/.jahatelo-build-state.json")"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NATIVE_BUILD" "$INFO_PLIST_PATH"
echo "Build Jahatelo: $APP_BUILD_LABEL (nativo $NATIVE_BUILD)"

# CoreDevice (devicectl) y Xcode pueden exponer IDs distintos para el mismo
# iPhone. El usuario ingresa el ID de devicectl porque se utiliza luego para
# instalar; aquí resolvemos el ID que Xcode reconoce para la compilación.
DEVICE_NAME="$(xcrun devicectl list devices | awk -v id="$DEVICE_ID" '$0 ~ id { print $1; exit }')"
if [[ -z "$DEVICE_NAME" ]]; then
  echo "No se encontró el iPhone con identificador $DEVICE_ID. Conectalo y desbloquealo."
  exit 1
fi

XCODE_DEVICE_ID="$(xcrun xctrace list devices | awk -v name="$DEVICE_NAME" '
  index($0, name " (") == 1 && $0 !~ /Simulator/ {
    line = $0
    sub(/^.*\(/, "", line)
    sub(/\).*$/, "", line)
    print line
    exit
  }
')"
if [[ -z "$XCODE_DEVICE_ID" || "$XCODE_DEVICE_ID" == *"Connecting"* ]]; then
  echo "Xcode aún no reconoce el iPhone $DEVICE_NAME. Mantenelo conectado y desbloqueado, luego reintentá."
  exit 1
fi

echo "Compilando para $DEVICE_NAME (Xcode: $XCODE_DEVICE_ID)…"

export GOOGLE_MAPS_IOS_API_KEY

xcodebuild \
  -workspace ios/Jahatelo.xcworkspace \
  -scheme Jahatelo \
  -configuration Release \
  -destination "id=$XCODE_DEVICE_ID" \
  -derivedDataPath "$DERIVED_DATA_DIR" \
  -allowProvisioningUpdates \
  build

test -f "$APP_PATH/Info.plist"
test -f "$APP_PATH/main.jsbundle"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
xcrun devicectl device process launch --device "$DEVICE_ID" --terminate-existing app.jahatelo.mobile
