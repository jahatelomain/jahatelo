# Configuración de Push Notifications en Producción

## ⚠️ IMPORTANTE: Expo Go no soporta Push Notifications desde SDK 53

Para probar push notifications en la app móvil, **debes usar un Development Build**, no Expo Go.

Ver guía completa: `app/jahatelo-app/docs/DEVELOPMENT-BUILD.md`

---

## Descripción General

Jahatelo utiliza **Expo Push Notifications** para enviar notificaciones push a dispositivos móviles. El sistema soporta:

- ✅ Notificaciones instantáneas (envío inmediato)
- ✅ Notificaciones programadas (envío diferido)
- ✅ Segmentación por roles (SUPERADMIN, MOTEL_ADMIN, USER)
- ✅ Segmentación por moteles favoritos
- ✅ Preferencias de usuario por categoría (publicidad, seguridad, mantenimiento)
- ✅ Procesamiento automático mediante cron jobs
- ✅ Gestión de tokens inválidos (DeviceNotRegistered)

---

## Arquitectura del Sistema

### 1. Registro de Tokens
Los usuarios de la app móvil registran sus tokens push mediante:

**Endpoint:** `POST /api/push-tokens/register`

```json
{
  "token": "ExponentPushToken[xxx]",
  "deviceId": "device-123",
  "deviceType": "ios | android",
  "deviceName": "iPhone 14",
  "appVersion": "1.0.0",
  "userId": "user-id" // Opcional para usuarios autenticados
}
```

Los tokens se almacenan en la tabla `PushToken` con campos:
- `token` (PK) - Token único de Expo
- `userId` (FK) - Usuario dueño del token (null para invitados)
- `deviceId` - ID del dispositivo
- `isActive` - Estado del token (se desactiva si Expo retorna DeviceNotRegistered)

### 2. Envío de Notificaciones

#### Envío Inmediato
```typescript
// Ejemplo: Enviar notificación instantánea
POST /api/notifications/schedule
{
  "title": "🎉 Nueva promoción",
  "body": "50% de descuento en habitaciones VIP",
  "sendNow": true,
  "type": "promo",
  "category": "advertising",
  "targetMotelId": "motel-id", // Usuarios que favoritearon este motel
  "relatedEntityId": "promo-id",
  "data": {
    "type": "promo",
    "promoId": "promo-id",
    "motelSlug": "motel-paraiso"
  }
}
```

#### Envío Programado
```typescript
POST /api/notifications/schedule
{
  "title": "Recordatorio de pago",
  "body": "Tu plan vence en 3 días",
  "sendNow": false,
  "scheduledFor": "2025-02-15T14:30:00.000Z", // Solo :00 o :30
  "type": "reminder",
  "category": "maintenance",
  "targetRole": "MOTEL_ADMIN"
}
```

### 3. Procesamiento de Notificaciones Programadas

Las notificaciones programadas se procesan mediante un cron job:

**Endpoint:** `GET /api/cron/process-notifications`

Este endpoint:
- Busca notificaciones con `sent: false` y `scheduledFor <= now()`
- Envía hasta 50 notificaciones por ejecución
- Actualiza el estado (`sent`, `sentAt`, `totalSent`, `totalFailed`, `totalSkipped`)
- Desactiva tokens inválidos automáticamente

---

## Configuración en Producción

### Paso 1: Variables de Entorno

Agregar a Vercel (Settings → Environment Variables):

```bash
# Cron Jobs
CRON_SECRET="tu-secret-key-segura-minimo-32-caracteres"
```

**Nota:** Expo Push Notifications **no requiere API key** para uso básico. El servicio es gratuito hasta 600 notificaciones/hora.

### Paso 2: Configurar Cron Job en Vercel

