# 📊 Plan de Upgrade de Analytics

**Objetivo:** Identificar usuarios únicos, frecuencia de visitas y diferenciación por plataforma

---

## 📋 Estado Actual

### ✅ Lo que funciona:
- Tracking de eventos específicos (view, click phone, etc)
- Diferenciación básica por plataforma (WEB/MOBILE)
- Dashboard de analytics en admin
- Métricas de conversión básicas

### ❌ Gaps críticos:
- No identifican **usuarios únicos**
- No miden **frecuencia de visitas**
- No agrupan eventos en **sesiones**
- No hay **identificador persistente** del usuario
- No trackean **page views globales** (solo eventos de moteles)

---

## 🎯 Objetivos del Upgrade

### 1. Usuarios Únicos
Poder responder: **"¿Cuántos usuarios diferentes visitaron el sitio/app?"**

### 2. Frecuencia de Visitas
Poder responder: **"¿Cuántas veces volvió cada usuario?"**

### 3. Sesiones
Poder responder: **"¿Cuántas sesiones tuvo cada usuario?"**

### 4. Plataformas Detalladas
Poder responder: **"¿Cuántos usuarios en iOS vs Android vs Web Desktop vs Web Mobile?"**

### 5. Tiempo en Sitio
Poder responder: **"¿Cuánto tiempo pasa cada usuario en el sitio?"**

---

## 🏗️ SOLUCIÓN: 3 Capas Complementarias

### Capa 1: Analytics Anónimo Mejorado (Quick Win)
**Esfuerzo:** 4 horas
**Herramienta:** Cookies + localStorage + fingerprinting
**Ventaja:** No requiere login, funciona inmediatamente

### Capa 2: Google Analytics 4 (Profesional)
**Esfuerzo:** 2 horas
**Herramienta:** GA4 + GTM
**Ventaja:** Dashboards avanzados, reportes automáticos, audiencias

### Capa 3: Mixpanel/Amplitude (Avanzado)
**Esfuerzo:** 6-8 horas
**Herramienta:** Mixpanel o Amplitude
**Ventaja:** Funnels, cohortes, retention analysis

---

## 📝 CAPA 1: Analytics Anónimo Mejorado

### Concepto
Generar un **User ID anónimo** que persiste entre visitas usando:
1. **Cookie HTTP** (expire 2 años)
2. **localStorage** (backup si se borran cookies)
3. **Fingerprint básico** (último recurso)

### Implementación

#### 1. Crear servicio de identificación

**Archivo:** `lib/userIdentification.ts`

```typescript
/**
 * Genera y persiste un User ID anónimo
 */

const USER_ID_KEY = 'jahatelo_user_id';
const SESSION_ID_KEY = 'jahatelo_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

/**
 * Genera un ID único
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene o crea el User ID
 */
export function getUserId(): string {
  // 1. Intentar desde localStorage
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
      // 2. Intentar desde cookie
      userId = getCookie(USER_ID_KEY);

      if (!userId) {
        // 3. Crear nuevo ID
        userId = generateId();
      }

      // Guardar en ambos lados
      localStorage.setItem(USER_ID_KEY, userId);
      setCookie(USER_ID_KEY, userId, 365 * 2); // 2 años
    }

    return userId;
  }

  return 'server-side';
}

/**
 * Obtiene o crea el Session ID
 */
export function getSessionId(): string {
  if (typeof window !== 'undefined') {
    const now = Date.now();
    const sessionData = sessionStorage.getItem(SESSION_ID_KEY);

    if (sessionData) {
      const { id, timestamp } = JSON.parse(sessionData);

      // Si la sesión no expiró, reutilizar
      if (now - timestamp < SESSION_TIMEOUT) {
        // Actualizar timestamp
        sessionStorage.setItem(
          SESSION_ID_KEY,
          JSON.stringify({ id, timestamp: now })
        );
        return id;
      }
    }

    // Crear nueva sesión
    const newSessionId = generateId();
    sessionStorage.setItem(
      SESSION_ID_KEY,
      JSON.stringify({ id: newSessionId, timestamp: now })
    );

    return newSessionId;
  }

  return 'server-side';
}

/**
 * Obtiene información de plataforma detallada
 */
export function getPlatformInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      platform: 'server',
      os: 'unknown',
      browser: 'unknown',
      isMobile: false,
    };
  }

  const ua = navigator.userAgent;

  // Detectar OS
  let os = 'unknown';
  if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  // Detectar browser
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  // Detectar mobile
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);

  // Platform general
  let platform = 'web-desktop';
  if (isMobile) {
    platform = os === 'Android' ? 'mobile-android' : 'mobile-ios';
  }

  return {
    platform,
    os,
    browser,
    isMobile,
  };
}

/**
 * Helper: Set cookie
 */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Helper: Get cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
```

