# 🔍 Configuración de Monitoring - Jahatelo

Sistema de monitoring implementado con Sentry y Pino para tracking de errores y logging estructurado.

## ✅ ¿Qué está Implementado?

### 1. Logging Estructurado (Pino)
- ✅ Logger con niveles: error, warn, info, debug
- ✅ Formato pretty en desarrollo, JSON en producción
- ✅ Funciones helper para diferentes tipos de logs
- ✅ Archivo: `lib/logger.ts`

### 2. Health Check Endpoint
- ✅ Endpoint: `GET /api/health`
- ✅ Verifica conexión a base de datos
- ✅ Reporta uptime del proceso
- ✅ Status codes: 200 (healthy) o 503 (unhealthy)

### 3. Sentry Error Tracking
- ✅ Configuración para cliente (browser)
- ✅ Configuración para servidor (Node.js)
- ✅ Configuración para edge runtime (middleware)
- ✅ Filtrado de información sensible
- ✅ No envía errores en desarrollo

---

## 🚀 Configuración Inicial

### Paso 1: Crear Cuenta en Sentry

1. Ir a https://sentry.io
2. Crear cuenta gratuita (50k eventos/mes gratis)
3. Crear nuevo proyecto:
   - Platform: **Next.js**
   - Name: **Jahatelo Web**
4. Copiar el DSN (Data Source Name)

### Paso 2: Configurar Variables de Entorno

Agregar a `.env` y `.env.production`:

```bash
# Sentry (mismo DSN para ambos)
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# Log level
LOG_LEVEL="info"  # development: debug, production: info
```

### Paso 3: Verificar Health Check

```bash
# En desarrollo
curl http://localhost:3000/api/health

# Respuesta esperada:
{
  "status": "healthy",
  "timestamp": "2026-01-13T...",
  "uptime": 123.456,
  "environment": "development",
  "database": {
    "status": "connected",
    "responseTime": 12
  },
  "version": "1.0.0"
}
```

---

## 📊 Uso del Sistema de Logging

### Importar el Logger

```typescript
import logger, { logError, logRequest, logAuth } from '@/lib/logger';
```

### Ejemplos de Uso

**Log Simple:**
```typescript
logger.info('Usuario creado exitosamente');
logger.warn('Límite de rate limiting cercano');
logger.error('Error al conectar a base de datos');
```

**Log con Contexto:**
```typescript
logger.info({
  message: 'Usuario creó motel',
  userId: '123',
  motelId: '456',
  plan: 'PREMIUM',
});
```

**Log de Error:**
```typescript
try {
  // ... código
} catch (error) {
  logError(error as Error, {
    endpoint: '/api/motels',
    userId: user.id,
  });
}
```

**Log de Request:**
```typescript
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ... lógica
    const duration = Date.now() - startTime;
    logRequest('GET', '/api/motels', duration, 200, user?.id);
    return response;
  } catch (error) {
    logError(error as Error);
    return errorResponse;
  }
}
```

**Log de Autenticación:**
```typescript
// Login exitoso
logAuth('login', user.id, true, { role: user.role });

// Login fallido
logAuth('failed_login', undefined, false, { email: email });
```

---

## 🔍 Monitoreo con UptimeRobot (Opcional)

### Setup Gratuito

1. Ir a https://uptimerobot.com
2. Crear cuenta gratuita (50 monitores gratis)
3. Agregar nuevo monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://tu-dominio.com/api/health`
   - **Interval:** 5 minutos
   - **Alert Contacts:** Tu email

### Alertas Configuradas

El sistema enviará alerta si:
- El endpoint no responde (status ≠ 200)
- La respuesta tarda más de 30 segundos
- La base de datos está desconectada

---

## 🐛 Tracking de Errores con Sentry

### Configuración Automática

Sentry ya captura automáticamente:
- ✅ Errores no capturados en el cliente
- ✅ Errores no capturados en el servidor
- ✅ Promesas rechazadas (unhandled rejections)
- ✅ Errores de API routes

