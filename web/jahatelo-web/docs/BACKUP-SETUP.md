# Configuración de Backups Automáticos

## 📋 Descripción

Este documento explica cómo configurar backups automáticos de la base de datos PostgreSQL de Jahatelo usando cron.

---

## 🔧 Prerequisitos

1. **PostgreSQL Client Tools** instalado:
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # Verificar instalación
   pg_dump --version
   ```

2. **Variable de entorno DATABASE_URL** configurada correctamente

---

## 📁 Script de Backup

El script está ubicado en: `scripts/backup-db.sh`

**Características:**
- ✅ Usa `pg_dump` para backup completo de PostgreSQL
- ✅ Comprime backups con gzip (ahorra ~80% de espacio)
- ✅ Rotación automática (mantiene últimos 7 backups)
- ✅ Nombres con timestamp: `jahatelo_backup_YYYYMMDD_HHMMSS.sql.gz`
- ✅ Validación de DATABASE_URL
- ✅ Colores en output para mejor legibilidad
- ✅ Reporte de tamaño y backups disponibles

---

## 🚀 Uso Manual

### 1. Dar permisos de ejecución (primera vez)
```bash
chmod +x scripts/backup-db.sh
```

### 2. Ejecutar backup manual
```bash
# Desde la raíz del proyecto
./scripts/backup-db.sh
```

### 3. Ver backups creados
```bash
ls -lh backups/
```

---

## ⏰ Automatización con Cron

### Setup en Producción (Linux/Ubuntu)

#### 1. Abrir crontab del usuario
```bash
crontab -e
```

#### 2. Agregar tarea de backup diario
```bash
# Backup diario a las 3:00 AM
0 3 * * * cd /ruta/al/proyecto && DATABASE_URL="postgresql://..." ./scripts/backup-db.sh >> /var/log/jahatelo-backup.log 2>&1
```

**Explicación:**
- `0 3 * * *` = Ejecutar todos los días a las 3:00 AM
- `cd /ruta/al/proyecto` = Cambiar al directorio del proyecto
- `DATABASE_URL="..."` = Variable de entorno con conexión a DB
- `>> /var/log/jahatelo-backup.log 2>&1` = Guardar logs

#### 3. Verificar que cron está activo
```bash
sudo systemctl status cron
```

#### 4. Ver logs de backups
```bash
tail -f /var/log/jahatelo-backup.log
```

---

### Setup en Desarrollo (macOS)

#### 1. Crear archivo de cron
```bash
crontab -e
```

#### 2. Agregar tarea (ejemplo: cada hora)
```bash
# Backup cada hora durante desarrollo
0 * * * * cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/web/jahatelo-web && export DATABASE_URL="postgresql://..." && ./scripts/backup-db.sh >> ~/jahatelo-backup.log 2>&1
```

#### 3. Listar tareas de cron
```bash
crontab -l
```

---

## 📅 Ejemplos de Programación de Cron

| Frecuencia | Expresión Cron | Uso Recomendado |
|------------|----------------|-----------------|
| **Cada hora** | `0 * * * *` | Desarrollo/Testing |
| **Cada 6 horas** | `0 */6 * * *` | Staging |
| **Diario a las 3 AM** | `0 3 * * *` | Producción (recomendado) |
| **Cada 12 horas** | `0 */12 * * *` | Producción (alta frecuencia) |
| **Semanal (Domingos 2 AM)** | `0 2 * * 0` | Backup adicional semanal |

---

## 🔐 Variables de Entorno

### Formato de DATABASE_URL

```bash
# PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/database"

# Ejemplo local
DATABASE_URL="postgresql://postgres:password@localhost:5432/jahatelo"

# Ejemplo Supabase
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

### Configurar en cron con .env

Si tienes archivo `.env`, puedes cargarlo en cron:

```bash
0 3 * * * cd /ruta/proyecto && source .env && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 📊 Gestión de Backups

### Ver backups disponibles
```bash
ls -lh backups/
```

### Restaurar desde backup
```bash
# Descomprimir
gunzip backups/jahatelo_backup_20250117_030000.sql.gz

