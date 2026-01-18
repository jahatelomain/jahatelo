# 🛠️ Guía de Implementación - Mejoras Críticas
## Pasos Detallados para Preparar Jahatelo para Producción

**Objetivo:** Implementar las mejoras críticas de seguridad y testing
**Audiencia:** Desarrolladores que implementarán las fases 1-2
**Tiempo estimado:** 80 horas (2 semanas)

---

## 📋 ÍNDICE

1. [Fase 1: Seguridad HTTP](#fase-1-seguridad-http)
2. [Fase 2: Input Validation](#fase-2-input-validation)
3. [Fase 3: Testing Setup](#fase-3-testing-setup)
4. [Fase 4: Monitoring Básico](#fase-4-monitoring-básico)
5. [Checklist de Verificación](#checklist-de-verificación)

---

## FASE 1: SEGURIDAD HTTP

### 🎯 Objetivo
Proteger la aplicación contra ataques comunes (brute force, DDoS, CSRF, XSS)

### ⏱️ Tiempo Estimado: 20 horas

---

### 1.1 Rate Limiting (6 horas)

#### Instalar dependencias

```bash
cd web/jahatelo-web
npm install express-rate-limit
npm install rate-limit-redis redis  # opcional para multi-instancia
```

#### Crear middleware de rate limiting

**Archivo:** `web/jahatelo-web/lib/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiting global (todas las requests)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para endpoints de autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  skipSuccessfulRequests: true, // no contar requests exitosas
  message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos',
});

// Rate limiting para endpoints de API pública
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requests por minuto
  message: 'Límite de API excedido, intenta nuevamente en 1 minuto',
});

// Rate limiting para uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // máximo 20 uploads por hora
  message: 'Límite de uploads excedido, intenta nuevamente en 1 hora',
});
```

#### Aplicar en middleware Next.js

**Archivo:** `web/jahatelo-web/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Importar rate limiters (adaptar para edge runtime)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Limpiar registros expirados
  if (record && now > record.resetTime) {
    rateLimitMap.delete(ip);
  }

  // Obtener o crear registro
  const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  // Verificar límite
  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }

  // Incrementar contador
  current.count++;
  rateLimitMap.set(ip, current);

  return { success: true, remaining: limit - current.count };
}

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;

  // Rate limiting para autenticación
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const { success, remaining } = rateLimit(ip, 5, 15 * 60 * 1000);

    if (!success) {
      return NextResponse.json(
        { error: 'Demasiados intentos de login' },
        {
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutos
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  // Rate limiting para API pública
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
    const { success, remaining } = rateLimit(ip, 30, 60 * 1000);

    if (!success) {
      return NextResponse.json(
        { error: 'Límite de API excedido' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '30');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  // Rate limiting para uploads
  if (pathname.startsWith('/api/upload')) {
    const { success, remaining } = rateLimit(ip, 20, 60 * 60 * 1000);

    if (!success) {
      return NextResponse.json(
        { error: 'Límite de uploads excedido' },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '20');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
```

---

### 1.2 Security Headers (4 horas)

#### Agregar headers de seguridad en `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... configuración existente

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS - Forzar HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://maps.googleapis.com https://exp.host",
              "frame-src 'self' https://maps.google.com",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

### 1.3 CORS Configuration (2 horas)

#### Configurar CORS en middleware

**Actualizar:** `web/jahatelo-web/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  // ... código de rate limiting

  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'exp://localhost:8081', // Expo dev
    'http://localhost:8081', // Expo dev
  ];

  // CORS para API
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
```

---

### 1.4 HTTPS Redirect (2 horas)

#### Agregar redirección automática a HTTPS

**En:** `web/jahatelo-web/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  // Forzar HTTPS en producción
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }

  // ... resto del código
}
```

---

### 1.5 Environment Variables Audit (2 horas)

#### Verificar que NO haya secrets hardcoded

```bash
# Buscar posibles secrets hardcoded
cd web/jahatelo-web
grep -r "sk_" . --exclude-dir=node_modules
grep -r "pk_" . --exclude-dir=node_modules
grep -r "password" . --exclude-dir=node_modules --exclude=".md"
grep -r "secret" . --exclude-dir=node_modules --exclude=".md"
grep -r "apiKey" . --exclude-dir=node_modules
```

#### Template de .env.example

**Crear:** `web/jahatelo-web/.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jahatelo"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN="your-mp-token"

# Cron Secret
CRON_SECRET="your-cron-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

---

## FASE 2: INPUT VALIDATION

### 🎯 Objetivo
Validar y sanitizar todos los inputs del usuario

### ⏱️ Tiempo Estimado: 24 horas

---

### 2.1 Instalar Zod (1 hora)

```bash
cd web/jahatelo-web
npm install zod
```

---

### 2.2 Crear Schemas de Validación (8 horas)

**Archivo:** `web/jahatelo-web/lib/validations/schemas.ts`

```typescript
import { z } from 'zod';

// Usuario
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido').max(255),
  password: z.string()
    .min(8, 'Contraseña debe tener mínimo 8 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// Motel
export const MotelSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  direccion: z.string().min(10, 'Dirección muy corta').max(200, 'Dirección muy larga'),
  ciudad: z.string().min(2).max(100),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
  email: z.string().email('Email inválido').max(255).optional(),
  whatsapp: z.string().regex(/^\+?[0-9]{9,15}$/, 'WhatsApp inválido').optional(),
  descripcion: z.string().max(2000, 'Descripción muy larga').optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  horarioApertura: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  horarioCierre: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  plan: z.enum(['FREE', 'BASIC', 'GOLD', 'DIAMOND']).optional(),
});

export const UpdateMotelSchema = MotelSchema.partial();

// Habitación
export const RoomSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(500).optional(),
  precio30min: z.number().min(0).optional(),
  precio1h: z.number().min(0).optional(),
  precio2h: z.number().min(0).optional(),
  precio3h: z.number().min(0).optional(),
  precio6h: z.number().min(0).optional(),
  precio12h: z.number().min(0).optional(),
  precio24h: z.number().min(0).optional(),
});

// Reseña
export const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Comentario muy corto').max(500, 'Comentario muy largo'),
  motelId: z.string().uuid('ID de motel inválido'),
});