### Captura Manual

**En el código:**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // ... código
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      endpoint: '/api/motels',
      userId: user?.id,
    },
    level: 'error',
  });
}
```

**Agregar contexto de usuario:**
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### Filtrado de Información Sensible

Ya configurado automáticamente:
- ✅ Passwords filtrados
- ✅ Tokens filtrados
- ✅ Headers de autorización removidos
- ✅ Cookies removidas

---

## 📈 Dashboard de Sentry

### Métricas Disponibles

1. **Issues:** Errores agrupados por tipo
2. **Performance:** Tiempos de respuesta de endpoints
3. **Releases:** Tracking de versiones deployed
4. **Alerts:** Notificaciones automáticas

### Configurar Alertas en Sentry

1. Settings → Alerts → Create Alert Rule
2. Tipo: **Issue Alert**
3. Condiciones:
   - When: "An issue is first seen"
   - Action: "Send a notification to..."
4. Guardar

---

## 🧪 Testing del Sistema

### 1. Test de Health Check

```bash
curl http://localhost:3000/api/health
```

### 2. Test de Logging

```typescript
// En cualquier endpoint
import logger from '@/lib/logger';

logger.info({ test: 'Logging funciona!' });
```

**Ver logs en consola (desarrollo):**
```
[timestamp] INFO: { test: 'Logging funciona!' }
```

### 3. Test de Sentry (Producción)

```typescript
// Provocar error de prueba
throw new Error('Test Sentry');
```

Verificar en dashboard de Sentry que llegó el error.

---

## 📊 Logs en Producción

### Ver Logs en Vercel

1. Dashboard → Tu Proyecto → Functions
2. Click en cualquier function
3. Ver "Logs" tab

### Ver Logs en Railway/Render

```bash
railway logs  # Railway
render logs   # Render
```

---

## 🔔 Alertas Recomendadas

### Críticas (Respuesta Inmediata)

1. **Database Down:**
   - Health check falla
   - Alerta vía email + SMS

2. **High Error Rate:**
   - >10 errores en 1 minuto
   - Alerta vía email

3. **API Timeout:**
   - Response time >5 segundos
   - Alerta vía email

### Importantes (Revisar Diario)

1. **Rate Limiting Exceeded:**
   - Alguien siendo bloqueado repetidamente

2. **Failed Login Attempts:**
   - >10 intentos fallidos de un IP

3. **Low Disk Space:**
   - Si aplica a tu hosting

---

## 📝 Checklist de Monitoring

```
[ ] Sentry configurado con DSN
[ ] Health check endpoint funciona
[ ] UptimeRobot monitoreando /api/health
[ ] Alertas de email configuradas
[ ] Logs estructurados en todos los endpoints críticos
[ ] Dashboard de Sentry revisado semanalmente
[ ] Backup de logs configurado (opcional)
```

---

## 🚨 Troubleshooting

### Sentry no captura errores

1. Verificar que `SENTRY_DSN` esté en `.env`
2. Verificar que no estés en development
3. Provocar error de prueba

### Health check retorna 503

1. Verificar que PostgreSQL esté corriendo
2. Verificar `DATABASE_URL` en `.env`
3. Verificar conexión de red

### Logs no aparecen

1. Verificar `LOG_LEVEL` en `.env`
2. En producción, usar servicios de logs del hosting
3. Verificar que logger esté importado

---

## 💰 Costos

**Gratis para siempre:**
- ✅ Sentry Free: 50k eventos/mes
- ✅ UptimeRobot Free: 50 monitores
- ✅ Pino: Open source, sin costo

**Si creces:**
- Sentry Team: $26/mes (500k eventos)
- UptimeRobot Pro: $7/mes (más features)

---

**Configuración completada:** 13 de Enero 2026
**Tiempo de implementación:** 12 horas
**Status:** ✅ Producción ready