# Restaurar (CUIDADO: esto reemplaza la DB actual)
psql $DATABASE_URL < backups/jahatelo_backup_20250117_030000.sql
```

### Limpiar backups antiguos manualmente
```bash
# Mantener solo últimos 7 días
ls -t backups/jahatelo_backup_*.sql.gz | tail -n +8 | xargs rm -f
```

### Subir backups a storage remoto (opcional)

#### AWS S3
```bash
# Instalar AWS CLI
brew install awscli  # macOS
sudo apt install awscli  # Ubuntu

# Configurar credenciales
aws configure

# Subir backup
aws s3 cp backups/jahatelo_backup_*.sql.gz s3://mi-bucket-backups/jahatelo/
```

#### Google Cloud Storage
```bash
# Instalar gcloud CLI
brew install google-cloud-sdk  # macOS

# Subir backup
gsutil cp backups/jahatelo_backup_*.sql.gz gs://mi-bucket-backups/jahatelo/
```

---

## ⚠️ Recomendaciones de Seguridad

1. **No commitear backups al repositorio**
   - El directorio `backups/` debe estar en `.gitignore`
   - ✅ Ya configurado en el proyecto

2. **Encriptar backups sensibles**
   ```bash
   # Encriptar backup
   gpg -c backups/jahatelo_backup_20250117.sql.gz

   # Desencriptar
   gpg backups/jahatelo_backup_20250117.sql.gz.gpg
   ```

3. **Permisos restrictivos**
   ```bash
   chmod 700 scripts/backup-db.sh
   chmod 700 backups/
   ```

4. **Storage remoto**
   - Sube backups a S3, Google Cloud Storage o similar
   - Configura ciclo de vida para rotar backups antiguos

5. **Monitorear backups**
   - Configura alertas si el backup falla
   - Verifica regularmente que los backups sean restaurables

---

## 🧪 Testing

### 1. Probar backup manual
```bash
./scripts/backup-db.sh
```

### 2. Verificar que se creó el archivo
```bash
ls -lh backups/
```

### 3. Probar restauración (en DB de testing)
```bash
# Descomprimir
gunzip -c backups/jahatelo_backup_*.sql.gz > test-restore.sql

# Restaurar en DB de testing
psql "postgresql://test-db-url" < test-restore.sql

# Limpiar
rm test-restore.sql
```

---

## 📝 Troubleshooting

### Error: "pg_dump: command not found"
**Solución:** Instala PostgreSQL client tools
```bash
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Ubuntu
```

### Error: "DATABASE_URL no está configurada"
**Solución:** Exporta la variable antes de ejecutar
```bash
export DATABASE_URL="postgresql://..."
./scripts/backup-db.sh
```

### Error: "Permission denied"
**Solución:** Da permisos de ejecución
```bash
chmod +x scripts/backup-db.sh
```

### Cron no ejecuta el backup
**Solución:** Verifica que cron esté activo y revisa logs
```bash
sudo systemctl status cron  # Ubuntu
tail -f /var/log/syslog | grep CRON  # Ver logs de cron
```

---

## 📚 Referencias

- [Cron Expression Generator](https://crontab.guru/)
- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Crontab Manual](https://man7.org/linux/man-pages/man5/crontab.5.html)

---

## ✅ Checklist de Setup

- [ ] PostgreSQL client tools instalado
- [ ] Script de backup tiene permisos de ejecución
- [ ] DATABASE_URL configurada correctamente
- [ ] Backup manual ejecutado exitosamente
- [ ] Tarea de cron agregada
- [ ] Logs de backup configurados
- [ ] Backups siendo creados automáticamente
- [ ] Rotación de backups funcionando (verificar después de 8 días)
- [ ] (Opcional) Storage remoto configurado
- [ ] (Opcional) Encriptación de backups configurada

---

**Última actualización:** Enero 2025