Crear o actualizar `vercel.json`:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install",
  "crons": [
    {
      "path": "/api/cron/process-notifications",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Significado:** Ejecuta una vez por día (plan Hobby).

**Opciones de schedule (cron syntax):**
- `*/1 * * * *` - Cada minuto (máxima frecuencia)
- `*/5 * * * *` - Cada 5 minutos (recomendado para producción)
- `*/15 * * * *` - Cada 15 minutos
- `0 * * * *` - Cada hora en punto

**Importante (Hobby):** con cron diario, las notificaciones programadas se retrasan. 
Por ahora solo usar envíos inmediatos. Pendiente: reactivar cron frecuente o mover a cron externo.

### Paso 3: Proteger el Endpoint con CRON_SECRET

El endpoint `/api/cron/process-notifications` ya está protegido:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Vercel Cron Jobs** automáticamente incluyen el header `Authorization: Bearer ${CRON_SECRET}` cuando ejecutan.

### Paso 4: Verificar que Prisma Schema tiene las tablas

Verificar que existen en `prisma/schema.prisma`:

```prisma
model PushToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String?
  deviceId    String?
  deviceType  String?
  deviceName  String?
  appVersion  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime @default(now())
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ScheduledNotification {
  id               String   @id @default(cuid())
  title            String
  body             String
  scheduledFor     DateTime
  sent             Boolean  @default(false)
  sentAt           DateTime?
  type             String   // "promo", "reminder", "announcement"
  category         String   @default("advertising") // "advertising", "security", "maintenance"
  targetUserIds    String[] // Lista de IDs de usuarios específicos
  targetRole       String?  // "SUPERADMIN", "MOTEL_ADMIN", "USER"
  targetMotelId    String?  // Para enviar a favoritos de un motel
  relatedEntityId  String?  // ID de promo, motel, etc.
  data             Json?    // Datos adicionales para la notificación
  totalSent        Int      @default(0)
  totalFailed      Int      @default(0)
  totalSkipped     Int      @default(0)
  errorMessage     String?
  createdAt        DateTime @default(now())
}

model UserNotificationPreferences {
  id                       String  @id @default(cuid())
  userId                   String  @unique
  enableNotifications      Boolean @default(true)
  enablePush               Boolean @default(true)
  enableAdvertisingPush    Boolean @default(true)
  enableSecurityPush       Boolean @default(true)
  enableMaintenancePush    Boolean @default(true)
  notifyNewPromos          Boolean @default(true)
  notifyContactMessages    Boolean @default(true)
  notifyNewProspects       Boolean @default(true)
  notifyPaymentReminders   Boolean @default(true)
  notifyMotelApprovals     Boolean @default(true)
  user                     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Si no existen, crear migración:

```bash
npx prisma migrate dev --name add_push_notifications
npx prisma migrate deploy
```

---

## Límites y Mejores Prácticas

### Límites de Expo Push Notifications

| Límite | Valor | Notas |
|--------|-------|-------|
| Requests/hora (gratis) | 600 | ~10 por minuto |
| Notificaciones/request | 100 | Agrupar tokens en batches |
| Tamaño del mensaje | 4KB | Incluye title, body, data |
| Expiración de token | N/A | Tokens inválidos retornan `DeviceNotRegistered` |

**Plan Paid (si se necesita más):**
- Sin límite de requests/hora
- $0.005 por cada 1000 notificaciones adicionales
- Más info: https://expo.dev/pricing

### Mejores Prácticas

#### 1. Respetar Preferencias de Usuario
```typescript
// El sistema ya implementa esto
// Las notificaciones de categoría "advertising" solo se envían si:
// - user.notificationPreferences.enableNotifications = true
// - user.notificationPreferences.enablePush = true
// - user.notificationPreferences.enableAdvertisingPush = true

// Notificaciones de "security" y "maintenance" SIEMPRE se envían (críticas)
```

#### 2. Limitar Frecuencia de Notificaciones
```typescript
// Ejemplo: No enviar más de 3 notificaciones por día a un usuario
// Esto debe implementarse manualmente en el admin panel

// Recomendación: Agregar campo lastNotificationSentAt en UserNotificationPreferences
// Y validar antes de enviar:
const lastSent = user.notificationPreferences?.lastNotificationSentAt;
const hoursSinceLastNotification = lastSent ?
  (Date.now() - lastSent.getTime()) / (1000 * 60 * 60) : 999;

if (category === 'advertising' && hoursSinceLastNotification < 8) {
  // No enviar publicidad si se envió hace menos de 8 horas
  return;
}
```

#### 3. Horarios Permitidos
```typescript
// El sistema actual valida que solo se programen notificaciones en :00 o :30
// Esto asegura que coincidan con la frecuencia del cron job

// Recomendación adicional: Evitar horarios nocturnos para publicidad
const hour = new Date(scheduledFor).getHours();
if (category === 'advertising' && (hour < 9 || hour > 21)) {
  return { error: 'No se permite publicidad entre 21:00 y 9:00' };
}
```

#### 4. Gestión de Tokens Inválidos
```typescript
// El sistema ya desactiva tokens automáticamente cuando Expo retorna:
// { details: { error: 'DeviceNotRegistered' } }

// Limpieza periódica recomendada (ejecutar mensual):
DELETE FROM "PushToken"
WHERE "isActive" = false
  AND "lastUsedAt" < NOW() - INTERVAL '30 days';
```

#### 5. Agrupar Envíos en Batches
```typescript
// Expo recomienda enviar máximo 100 tokens por request
// El sistema actual envía uno por uno (sendPushNotification)
// Para optimizar, modificar sendPushNotifications en lib/push-notifications.ts:

export async function sendPushNotifications(
  tokens: string[],
  notification: PushNotification
): Promise<PushSendResult[]> {
  const BATCH_SIZE = 100;
  const batches = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    batches.push(tokens.slice(i, i + BATCH_SIZE));
  }

  const results = [];
  for (const batch of batches) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        batch.map(token => ({
          to: token,
          sound: notification.sound || 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          badge: notification.badge,
          channelId: notification.channelId || 'default',
          priority: notification.priority || 'high',
        }))
      ),
    });

    const result = await response.json();
    results.push(...result.data);
  }

  return results.map(r => ({
    success: r.status === 'ok',
    error: r.message,
    details: r,
  }));
}
```

---

## Categorías de Notificaciones

El sistema soporta 3 categorías con diferentes políticas:

### 1. `advertising` (Publicidad)
- **Respeta preferencias del usuario**
- Ejemplo: Promociones de moteles, descuentos
- Usuario puede desactivar: `enableAdvertisingPush: false`
- **Recomendación:** Máximo 3 por día por usuario

### 2. `security` (Seguridad)
- **Siempre se envía** (ignora preferencias)
- Ejemplo: Cambios de contraseña, accesos sospechosos
- Crítico para seguridad de la cuenta
- **Recomendación:** Solo para eventos de seguridad reales

### 3. `maintenance` (Mantenimiento)
- **Siempre se envía** (ignora preferencias)
- Ejemplo: Mantenimiento programado, actualizaciones importantes
- Información operativa crítica
- **Recomendación:** Máximo 1 por semana

---

## Testing

### 0. ⚠️ Requisito Previo: Development Build

**IMPORTANTE:** Antes de probar push notifications, debes crear un **development build**:

```bash
# En el directorio de la app móvil
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/app/jahatelo-app

