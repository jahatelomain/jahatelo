#!/bin/bash
# Script para generar ícono de notificación monocromático
# Requisito: ImageMagick instalado (brew install imagemagick)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"
INPUT_ICON="$ASSETS_DIR/logo-icon.png"
OUTPUT_ICON="$ASSETS_DIR/notification-icon.png"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔨 Generando ícono de notificación monocromático...${NC}"

# Verificar que ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick no está instalado.${NC}"
    echo ""
    echo "Instala ImageMagick:"
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt-get install imagemagick"
    echo "  Windows: https://imagemagick.org/script/download.php"
    echo ""
    echo "O usa la Opción 3 (herramienta online):"
    echo "  https://romannurik.github.io/AndroidAssetStudio/icons-notification.html"
    exit 1
fi

# Verificar que el ícono de entrada existe
if [ ! -f "$INPUT_ICON" ]; then
    echo -e "${RED}❌ No se encontró: $INPUT_ICON${NC}"
    exit 1
fi

echo "📂 Input:  $INPUT_ICON"
echo "📂 Output: $OUTPUT_ICON"

# Crear ícono monocromático blanco sobre transparente
# Pasos:
# 1. Redimensionar a 192x192
# 2. Extraer canal alpha (transparencia)
# 3. Negar (invertir) para tener la silueta
# 4. Convertir a escala de grises
# 5. Copiar como canal alpha
# 6. Llenar con blanco
convert "$INPUT_ICON" \
    -resize 192x192 \
    -alpha extract \
    -negate \
    -colorspace Gray \
    -alpha copy \
    -fill white -colorize 100 \
    "$OUTPUT_ICON"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Ícono de notificación creado exitosamente!${NC}"
    echo ""
    echo "Verificación:"
    ls -lh "$OUTPUT_ICON"
    file "$OUTPUT_ICON"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Después de crear el ícono, debes hacer un nuevo build:${NC}"
    echo "  eas build --profile development --platform android --clear-cache"
else
    echo -e "${RED}❌ Error al generar el ícono${NC}"
    exit 1
fi