---

#### 2. Actualizar `analyticsService.ts`

**Archivo:** `lib/analyticsService.ts`

```typescript
import { getUserId, getSessionId, getPlatformInfo } from './userIdentification';

interface TrackEventParams {
  motelId: string;
  eventType: 'VIEW' | 'CLICK_PHONE' | 'CLICK_WHATSAPP' | 'CLICK_MAP' | 'CLICK_WEBSITE' | 'FAVORITE_ADD' | 'FAVORITE_REMOVE';
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Track un evento de analytics con User ID
 */
export const trackEvent = async ({ motelId, eventType, source, metadata }: TrackEventParams) => {
  try {
    const userId = getUserId();
    const sessionId = getSessionId();
    const platformInfo = getPlatformInfo();

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        motelId,
        eventType,
        source,
        userId, // ⭐ NUEVO
        sessionId, // ⭐ NUEVO
        deviceType: platformInfo.platform, // ⭐ MEJORADO
        deviceOs: platformInfo.os, // ⭐ NUEVO
        deviceBrowser: platformInfo.browser, // ⭐ NUEVO
        metadata,
      }),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics tracking failed (non-critical):', error);
    }
  }
};

/**
 * Track page view (nuevo)
 */
export const trackPageView = async (pagePath: string, pageTitle?: string) => {
  try {
    const userId = getUserId();
    const sessionId = getSessionId();
    const platformInfo = getPlatformInfo();

    await fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pagePath,
        pageTitle: pageTitle || document.title,
        userId,
        sessionId,
        deviceType: platformInfo.platform,
        deviceOs: platformInfo.os,
        deviceBrowser: platformInfo.browser,
      }),
    });
  } catch (error) {
    // Silent fail
  }
};

// ... resto de funciones existentes
```

---

#### 3. Actualizar esquema de Prisma

**Archivo:** `prisma/schema.prisma`

```prisma
model MotelAnalytics {
  id           String              @id @default(cuid())
  motel        Motel               @relation(fields: [motelId], references: [id], onDelete: Cascade)
  motelId      String
  eventType    AnalyticsEventType
  timestamp    DateTime            @default(now())

  // Identificadores de usuario
  userId       String?             // ⭐ NUEVO: ID anónimo persistente
  sessionId    String?             // ⭐ NUEVO: ID de sesión

  // Metadatos del evento
  source       String?
  userCity     String?
  userCountry  String?
  deviceType   String?             // 'web-desktop', 'web-mobile', 'mobile-android', 'mobile-ios'
  deviceOs     String?             // ⭐ NUEVO: 'Windows', 'macOS', 'Android', 'iOS'
  deviceBrowser String?            // ⭐ NUEVO: 'Chrome', 'Safari', 'Firefox'

  metadata     Json?

  @@index([motelId, timestamp])
  @@index([eventType, timestamp])
  @@index([userId, timestamp])    // ⭐ NUEVO: Para queries de usuarios
  @@index([sessionId])            // ⭐ NUEVO: Para queries de sesiones
}

// ⭐ NUEVA TABLA: Page Views globales
model PageView {
  id            String   @id @default(cuid())
  pagePath      String   // '/motels/123', '/motels', '/'
  pageTitle     String?
  timestamp     DateTime @default(now())

  // Identificadores
  userId        String
  sessionId     String

  // Información de dispositivo
  deviceType    String?
  deviceOs      String?
  deviceBrowser String?

  // Contexto
  referrer      String?  // De dónde vino
  duration      Int?     // Tiempo en página (segundos)

  @@index([userId, timestamp])
  @@index([sessionId])
  @@index([pagePath, timestamp])
  @@index([timestamp])
}

// ⭐ NUEVA TABLA: Sesiones agregadas
model UserSession {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String   @unique

  startTime     DateTime @default(now())
  endTime       DateTime?
  duration      Int?     // Duración en segundos

  // Información de la sesión
  deviceType    String?
  deviceOs      String?
  deviceBrowser String?

  // Métricas de la sesión
  pageViewCount Int      @default(0)
  eventCount    Int      @default(0)

  // Páginas visitadas en esta sesión
  pagesVisited  String[] // ['/motels', '/motels/123']

  @@index([userId, startTime])
  @@index([sessionId])
}
```