# Crear development build para Android
eas build --profile development --platform android

# Instalar el APK en tu dispositivo físico
# (Recibirás un link de descarga cuando termine el build)
```

**No puedes usar Expo Go** para probar push notifications desde SDK 53.

Ver guía completa: `app/jahatelo-app/docs/DEVELOPMENT-BUILD.md`

---

### 1. Iniciar Backend

```bash
# En el directorio web
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/web/jahatelo-web
npm run dev
```

El servidor estará en: `http://0.0.0.0:3000`

---

### 2. Configurar API_URL en la App Móvil

Edita el archivo `.env` o `app.json` con tu IP local:

```bash
# .env
EXPO_PUBLIC_API_URL="http://192.168.10.83:3000"  # Reemplazar con tu IP
```

Para obtener tu IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

---

### 3. Ejecutar la App con Development Build

```bash
# En el directorio de la app móvil
npx expo start --dev-client
```

La app automáticamente registrará el token cuando se inicie.

Verás en la consola:
```
📡 Registrando token en: http://192.168.10.83:3000/api/push-tokens/register
✅ Token de push registrado exitosamente
```

---

### 4. Probar Registro de Token Manualmente (Opcional)

```typescript
// En la app móvil Expo (solo funciona en development build)
import * as Notifications from 'expo-notifications';

// Obtener token
const token = (await Notifications.getExpoPushTokenAsync({
  projectId: 'tu-project-id'  // Del app.json
})).data;

// Registrar en backend
await fetch('http://192.168.10.83:3000/api/push-tokens/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    deviceId: 'test-device-123',
    deviceType: 'android',
    deviceName: 'Samsung Test',
    appVersion: '1.0.0',
    userId: 'user-id-if-logged-in',
  }),
});
```

### 5. Probar Envío Inmediato

```bash
curl -X POST http://localhost:3000/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Test Notification",
    "body": "Esta es una notificación de prueba",
    "sendNow": true,
    "type": "announcement",
    "category": "maintenance",
    "targetUserIds": ["user-id-test"]
  }'
```