// Promo
export const PromoSchema = z.object({
  motelId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
});

// Contacto
export const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
  message: z.string().min(10).max(1000),
});

// Notificación
export const NotificationSchema = z.object({
  title: z.string().min(1).max(65),
  body: z.string().min(1).max(240),
  category: z.enum(['advertising', 'security', 'maintenance']),
  sendNow: z.boolean(),
  scheduledFor: z.string().datetime().optional(),
  targetRole: z.enum(['USER', 'MOTEL_ADMIN', 'SUPERADMIN']).optional(),
  targetMotelId: z.string().uuid().optional(),
});

// Anuncio
export const AdvertisementSchema = z.object({
  title: z.string().min(3).max(100),
  advertiser: z.string().min(2).max(100),
  imageUrl: z.string().url(),
  largeImageUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
  linkUrl: z.string().url().optional(),
  placement: z.enum(['POPUP_HOME', 'CAROUSEL', 'SECTION_BANNER', 'LIST_INLINE']),
  status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']),
  priority: z.number().int().min(0).max(100),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxViews: z.number().int().positive().optional(),
  maxClicks: z.number().int().positive().optional(),
});
```

---

### 2.3 Aplicar Validación en Endpoints (15 horas)

#### Ejemplo: Endpoint de Login

**Antes:**
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;
  // ... lógica
}
```

**Después:**
```typescript
import { LoginSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar input
    const validated = LoginSchema.parse(body);
    const { email, password } = validated;

    // ... lógica
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    // ... otros errores
  }
}
```

#### Endpoints a validar (prioridad alta):

1. **Autenticación**
   - [x] `/api/auth/register`
   - [x] `/api/auth/login`
   - [x] `/api/auth/reset-password`

2. **Moteles**
   - [x] `/api/admin/motels` (POST)
   - [x] `/api/admin/motels/[id]` (PATCH)
   - [x] `/api/public/motels/register`

3. **Habitaciones**
   - [x] `/api/admin/rooms` (POST)
   - [x] `/api/admin/rooms/[id]` (PATCH)

4. **Reseñas**
   - [x] `/api/mobile/reviews` (POST)

5. **Contacto**
   - [x] `/api/contact` (POST)

6. **Notificaciones**
   - [x] `/api/notifications/schedule` (POST)

7. **Anuncios**
   - [x] `/api/admin/banners` (POST)
   - [x] `/api/admin/banners/[id]` (PATCH)

---

### 2.4 Sanitización HTML (2 horas)

```bash
npm install dompurify isomorphic-dompurify
npm install -D @types/dompurify
```

**Archivo:** `web/jahatelo-web/lib/sanitize.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(text: string): string {
  // Remover caracteres peligrosos
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}
```

**Usar en endpoints:**

```typescript
import { sanitizeText } from '@/lib/sanitize';

export async function POST(request: Request) {
  const body = await request.json();
  const validated = MotelSchema.parse(body);

  // Sanitizar campos de texto libre
  const sanitized = {
    ...validated,
    descripcion: validated.descripcion ? sanitizeText(validated.descripcion) : null,
    nombre: sanitizeText(validated.nombre),
  };

  // ... guardar en DB
}
```

---

## FASE 3: TESTING SETUP