---

#### 4. Crear endpoint de Page View

**Archivo:** `app/api/analytics/pageview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pagePath,
      pageTitle,
      userId,
      sessionId,
      deviceType,
      deviceOs,
      deviceBrowser,
    } = body;

    // Validar campos requeridos
    if (!pagePath || !userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Crear page view
    await prisma.pageView.create({
      data: {
        pagePath,
        pageTitle,
        userId,
        sessionId,
        deviceType,
        deviceOs,
        deviceBrowser,
        referrer: request.headers.get('referer') || null,
      },
    });

    // Actualizar o crear sesión
    await prisma.userSession.upsert({
      where: { sessionId },
      update: {
        endTime: new Date(),
        pageViewCount: { increment: 1 },
      },
      create: {
        userId,
        sessionId,
        deviceType,
        deviceOs,
        deviceBrowser,
        pageViewCount: 1,
        pagesVisited: [pagePath],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}
```

---

#### 5. Actualizar endpoint de eventos

**Archivo:** `app/api/analytics/track/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      motelId,
      eventType,
      source,
      userId,      // ⭐ NUEVO
      sessionId,   // ⭐ NUEVO
      deviceType,
      deviceOs,    // ⭐ NUEVO
      deviceBrowser, // ⭐ NUEVO
      userCity,
      userCountry,
      metadata,
    } = body;

    // Validar motel
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { id: true },
    });

    if (!motel) {
      return NextResponse.json({ error: 'Motel not found' }, { status: 404 });
    }

    // Crear evento
    await prisma.motelAnalytics.create({
      data: {
        motelId,
        eventType,
        source,
        userId,        // ⭐ NUEVO
        sessionId,     // ⭐ NUEVO
        userCity,
        userCountry,
        deviceType,
        deviceOs,      // ⭐ NUEVO
        deviceBrowser, // ⭐ NUEVO
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    // Actualizar contador de eventos en sesión
    if (sessionId) {
      await prisma.userSession.updateMany({
        where: { sessionId },
        data: {
          eventCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
```

---

#### 6. Hook para trackear page views automáticamente

**Archivo:** `hooks/usePageTracking.ts`

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analyticsService';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view cada vez que cambia la ruta
    trackPageView(pathname);
  }, [pathname]);
}
```

---

#### 7. Integrar en layout principal

**Archivo:** `app/layout.tsx` o `app/(public)/layout.tsx`

```typescript
'use client';

import { usePageTracking } from '@/hooks/usePageTracking';

