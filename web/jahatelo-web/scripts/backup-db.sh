#!/bin/bash
# Script de backup de base de datos PostgreSQL para Jahatelo
# Uso: ./scripts/backup-db.sh

set -e

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="jahatelo_backup_${TIMESTAMP}.sql"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que exista DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL no está configurada${NC}"
  echo "Configura la variable de entorno DATABASE_URL antes de ejecutar este script"
  exit 1
fi

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Iniciando backup de base de datos...${NC}"
echo "Fecha: $(date)"
echo "Archivo: $BACKUP_FILE"

# Extraer información de la URL de la base de datos
DB_URL=$DATABASE_URL

# Realizar backup usando pg_dump
if command -v pg_dump &> /dev/null; then
  pg_dump "$DB_URL" > "${BACKUP_DIR}/${BACKUP_FILE}"

  # Comprimir el backup
  gzip "${BACKUP_DIR}/${BACKUP_FILE}"

  echo -e "${GREEN}✓ Backup completado exitosamente${NC}"
  echo "Ubicación: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
  echo "Tamaño: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)"

  # Limpiar backups antiguos (mantener solo los últimos 7)
  echo -e "${YELLOW}Limpiando backups antiguos...${NC}"
  ls -t "${BACKUP_DIR}"/jahatelo_backup_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null || true
  echo -e "${GREEN}✓ Limpieza completada${NC}"

  # Mostrar backups disponibles
  echo -e "\n${YELLOW}Backups disponibles:${NC}"
  ls -lh "${BACKUP_DIR}"/jahatelo_backup_*.sql.gz | tail -n 7

else
  echo -e "${RED}Error: pg_dump no está instalado${NC}"
  echo "Instala PostgreSQL client tools:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: apt-get install postgresql-client"
  exit 1
fi