### 6. Probar Notificación Programada

```bash
curl -X POST http://localhost:3000/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "📅 Scheduled Test",
    "body": "Notificación programada para 5 minutos",
    "sendNow": false,
    "scheduledFor": "'$(date -u -v+5M +%Y-%m-%dT%H:%M:00.000Z)'",
    "type": "announcement",
    "category": "advertising",
    "targetRole": "USER"
  }'
```

### 7. Probar Cron Job Manualmente

```bash
curl -X GET http://localhost:3000/api/cron/process-notifications \
  -H "Authorization: Bearer tu-cron-secret"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "processed": 2,
  "sent": 45,
  "failed": 3,
  "message": "Processed 2 notifications: 45 sent, 3 failed"
}
```

### 8. Verificar Notificaciones en Base de Datos

```sql
-- Ver notificaciones programadas pendientes
SELECT id, title, scheduledFor, sent, totalSent, totalFailed
FROM "ScheduledNotification"
WHERE sent = false
ORDER BY scheduledFor ASC;

-- Ver tokens activos por usuario
SELECT u.name, pt.deviceType, pt.isActive, pt.lastUsedAt
FROM "PushToken" pt
LEFT JOIN "User" u ON u.id = pt."userId"
WHERE pt."isActive" = true
ORDER BY pt."lastUsedAt" DESC;

-- Ver preferencias de notificación
SELECT u.name, np."enableAdvertisingPush", np."enablePush"
FROM "UserNotificationPreferences" np
JOIN "User" u ON u.id = np."userId"
WHERE np."enableNotifications" = true;
```

---

## Troubleshooting

### Error: "expo-notifications was removed from Expo Go with the release of SDK 53"

**Causa:** Intentando usar push notifications en Expo Go (no soportado desde SDK 53).

**Solución:** Usa un development build en lugar de Expo Go:

```bash
# Crear development build
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/app/jahatelo-app
eas build --profile development --platform android

# Ejecutar con development build
npx expo start --dev-client
```

Ver guía completa: `app/jahatelo-app/docs/DEVELOPMENT-BUILD.md`

---

### Error: "JSON Parse error: Unexpected end of input"

**Causa:** El backend no está respondiendo o no está corriendo.

**Solución:**

1. **Verificar que el backend está corriendo:**
```bash
cd /Users/jota/Desktop/AKAHATA STUDIO/projects/jahatelo/web/jahatelo-web
npm run dev
```

2. **Verificar conectividad desde el dispositivo:**
```bash
# Obtener tu IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Resultado ejemplo: 192.168.10.83
```

3. **Configurar API_URL en la app:**
```bash
# Editar .env en la app móvil
EXPO_PUBLIC_API_URL="http://192.168.10.83:3000"
```

4. **Probar desde el navegador del dispositivo móvil:**
Abrir: `http://192.168.10.83:3000/api/health`
Debe responder: `{"status":"ok"}`

5. **Si no funciona, verificar firewall:**
- macOS: System Preferences → Security & Privacy → Firewall → Allow Node
- Windows: Firewall → Allow an app → Node.js
- Router: Asegurar que dispositivo y PC están en la misma red WiFi

---

### Error: "DeviceNotRegistered"

**Causa:** El token ya no es válido (usuario desinstaló la app, cambió de dispositivo, etc.)

**Solución:** El sistema desactiva automáticamente estos tokens. No requiere acción manual.

```typescript
// Ya implementado en lib/push-notifications.ts:76-82
if (entry?.details?.error === 'DeviceNotRegistered') {
  await prisma.pushToken.updateMany({
    where: { token },
    data: { isActive: false },
  });
}
```

### Error: "MessageTooBig"

**Causa:** El payload de la notificación excede 4KB.

**Solución:** Reducir tamaño de `title`, `body` o `data`:

```typescript
// Limitar longitud del body
const body = notification.body.length > 200
  ? notification.body.substring(0, 197) + '...'
  : notification.body;

// Minimizar data payload
const data = {
  type: notification.type,
  id: notification.id,
  // NO incluir objetos completos, solo IDs
};
```

### Error: "MessageRateExceeded"

**Causa:** Se excedió el límite de 600 requests/hora (plan gratuito).