### 🎯 Objetivo
Implementar suite de testing básico

### ⏱️ Tiempo Estimado: 20 horas

---

### 3.1 Instalar Dependencias (1 hora)

```bash
cd web/jahatelo-web

# Jest + Testing Library
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jest-environment-jsdom

# Testing de APIs
npm install -D supertest @types/supertest

# E2E Testing
npm install -D @playwright/test
npx playwright install
```

---

### 3.2 Configurar Jest (2 horas)

**Archivo:** `web/jahatelo-web/jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

**Archivo:** `web/jahatelo-web/jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock de variables de entorno
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
```

---

### 3.3 Unit Tests Básicos (8 horas)

**Ejemplo 1: Testing de utilidades**

**Archivo:** `web/jahatelo-web/__tests__/lib/sanitize.test.ts`

```typescript
import { sanitizeText, sanitizeHtml } from '@/lib/sanitize';

describe('Sanitize Utils', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe('Hello');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
    });
  });
});
```

**Ejemplo 2: Testing de validación**

**Archivo:** `web/jahatelo-web/__tests__/lib/validations.test.ts`

```typescript
import { LoginSchema, MotelSchema } from '@/lib/validations/schemas';

describe('Validation Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate correct email and password', () => {
      const valid = {
        email: 'test@example.com',
        password: 'Test1234',
      };
      expect(() => LoginSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'Test1234',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });

    it('should reject empty password', () => {
      const invalid = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });
  });

  describe('MotelSchema', () => {
    it('should validate complete motel data', () => {
      const valid = {
        nombre: 'Motel Test',
        direccion: 'Calle Principal 123',
        ciudad: 'Asunción',
        telefono: '+595981234567',
        email: 'motel@test.com',
      };
      expect(() => MotelSchema.parse(valid)).not.toThrow();
    });

    it('should reject short nombre', () => {
      const invalid = {
        nombre: 'M',
        direccion: 'Calle Principal 123',
        ciudad: 'Asunción',
      };
      expect(() => MotelSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid phone', () => {
      const invalid = {
        nombre: 'Motel Test',
        direccion: 'Calle Principal 123',
        ciudad: 'Asunción',
        telefono: '123', // muy corto
      };
      expect(() => MotelSchema.parse(invalid)).toThrow();
    });
  });
});
```

---

### 3.4 Integration Tests (6 horas)

**Ejemplo: Testing de API endpoint**

**Archivo:** `web/jahatelo-web/__tests__/api/auth/login.test.ts`

```typescript
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      role: 'USER',
      isActive: true,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token');
    expect(data.user.email).toBe('test@example.com');
  });

  it('should reject invalid credentials', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpass',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Test1234',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

---

### 3.5 E2E Tests con Playwright (3 horas)

**Archivo:** `web/jahatelo-web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Archivo:** `web/jahatelo-web/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/admin/login');
    await page.click('text=Registrarse');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Test1234!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[name="email"]', 'admin@jahatelo.com');
    await page.fill('input[name="password"]', 'AdminPass123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  });
});
```

**Archivo:** `web/jahatelo-web/e2e/motels.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Motel Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login como SUPERADMIN
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@jahatelo.com');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should create new motel', async ({ page }) => {
    await page.goto('/admin/motels');
    await page.click('text=Nuevo Motel');

    await page.fill('input[name="nombre"]', 'Motel Test E2E');
    await page.fill('input[name="direccion"]', 'Calle Test 123');
    await page.fill('input[name="ciudad"]', 'Asunción');
    await page.fill('input[name="telefono"]', '+595981234567');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Motel creado')).toBeVisible();
  });

  test('should search motels', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder*="Buscar"]', 'Test');
    await page.press('input[placeholder*="Buscar"]', 'Enter');

    await expect(page.locator('text=Resultados')).toBeVisible();
  });
});
```

---

## FASE 4: MONITORING BÁSICO

### 🎯 Objetivo
Implementar error tracking y logs estructurados

### ⏱️ Tiempo Estimado: 12 horas

---

### 4.1 Configurar Sentry (4 horas)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Archivo:** `web/jahatelo-web/sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,

  beforeSend(event, hint) {
    // No enviar errores de desarrollo
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**Archivo:** `web/jahatelo-web/sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Filtrar información sensible
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});
```

---

### 4.2 Structured Logging (4 horas)

```bash
npm install pino pino-pretty
```

**Archivo:** `web/jahatelo-web/lib/logger.ts`

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
});

export default logger;

// Helper functions
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logRequest = (method: string, url: string, duration: number, status: number) => {
  logger.info({
    type: 'request',
    method,
    url,
    duration,
    status,
  });
};

