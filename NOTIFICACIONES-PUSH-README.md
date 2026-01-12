# Sistema de Notificaciones Push - Jahatelo

Sistema completo de notificaciones push para Jahatelo con soporte para notificaciones instantáneas, programadas, filtros de preferencias y navegación directa.

## 📋 Tabla de Contenidos

- [Características Implementadas](#características-implementadas)
- [Arquitectura](#arquitectura)
- [Modelos de Base de Datos](#modelos-de-base-de-datos)
- [APIs](#apis)
- [Configuración](#configuración)
- [Uso](#uso)
- [Casos de Uso](#casos-de-uso)

---

## ✅ Características Implementadas

### 1. Navegación Directa desde Notificaciones

- ✅ Context de navegación global
- ✅ Navegación automática al tocar notificación
- ✅ Soporte para múltiples tipos de notificaciones:
  - `contact_message` - Mensajes de contacto (solo alerta para admins)
  - `promo` - Promociones (navega a detalle del motel)
  - `motel_update` - Actualizaciones de motel
- ✅ Alerta in-app cuando llega notificación con app abierta
- ✅ Queue de navegación si la app no está lista

### 2. Filtros de Notificaciones (Preferencias de Usuario)

- ✅ Modelo `UserNotificationPreferences` con 14 opciones configurables
- ✅ API REST completa (GET, PUT, POST)
- ✅ Preferencias específicas para administradores:
  - Mensajes de contacto
  - Nuevos prospectos
  - Recordatorios de pago
  - Aprobaciones de motel
- ✅ Preferencias para usuarios normales:
  - Nuevas promos en favoritos
  - Bajadas de precio
  - Actualizaciones de motel
  - Reviews y likes
  - Marketing general
- ✅ Respeto automático de preferencias al enviar notificaciones

### 3. Notificaciones Programadas

- ✅ Modelo `ScheduledNotification` para almacenar notificaciones futuras
- ✅ Sistema de cola con procesamiento automático
- ✅ Soporte para múltiples audiencias:
  - Usuarios específicos (por IDs)
  - Por rol (SUPERADMIN, MOTEL_ADMIN, USER)
  - Por motel (usuarios que favoritearon)
- ✅ Tracking de resultados (enviados, fallidos)
- ✅ Endpoint de cron job para procesamiento periódico
- ✅ Envío inmediato o programado
- ✅ Notificaciones de promos a favoritos

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         MOBILE APP                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ App.js                                                │  │
│  │  - Inicializa notificaciones al arrancar             │  │
│  │  - Configura handlers de recepción                   │  │
│  │  - Maneja navegación desde notificaciones            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ notificationService.js                                │  │
│  │  - Solicita permisos                                  │  │
│  │  - Registra token en backend                          │  │
│  │  - Configura canales de Android                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ POST /api/push-tokens/register
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND API                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/push-tokens/register                             │  │
│  │  - Registra/actualiza tokens                          │  │
│  │  - Desactiva tokens antiguos                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/user/notification-preferences                    │  │
│  │  - GET: Obtiene preferencias                          │  │
│  │  - PUT: Actualiza preferencias                        │  │
│  │  - POST: Crea preferencias por defecto                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/notifications/schedule                           │  │
│  │  - POST: Programa o envía notificación                │  │
│  │  - GET: Lista notificaciones programadas              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/cron/process-notifications                       │  │
│  │  - Procesa notificaciones programadas pendientes      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PUSH NOTIFICATION SERVICE               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ lib/push-notifications.ts                             │  │
│  │  - sendPushNotification()                             │  │
│  │  - sendNotificationToAdmins()                         │  │
│  │  - sendPromoNotificationToFavorites()                 │  │
│  │  - scheduleNotification()                             │  │
│  │  - processScheduledNotifications()                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Expo Push Notification Service                │
│                  https://exp.host/--/api/v2/push/send       │
└─────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
                      📱 Dispositivos Móviles
```

---

## 💾 Modelos de Base de Datos

### PushToken

Almacena tokens de notificaciones push de dispositivos.

```prisma
model PushToken {
  id           String    @id @default(cuid())
  user         User?     @relation(fields: [userId], references: [id])
  userId       String?
  token        String    @unique  // Expo push token
  deviceId     String?
  deviceType   String?   // "ios", "android"
  deviceName   String?
  appVersion   String?
  isActive     Boolean   @default(true)
  lastUsedAt   DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([token])
  @@index([isActive])
}
```

### UserNotificationPreferences

Preferencias de notificaciones por usuario.

```prisma
model UserNotificationPreferences {
  id                      String   @id @default(cuid())
  user                    User     @relation(fields: [userId], references: [id])
  userId                  String   @unique

  // General
  enableNotifications     Boolean  @default(true)
  enableEmail             Boolean  @default(true)
  enablePush              Boolean  @default(true)

  // Usuarios normales
  notifyNewPromos         Boolean  @default(true)
  notifyPriceDrops        Boolean  @default(true)
  notifyUpdates           Boolean  @default(true)
  notifyReviewReplies     Boolean  @default(true)
  notifyReviewLikes       Boolean  @default(false)
  notifyPromotions        Boolean  @default(true)
  notifyNewMotels         Boolean  @default(false)

  // Administradores
  notifyContactMessages   Boolean  @default(true)
  notifyNewProspects      Boolean  @default(true)
  notifyPaymentReminders  Boolean  @default(true)
  notifyMotelApprovals    Boolean  @default(true)

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

### ScheduledNotification

Notificaciones programadas para envío futuro.

```prisma
model ScheduledNotification {
  id              String    @id @default(cuid())
  title           String
  body            String
  data            Json?

  // Programación
  scheduledFor    DateTime
  sent            Boolean   @default(false)
  sentAt          DateTime?

  // Audiencia
  targetUserIds   String[]
  targetRole      String?   // "SUPERADMIN", "MOTEL_ADMIN", "USER"
  targetMotelId   String?   // Para usuarios que favoritearon

  // Metadata
  type            String    // "promo", "reminder", "announcement"
  relatedEntityId String?   // ID de promo, motel, etc.

  // Resultados
  totalSent       Int       @default(0)
  totalFailed     Int       @default(0)
  errorMessage    String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([scheduledFor, sent])
  @@index([targetMotelId])
  @@index([type])
}
```

---

## 🔌 APIs

### 1. Registro de Tokens Push

**POST** `/api/push-tokens/register`

Registra o actualiza un token de notificaciones push.

**Body:**
```json
{
  "token": "ExponentPushToken[xxxxxx]",
  "userId": "user_id_optional",
  "deviceId": "device_unique_id",
  "deviceType": "ios",
  "deviceName": "iPhone 14",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "pushToken": {
    "id": "...",
    "token": "ExponentPushToken[xxxxxx]",
    "isActive": true
  }
}
```

---

**DELETE** `/api/push-tokens/register`

Desactiva un token de notificaciones push.

**Body:**
```json
{
  "token": "ExponentPushToken[xxxxxx]"
}
```

---

### 2. Preferencias de Notificaciones

**GET** `/api/user/notification-preferences?userId={userId}`

Obtiene las preferencias de notificaciones del usuario.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "id": "...",
    "userId": "...",
    "enableNotifications": true,
    "enablePush": true,
    "notifyContactMessages": true,
    // ... todas las preferencias
  }
}
```

---

**PUT** `/api/user/notification-preferences`

Actualiza las preferencias de notificaciones.

**Body:**
```json
{
  "userId": "user_id",
  "enableNotifications": true,
  "notifyContactMessages": false,
  "notifyNewPromos": true
  // ... campos a actualizar
}
```

---

### 3. Notificaciones Programadas

**POST** `/api/notifications/schedule`

Programa una notificación para envío futuro o inmediato.

**Body (Programada):**
```json
{
  "title": "🎉 Nueva promoción",
  "body": "50% de descuento en habitaciones VIP",
  "scheduledFor": "2026-01-15T18:00:00Z",
  "type": "promo",
  "targetMotelId": "motel_id",
  "relatedEntityId": "promo_id",
  "data": {
    "motelSlug": "motel-paradise",
    "promoId": "promo_id"
  }
}
```

**Body (Inmediata):**
```json
{
  "title": "🎉 Nueva promoción",
  "body": "50% de descuento en habitaciones VIP",
  "sendNow": true,
  "type": "promo",
  "targetMotelId": "motel_id",
  "relatedEntityId": "promo_id"
}
```

**Response:**
```json
{
  "success": true,
  "id": "scheduled_notification_id",
  "message": "Notificación programada para 2026-01-15T18:00:00Z"
}
```

---

**GET** `/api/notifications/schedule?sent=false&type=promo&limit=50`

Lista notificaciones programadas.

**Query Params:**
- `sent`: "true" | "false" | "all" (default: "all")
- `type`: tipo de notificación (opcional)
- `limit`: número de resultados (default: 50)

---

### 4. Cron Job - Procesamiento de Notificaciones

**GET** `/api/cron/process-notifications`

Procesa notificaciones programadas que ya llegaron a su fecha.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "processed": 10,
  "sent": 150,
  "failed": 2,
  "message": "Processed 10 notifications: 150 sent, 2 failed"
}
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Agregar al `.env`:

```env
# Secret para proteger el endpoint de cron
CRON_SECRET=tu_secreto_random_aqui
```

### 2. Configurar Cron Job

Opciones para ejecutar el procesamiento de notificaciones:

#### Opción A: cron-job.org (Recomendado - Gratis)

1. Crear cuenta en https://cron-job.org
2. Crear nuevo cron job:
   - **URL**: `https://tu-dominio.com/api/cron/process-notifications`
   - **Intervalo**: Cada 1 minuto
   - **Headers**: `Authorization: Bearer TU_CRON_SECRET`
   - **Method**: GET

#### Opción B: GitHub Actions

Crear `.github/workflows/process-notifications.yml`:

```yaml
name: Process Scheduled Notifications

on:
  schedule:
    - cron: '* * * * *'  # Cada minuto
  workflow_dispatch:  # Manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/cron/process-notifications
```

#### Opción C: Vercel Cron Jobs

Crear `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/process-notifications",
    "schedule": "* * * * *"
  }]
}
```

### 3. Expo Configuration

Agregar a `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#822DE2",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#822DE2",
      "androidMode": "default",
      "androidCollapsedTitle": "Jahatelo"
    }
  }
}
```

---

## 📱 Uso

### En el Código - Enviar Notificación Inmediata

```typescript
import { sendPromoNotificationToFavorites } from '@/lib/push-notifications';

// Cuando se crea una promo
const promo = await prisma.promo.create({
  data: { /* ... */ }
});

// Enviar notificación a usuarios que favoritearon el motel
await sendPromoNotificationToFavorites(promo.motelId, {
  id: promo.id,
  title: promo.title,
  description: promo.description,
});
```

### Programar Notificación con API

```bash
curl -X POST https://tu-dominio.com/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎉 Descuento especial",
    "body": "50% OFF en todas las habitaciones este fin de semana",
    "scheduledFor": "2026-01-15T09:00:00Z",
    "type": "promo",
    "targetMotelId": "clxxx",
    "relatedEntityId": "promo_id",
    "data": {
      "type": "promo",
      "motelSlug": "motel-paradise"
    }
  }'
```

### Configurar Preferencias desde App Mobile

```javascript
// Obtener preferencias actuales
const response = await fetch(
  `${API_URL}/api/user/notification-preferences?userId=${userId}`
);
const { preferences } = await response.json();

// Actualizar preferencias
await fetch(`${API_URL}/api/user/notification-preferences`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    notifyContactMessages: false, // Desactivar mensajes de contacto
    notifyNewPromos: true,
  }),
});
```

---

## 💡 Casos de Uso

### 1. Notificación de Mensaje de Contacto

**Trigger:** Usuario envía mensaje desde formulario de contacto

**Flujo:**
1. POST a `/api/contact` crea el mensaje
2. Se llama automáticamente a `sendNewContactMessageNotification()`
3. Se buscan todos los SUPERADMIN activos con preferencias habilitadas
4. Se filtran según `notifyContactMessages` preference
5. Se envía notificación push inmediata
6. Los admins ven alerta y pueden navegar

**Resultado:** Administradores reciben notificación en ~2 segundos

---

### 2. Promoción en Motel Favorito

**Trigger:** Administrador de motel crea nueva promoción

**Flujo:**
1. Crear promo en admin panel
2. Llamar a API: POST `/api/notifications/schedule` con `sendNow=true`
3. Sistema busca usuarios que favoritearon el motel
4. Filtra según preferencia `notifyNewPromos`
5. Envía notificación inmediata

**Resultado:** Usuarios interesados reciben promo al instante

---

### 3. Campaña Programada de Marketing

**Trigger:** SUPERADMIN programa campaña para próximo fin de semana

**Flujo:**
1. Admin programa notificación para viernes a las 6 PM
2. POST `/api/notifications/schedule` con `scheduledFor`
3. Se crea `ScheduledNotification` en DB
4. Cron job ejecuta cada minuto
5. El viernes a las 6 PM, el cron detecta la notificación
6. Se envía a la audiencia especificada
7. Se marca como `sent=true` con resultados

**Resultado:** Notificación enviada automáticamente en el horario óptimo

---

### 4. Recordatorio de Pago a Administradores de Motel

**Trigger:** Sistema detecta pago pendiente

**Flujo:**
1. Backend detecta `billingDay` de un motel
2. Programa notificación para 3 días antes del pago
3. Notificación dirigida a `MOTEL_ADMIN` del motel específico
4. Se respeta preferencia `notifyPaymentReminders`
5. Cron job procesa y envía

**Resultado:** Admin del motel recibe recordatorio oportuno

---

## 🧪 Testing

### Test Manual - Enviar Notificación de Prueba

```bash
# 1. Obtener un token de prueba de la app mobile
# (verlo en los logs cuando la app inicia)

# 2. Enviar notificación directamente
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[tu_token_aqui]",
    "title": "Test Notification",
    "body": "Esta es una prueba",
    "data": {
      "type": "test"
    }
  }'
```

### Test Programación

```bash
# Programar para 2 minutos en el futuro
FUTURE_DATE=$(date -u -v+2M +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST https://tu-dominio.com/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Programado",
    "body": "Esta notificación fue programada",
    "scheduledFor": "'$FUTURE_DATE'",
    "type": "test",
    "targetRole": "SUPERADMIN"
  }'

# Verificar que se envió después de 2 minutos
```

---

## 🔒 Seguridad

### Protección de Endpoints

1. **Cron Job**: Protegido con `CRON_SECRET` en headers
2. **APIs de Admin**: Requieren autenticación y rol SUPERADMIN
3. **Tokens**: Validados antes de registro
4. **Rate Limiting**: Implementar rate limiting en producción

### Privacidad

- Los tokens push se desactivan automáticamente si son inválidos
- Las preferencias son privadas por usuario
- Los datos de notificaciones no incluyen información sensible

---

## 📊 Monitoreo

### Logs a Monitorear

```typescript
// En lib/push-notifications.ts
console.log('Notificación de contacto enviada: X éxitos, Y fallos, Z omitidos');
console.log('Processed X notifications: Y sent, Z failed');
```

### Métricas Recomendadas

- Tasa de éxito de envío
- Tokens activos vs inactivos
- Notificaciones programadas pendientes
- Tiempo promedio de procesamiento
- Tasa de interacción (click rate)

---

## 🚀 Próximos Pasos Opcionales

1. **Analytics de Notificaciones**
   - Rastrear opens/clicks
   - A/B testing de mensajes

2. **Rich Notifications**
   - Imágenes en notificaciones
   - Botones de acción

3. **Notificaciones Web**
   - Push notifications en navegadores
   - Service Worker

4. **Segmentación Avanzada**
   - Por ubicación geográfica
   - Por comportamiento de usuario

5. **UI de Administración**
   - Panel para crear campañas
   - Editor WYSIWYG de notificaciones

---

## 📝 Changelog

### v1.0.0 (2026-01-12)

- ✅ Sistema de tokens push
- ✅ Preferencias de notificaciones
- ✅ Notificaciones programadas
- ✅ Navegación directa
- ✅ Notificaciones de mensajes de contacto
- ✅ Notificaciones de promos a favoritos
- ✅ Cron job para procesamiento automático

---

## 👥 Soporte

Para problemas o preguntas:
- Backend: Revisar logs en `/api/cron/process-notifications`
- Mobile: Verificar permisos y token en `notificationService.js`
- Documentación Expo: https://docs.expo.dev/push-notifications/overview/