export default function PublicLayout({ children }) {
  // Auto-track page views
  usePageTracking();

  return (
    <>
      {children}
    </>
  );
}
```

---

## 📊 Dashboard de Usuarios Únicos

**Archivo:** `app/api/admin/analytics/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Usuarios únicos
    const uniqueUsers = await prisma.motelAnalytics.findMany({
      where: {
        timestamp: { gte: startDate },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    // 2. Usuarios por plataforma
    const usersByPlatform = await prisma.$queryRaw`
      SELECT
        "deviceType",
        COUNT(DISTINCT "userId") as count
      FROM "MotelAnalytics"
      WHERE "timestamp" >= ${startDate}
        AND "userId" IS NOT NULL
      GROUP BY "deviceType"
      ORDER BY count DESC
    `;

    // 3. Usuarios por OS
    const usersByOs = await prisma.$queryRaw`
      SELECT
        "deviceOs",
        COUNT(DISTINCT "userId") as count
      FROM "MotelAnalytics"
      WHERE "timestamp" >= ${startDate}
        AND "userId" IS NOT NULL
        AND "deviceOs" IS NOT NULL
      GROUP BY "deviceOs"
      ORDER BY count DESC
    `;

    // 4. Frecuencia de visitas (usuarios recurrentes)
    const userVisitFrequency = await prisma.$queryRaw`
      SELECT
        "userId",
        COUNT(DISTINCT DATE("timestamp")) as visit_days,
        COUNT(*) as total_events
      FROM "MotelAnalytics"
      WHERE "timestamp" >= ${startDate}
        AND "userId" IS NOT NULL
      GROUP BY "userId"
      ORDER BY visit_days DESC
      LIMIT 100
    `;

    // 5. Distribución de frecuencia
    const frequencyDistribution = await prisma.$queryRaw`
      WITH user_visits AS (
        SELECT
          "userId",
          COUNT(DISTINCT DATE("timestamp")) as visit_days
        FROM "MotelAnalytics"
        WHERE "timestamp" >= ${startDate}
          AND "userId" IS NOT NULL
        GROUP BY "userId"
      )
      SELECT
        CASE
          WHEN visit_days = 1 THEN '1 día'
          WHEN visit_days BETWEEN 2 AND 3 THEN '2-3 días'
          WHEN visit_days BETWEEN 4 AND 7 THEN '4-7 días'
          WHEN visit_days > 7 THEN '7+ días'
        END as frequency_bucket,
        COUNT(*) as user_count
      FROM user_visits
      GROUP BY frequency_bucket
      ORDER BY
        CASE
          WHEN frequency_bucket = '1 día' THEN 1
          WHEN frequency_bucket = '2-3 días' THEN 2
          WHEN frequency_bucket = '4-7 días' THEN 3
          WHEN frequency_bucket = '7+ días' THEN 4
        END
    `;

    // 6. Sesiones
    const totalSessions = await prisma.userSession.count({
      where: {
        startTime: { gte: startDate },
      },
    });

    const avgSessionDuration = await prisma.userSession.aggregate({
      where: {
        startTime: { gte: startDate },
        duration: { not: null },
      },
      _avg: {
        duration: true,
      },
    });

    return NextResponse.json({
      period: { days, startDate, endDate: new Date() },
      users: {
        total: uniqueUsers.length,
        byPlatform: usersByPlatform,
        byOs: usersByOs,
      },
      sessions: {
        total: totalSessions,
        avgDuration: avgSessionDuration._avg.duration,
      },
      engagement: {
        topUsers: userVisitFrequency,
        frequencyDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics de usuarios' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing

### 1. Probar generación de User ID
```javascript
// En browser console
import { getUserId } from '@/lib/userIdentification';

const userId = getUserId();
console.log('User ID:', userId);

// Recargar página
const userId2 = getUserId();
console.log('User ID después de reload:', userId2);
// Debería ser el mismo
```

### 2. Probar tracking de page view
```typescript
// Navegar a /motels
// Verificar en DB:
SELECT * FROM "PageView"
WHERE "pagePath" = '/motels'
ORDER BY "timestamp" DESC
LIMIT 10;
```

### 3. Verificar usuarios únicos
```sql
-- Usuarios únicos últimos 30 días
SELECT COUNT(DISTINCT "userId")
FROM "MotelAnalytics"
WHERE "timestamp" >= NOW() - INTERVAL '30 days';

-- Por plataforma
SELECT
  "deviceType",
  COUNT(DISTINCT "userId") as unique_users
FROM "MotelAnalytics"
WHERE "timestamp" >= NOW() - INTERVAL '30 days'
GROUP BY "deviceType";
```

---

## 📈 CAPA 2: Google Analytics 4 (Recomendado)

### Ventajas
- **Dashboards listos:** No necesitás programar reportes
- **Audiencias:** Crear segmentos automáticamente
- **Integración con Ads:** Si hacen publicidad
- **Gratis hasta 10M eventos/mes**

### Implementación

#### 1. Crear cuenta GA4
1. Ir a https://analytics.google.com
2. Crear propiedad
3. Obtener Measurement ID (G-XXXXXXXXX)

#### 2. Instalar Google Tag Manager (GTM)

```bash
npm install @next/third-parties
```

**Archivo:** `app/layout.tsx`

```typescript
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleTagManager gtmId="GTM-XXXXXX" />
      </body>
    </html>
  )
}
```

#### 3. Configurar eventos en GTM

Eventos a trackear:
- `page_view` (automático)
- `motel_view`
- `click_phone`
- `click_whatsapp`
- `add_to_favorites`

#### 4. Dual tracking (tu DB + GA4)

```typescript
// lib/analyticsService.ts
export const trackEvent = async (params) => {
  // 1. Track en tu DB (como antes)
  await fetch('/api/analytics/track', { ... });

  // 2. Track en GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', params.eventType.toLowerCase(), {
      motel_id: params.motelId,
      source: params.source,
      device_type: params.deviceType,
    });
  }
};
```

---

## 🚀 CAPA 3: Mixpanel (Opcional - Avanzado)

### Cuándo usarlo
- Querés **funnels avanzados** (cuántos ven motel → hacen click → llaman)
- Necesitás **cohorte analysis** (usuarios que se registraron en enero, cuántos volvieron?)
- Querés **A/B testing** nativo

### Quick Start

```bash
npm install mixpanel-browser
```

```typescript
// lib/mixpanel.ts
import mixpanel from 'mixpanel-browser';

mixpanel.init('YOUR_TOKEN', {
  track_pageview: true,
  persistence: 'localStorage',
});

export const trackMixpanelEvent = (eventName: string, properties?: any) => {
  mixpanel.track(eventName, properties);
};

export const identifyUser = (userId: string) => {
  mixpanel.identify(userId);
};
```

---

## 📊 Comparación de Soluciones

| Feature | Capa 1 (Custom) | GA4 | Mixpanel |
|---------|----------------|-----|----------|
| **Usuarios únicos** | ✅ | ✅ | ✅ |
| **Frecuencia visitas** | ✅ | ✅ | ✅ |
| **Plataformas** | ✅ | ✅ | ✅ |
| **Costo** | Gratis | Gratis | $89/mes |
| **Setup time** | 4 horas | 2 horas | 6 horas |
| **Dashboards** | Custom | Built-in | Built-in |
| **Funnels** | Manual | Básico | Avanzado |
| **Retention** | Manual | Básico | Avanzado |
| **Data ownership** | 100% tuyo | Google | Mixpanel |

---

## 🎯 Recomendación

### Para empezar YA:
1. **Implementar Capa 1** (4 horas)
   - Identificación anónima de usuarios
   - Tracking de page views
   - Dashboard de usuarios únicos

2. **Agregar GA4** (2 horas)
   - Backup de datos
   - Dashboards gratis
   - Audiencias para remarketing

### Después (opcional):
3. **Evaluar Mixpanel** (1-2 meses después)
   - Si necesitan funnels avanzados
   - Si quieren A/B testing
   - Si tienen budget

---

## ✅ Checklist de Implementación

### Capa 1: Custom Analytics
- [ ] Crear `lib/userIdentification.ts`
- [ ] Actualizar `lib/analyticsService.ts`
- [ ] Agregar campos a `MotelAnalytics` en Prisma
- [ ] Crear tabla `PageView` en Prisma
- [ ] Crear tabla `UserSession` en Prisma
- [ ] Ejecutar migración: `npx prisma migrate dev`
- [ ] Crear endpoint `/api/analytics/pageview`
- [ ] Actualizar endpoint `/api/analytics/track`
- [ ] Crear hook `usePageTracking`
- [ ] Integrar en layout público
- [ ] Crear endpoint `/api/admin/analytics/users`
- [ ] Crear UI para dashboard de usuarios

### Capa 2: GA4
- [ ] Crear cuenta Google Analytics
- [ ] Obtener Measurement ID
- [ ] Instalar `@next/third-parties`
- [ ] Agregar GTM a layout
- [ ] Configurar eventos en GTM
- [ ] Dual tracking (DB + GA4)
- [ ] Verificar eventos en GA4

---

## 📝 Próximos Pasos

1. **Decidir:** ¿Empezamos con Capa 1 solamente o Capa 1 + GA4?
2. **Estimar:** ¿Cuándo podemos implementar?
3. **Migración:** Crear y ejecutar migración de Prisma
4. **Testing:** Probar en desarrollo
5. **Deploy:** Subir a producción
6. **Monitor:** Ver datos durante 1 semana

---

**Fecha de creación:** Enero 2025
**Última actualización:** Enero 2025