export const logAuth = (action: string, userId?: string, success?: boolean) => {
  logger.info({
    type: 'auth',
    action,
    userId,
    success,
  });
};
```

**Usar en endpoints:**

```typescript
import logger, { logError, logAuth } from '@/lib/logger';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // ... lógica

    logger.info({
      type: 'motel_created',
      motelId: newMotel.id,
      userId: user.id,
    });

    return NextResponse.json(newMotel);
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/admin/motels',
      userId: user?.id,
    });

    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    logRequest('POST', '/api/admin/motels', duration, 200);
  }
}
```

---

### 4.3 Uptime Monitoring (2 horas)

**Configurar UptimeRobot (Free):**

1. Ir a https://uptimerobot.com
2. Crear cuenta gratuita
3. Agregar monitor:
   - Type: HTTP(s)
   - URL: https://tu-app.com/api/health
   - Interval: 5 minutos
   - Notificaciones: Email + SMS

**Crear endpoint de health check:**

**Archivo:** `web/jahatelo-web/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar DB
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

---

### 4.4 Alertas Críticas (2 horas)

**Configurar alertas en Sentry:**

1. Settings → Alerts
2. Crear alerta: "Error Rate Spike"
   - Condición: >10 errores en 1 minuto
   - Acción: Email + Slack

3. Crear alerta: "Performance Degradation"
   - Condición: P95 > 3 segundos
   - Acción: Email

**Script de alertas personalizadas:**

**Archivo:** `web/jahatelo-web/scripts/check-critical-metrics.js`

```javascript
// Ejecutar cada 5 minutos con cron
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCriticalMetrics() {
  try {
    // Verificar moteles pendientes >7 días
    const oldPending = await prisma.motel.count({
      where: {
        estado: 'PENDIENTE',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (oldPending > 5) {
      console.warn(`⚠️ ${oldPending} moteles pendientes por más de 7 días`);
      // Enviar alerta
    }

    // Verificar pagos vencidos
    const overduePayments = await prisma.payment.count({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
    });

    if (overduePayments > 10) {
      console.warn(`⚠️ ${overduePayments} pagos vencidos`);
      // Enviar alerta
    }

    console.log('✅ Critical metrics OK');
  } catch (error) {
    console.error('❌ Error checking metrics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCriticalMetrics();
```

---

## CHECKLIST DE VERIFICACIÓN

### Seguridad ✅
```
[ ] Rate limiting funcionando (verificar con cURL)
[ ] CORS permitiendo solo orígenes autorizados
[ ] Security headers presentes (verificar con securityheaders.com)
[ ] Inputs validados con Zod en 30+ endpoints
[ ] HTML sanitizado en campos de texto libre
[ ] HTTPS redirect funcionando
[ ] No hay secrets hardcoded (auditado con grep)
[ ] .env.example actualizado
```

### Testing ✅
```
[ ] Jest configurado y corriendo
[ ] 20+ unit tests pasando
[ ] 10+ integration tests pasando
[ ] 5+ E2E tests pasando
[ ] Cobertura >50% (verificar con npm run test:coverage)
[ ] Tests corriendo en CI (GitHub Actions)
```

### Monitoring ✅
```
[ ] Sentry configurado y recibiendo eventos
[ ] Logs estructurados implementados
[ ] UptimeRobot monitoreando /api/health
[ ] Alertas de Sentry configuradas
[ ] Health check endpoint funcionando
```

### Performance (Bonus)
```
[ ] Paginación implementada en admin
[ ] Imágenes optimizadas con Next/Image
[ ] CDN configurado (opcional)
[ ] Database indexes verificados
```

---

## COMANDOS ÚTILES

```bash
# Testing
npm run test              # Unit + integration tests
npm run test:coverage     # Con reporte de cobertura
npm run test:e2e          # E2E con Playwright
npm run test:watch        # Watch mode para desarrollo

# Linting y type checking
npm run lint              # ESLint
npm run type-check        # TypeScript check

# Build
npm run build             # Build de producción
npm run start             # Start producción

# Database
npx prisma migrate dev    # Aplicar migraciones
npx prisma generate       # Generar cliente
npx prisma studio         # DB GUI
```

---

## RECURSOS Y REFERENCIAS

### Documentación Oficial
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Zod Documentation](https://zod.dev)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Playwright E2E](https://playwright.dev/docs/intro)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

### Herramientas de Testing
- [SecurityHeaders.com](https://securityheaders.com) - Verificar headers
- [Mozilla Observatory](https://observatory.mozilla.org) - Audit de seguridad
- [OWASP ZAP](https://www.zaproxy.org) - Security testing
- [k6](https://k6.io) - Load testing

---

**Última actualización:** 13 de Enero 2026
**Tiempo total estimado:** 76 horas
**Prioridad:** 🔴 CRÍTICA

**Preparado para:** Equipo de Desarrollo Jahatelo
