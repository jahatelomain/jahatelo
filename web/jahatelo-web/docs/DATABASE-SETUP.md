# Configuración de Base de Datos en Producción

## Opciones recomendadas para PostgreSQL en producción

### Opción 1: Vercel Postgres (Recomendado)
**Ventajas:** Integración automática, backups incluidos, escalable
**Precio:** Desde $20/mes

```bash
# 1. Ir a tu proyecto en Vercel Dashboard
# 2. Storage → Create Database → Postgres
# 3. Copiar las variables de entorno:
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

**Configurar en Vercel:**
- Ir a Settings → Environment Variables
- Agregar: `DATABASE_URL` = `POSTGRES_PRISMA_URL`
- Agregar: `DIRECT_URL` = `POSTGRES_URL_NON_POOLING`

### Opción 2: Neon.tech (Serverless PostgreSQL)
**Ventajas:** Free tier generoso, serverless, auto-scaling
**Precio:** Free hasta 3GB, luego desde $19/mes

1. Crear cuenta en https://neon.tech
2. Crear nuevo proyecto
3. Copiar connection string
4. En Vercel: agregar `DATABASE_URL` y `DIRECT_URL`

### Opción 3: Supabase
**Ventajas:** Free tier, backups automáticos, dashboard incluido
**Precio:** Free hasta 500MB, luego desde $25/mes

1. Crear proyecto en https://supabase.com
2. Settings → Database → Connection string
3. Usar "Connection pooling" para `DATABASE_URL`
4. Usar "Direct connection" para `DIRECT_URL`

## Configuración de Backups Automáticos

### En Vercel (si usas Vercel Postgres)
Los backups son automáticos. Para backups manuales:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Descargar backup
vercel env pull .env.production
./scripts/backup-db.sh
```

### Script de backup manual (incluido)
```bash
# Configurar DATABASE_URL en tu terminal
export DATABASE_URL="postgresql://..."

# Ejecutar backup
./scripts/backup-db.sh

# Los backups se guardan en ./backups/
# Se mantienen automáticamente los últimos 7 backups
```

### Backup programado con cron (servidor)
```bash
# Agregar a crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * cd /ruta/al/proyecto && DATABASE_URL="..." ./scripts/backup-db.sh

# Backup cada 6 horas
0 */6 * * * cd /ruta/al/proyecto && DATABASE_URL="..." ./scripts/backup-db.sh
```

### GitHub Actions para backups automáticos
Crear `.github/workflows/backup.yml`:

```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # Diario a las 2 AM UTC
  workflow_dispatch: # Permitir ejecución manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PostgreSQL client
        run: sudo apt-get install postgresql-client
      - name: Run backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./scripts/backup-db.sh
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/*.sql.gz
          retention-days: 30
```

## Migración inicial a producción

```bash
# 1. Verificar que DATABASE_URL y DIRECT_URL estén configuradas
echo $DATABASE_URL
echo $DIRECT_URL

# 2. Generar Prisma Client
npx prisma generate

# 3. Ejecutar migraciones
npx prisma migrate deploy

# 4. Verificar que funcionó
npx prisma db seed # Si tienes seed data
```

## Checklist de producción

- [ ] Base de datos PostgreSQL creada
- [ ] Variables `DATABASE_URL` y `DIRECT_URL` configuradas en Vercel
- [ ] Migraciones ejecutadas: `prisma migrate deploy`
- [ ] Backups automáticos configurados
- [ ] Credenciales guardadas en 1Password/LastPass
- [ ] Plan de disaster recovery documentado
- [ ] Monitoreo de uso de BD configurado
- [ ] Límites de conexiones verificados

## Troubleshooting

### Error: "Too many connections"
```bash
# Verifica connection pooling en DATABASE_URL
# Debe incluir: ?pgbouncer=true&connection_limit=1
```

### Migraciones no se aplican
```bash
# Verificar estado
npx prisma migrate status

# Resolver migraciones pendientes
npx prisma migrate resolve --applied "migration_name"
npx prisma migrate deploy
```

### Backup falla
```bash
# Verificar que pg_dump está instalado
which pg_dump

# Instalar si es necesario
brew install postgresql # macOS
apt-get install postgresql-client # Ubuntu
```

## Contactos de emergencia

- DBA: [email]
- DevOps: [email]
- Soporte Vercel: https://vercel.com/support