**Solución:**
1. Implementar batching (enviar 100 tokens por request)
2. Reducir frecuencia del cron job (de cada 5 min a cada 15 min)
3. Considerar plan pagado de Expo si se necesita > 600 requests/hora

### Notificaciones no se envían

**Checklist:**
- ✅ Verificar que el cron job está configurado en `vercel.json`
- ✅ Verificar que `CRON_SECRET` está configurado en Vercel
- ✅ Verificar que hay notificaciones con `sent: false` y `scheduledFor <= now()`
- ✅ Verificar que hay tokens activos en la BD
- ✅ Verificar que los usuarios tienen `enableNotifications: true`
- ✅ Verificar que la categoría está permitida (`enableAdvertisingPush`, etc.)
- ✅ Revisar logs de Vercel: `vercel logs --app jahatelo --follow`

### Notificaciones se duplican

**Causa:** El cron job se ejecuta varias veces antes de que se marque `sent: true`.

**Solución:** Agregar bloqueo optimista:

```typescript
// En processScheduledNotifications():
const pendingNotifications = await prisma.scheduledNotification.findMany({
  where: {
    sent: false,
    scheduledFor: { lte: new Date() },
    // Agregar: solo procesar si no se está procesando
    sentAt: null, // Si sentAt existe pero sent=false, está en proceso
  },
  take: 50,
});

// Marcar como "en proceso" inmediatamente
for (const notification of pendingNotifications) {
  await prisma.scheduledNotification.update({
    where: { id: notification.id },
    data: { sentAt: new Date() }, // Marcar timestamp aunque sent=false
  });
}

// Luego enviar y actualizar sent=true
```

---

## Monitoreo en Producción

### 1. Logs de Vercel

Ver logs en tiempo real:

```bash
vercel logs --app jahatelo --follow
```

Buscar errores de notificaciones:

```bash
vercel logs --app jahatelo | grep "Error sending push"
```

### 2. Métricas Recomendadas (Sentry/Analytics)

Trackear:
- `push_notification_sent` - Total enviadas
- `push_notification_failed` - Total fallidas
- `push_notification_skipped` - Total omitidas (usuario opt-out)
- `push_token_registered` - Nuevos tokens registrados
- `push_token_invalidated` - Tokens desactivados por DeviceNotRegistered

### 3. Dashboard de Notificaciones

El admin panel ya tiene sección de notificaciones en:

**URL:** `/admin/notifications`

**Features:**
- Ver historial de notificaciones enviadas
- Ver estadísticas (totalSent, totalFailed, totalSkipped)
- Programar nuevas notificaciones
- Filtrar por tipo y estado

### 4. Alertas Recomendadas

Configurar alertas (ej: en Sentry) para:
- **Alta tasa de fallos:** `totalFailed / totalSent > 0.2` (>20% fallos)
- **Sin envíos:** No se procesaron notificaciones en últimas 24 horas (cron job parado)
- **Muchos tokens inválidos:** >100 tokens desactivados en 1 hora

---

## Checklist de Producción

Antes de ir a producción, verificar:

- [ ] `CRON_SECRET` configurado en Vercel Environment Variables
- [ ] Cron job configurado en `vercel.json` con frecuencia adecuada
- [ ] Tablas `PushToken`, `ScheduledNotification`, `UserNotificationPreferences` creadas
- [ ] Push notifications funcionan en la app móvil (Expo)
- [ ] Endpoint `/api/cron/process-notifications` protegido con CRON_SECRET
- [ ] Políticas de categorías implementadas (advertising respeta preferencias)
- [ ] Rate limiting considerado (batching si se espera > 600 requests/hora)
- [ ] Logs y monitoreo configurados (Sentry/Vercel Logs)
- [ ] Horarios de envío validados (evitar notificaciones nocturnas publicitarias)
- [ ] Frecuencia de notificaciones limitada por usuario
- [ ] Plan de escalabilidad (considerar plan paid de Expo si es necesario)

---

## Recursos Adicionales

- **Expo Push Notifications Docs:** https://docs.expo.dev/push-notifications/overview/
- **Expo Push Notification Tool (para testing):** https://expo.dev/notifications
- **Vercel Cron Jobs:** https://vercel.com/docs/cron-jobs
- **Pricing de Expo:** https://expo.dev/pricing

---

## Contactos de Emergencia

- **Backend:** [email del equipo]
- **Mobile:** [email del equipo mobile]
- **Soporte Expo:** https://expo.dev/support
