import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { isUpstashEnabled, rateLimitUpstash } from './lib/rateLimit';

// Rate limiting storage (in-memory fallback para edge runtime)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// CORS allowed origins
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ...(vercelUrl ? [vercelUrl] : []),
  'exp://localhost:8081', // Expo dev
  'http://localhost:8081', // Expo dev
  'http://localhost:19000', // Expo web
  'http://localhost:19006', // Expo web alternative
];

const csrfSafeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const isSameOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const requestOrigin = request.nextUrl.origin;
  if (origin && origin === requestOrigin) return true;
  if (origin && allowedOrigins.includes(origin)) return true;
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (refOrigin === requestOrigin) return true;
      return allowedOrigins.includes(refOrigin);
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Rate limiting function
 * @param ip - IP address
 * @param limit - Max requests
 * @param windowMs - Time window in milliseconds
 */
function rateLimitInMemory(
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

/**
 * Limpiar registros expirados periódicamente
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

// Limpiar cada 5 minutos solo si usamos fallback en memoria
if (typeof setInterval !== 'undefined' && !isUpstashEnabled()) {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

async function applyRateLimit(
  scope: string,
  ip: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  const identifier = `${scope}:${ip}`;
  if (isUpstashEnabled()) {
    return rateLimitUpstash(identifier, limit, windowMs);
  }
  return rateLimitInMemory(ip, limit, windowMs);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || '';

  // 0. Optional basic auth gate for staging/public preview hosts
  const stagingGateEnabled = process.env.STAGING_GATE_ENABLED === '1';
  const stagingGatePass = process.env.STAGING_GATE_PASSWORD;
  const stagingGateHosts = (process.env.STAGING_GATE_HOSTS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const hostNormalized = host.toLowerCase();
  const hostnameNormalized = request.nextUrl.hostname.toLowerCase();
  const isStagingHost =
    stagingGateHosts.length > 0
      ? stagingGateHosts.some(
          (h) =>
            hostNormalized === h ||
            hostNormalized.endsWith(`.${h}`) ||
            hostnameNormalized === h ||
            hostnameNormalized.endsWith(`.${h}`)
        )
      : false;
  const isPreviewEnv = process.env.VERCEL_ENV === 'preview';
  const shouldApplyStagingGate =
    stagingGateEnabled && !!stagingGatePass && (isPreviewEnv || isStagingHost);

  if (shouldApplyStagingGate) {
    const authHeader = request.headers.get('authorization') || '';
    const expected = `Basic ${btoa(`staging:${stagingGatePass}`)}`;
    if (authHeader !== expected) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm=\"Staging\"',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  // 1. HTTPS Redirect en producción
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${pathname}${request.nextUrl.search}`,
      301
    );
  }

  // 2. CORS Preflight (OPTIONS)
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

  // 2.0 CSRF protection for cookie-based web/admin requests
  if (
    pathname.startsWith('/api/') &&
    !csrfSafeMethods.has(request.method) &&
    !pathname.startsWith('/api/auth/email/') &&
    !pathname.startsWith('/api/mobile/') &&
    !pathname.startsWith('/api/public/') &&
    !pathname.startsWith('/api/cron/') &&
    !pathname.startsWith('/api/health')
  ) {
    const hasAuthHeader = Boolean(request.headers.get('authorization'));
    if (!hasAuthHeader && !isSameOrigin(request)) {
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
  }

  // 2.1. Health check sin rate limiting
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // 2.2. Chequeo de versión mínima para requests de la app móvil
  const MIN_APP_VERSION = process.env.MIN_APP_VERSION || '1.0.0';
  if (pathname.startsWith('/api/mobile/')) {
    const appVersion = request.headers.get('x-app-version');
    if (appVersion && appVersion !== 'dev') {
      const parseVersion = (v: string) => v.split('.').map(Number);
      const [maj, min, patch] = parseVersion(appVersion);
      const [minMaj, minMin, minPatch] = parseVersion(MIN_APP_VERSION);
      const isOutdated =
        maj < minMaj ||
        (maj === minMaj && min < minMin) ||
        (maj === minMaj && min === minMin && patch < minPatch);
      if (isOutdated) {
        return NextResponse.json(
          {
            error: 'Versión de app desactualizada. Por favor actualizá la aplicación.',
            minVersion: MIN_APP_VERSION,
            currentVersion: appVersion,
          },
          { status: 426 }
        );
      }
    }
  }

  // 3. Rate Limiting para autenticación (login, register y OTP WhatsApp)
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/auth/whatsapp/request-otp') ||
    pathname.startsWith('/api/mobile/auth/whatsapp/request-otp')
  ) {
    if (process.env.E2E_MODE === '1') {
      return NextResponse.next();
    }
    const { success, remaining } = await applyRateLimit('auth', ip, 5, 15 * 60 * 1000); // 5 requests per 15 min

    if (!success) {
      return NextResponse.json(
        { error: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.' },
        {
          status: 429,
          headers: {
            'Retry-After': '900',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());

    // CORS para API
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // 4. Rate Limiting para API pública (no admin)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
    if (process.env.E2E_MODE === '1') {
      return NextResponse.next();
    }
    const { success, remaining } = await applyRateLimit('api', ip, 30, 60 * 1000); // 30 requests per minute

    if (!success) {
      return NextResponse.json(
        { error: 'Límite de API excedido. Intenta nuevamente en 1 minuto.' },
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

    // CORS para API
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // 5. Rate Limiting para uploads
  if (pathname.startsWith('/api/upload')) {
    if (process.env.E2E_MODE === '1') {
      return NextResponse.next();
    }
    const { success, remaining } = await applyRateLimit('upload', ip, 20, 60 * 60 * 1000); // 20 uploads per hour

    if (!success) {
      return NextResponse.json(
        { error: 'Límite de uploads excedido. Intenta nuevamente en 1 hora.' },
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

  // 6. Protección de rutas /admin (autenticación)
  if (pathname.startsWith('/admin')) {
    // Permitir acceso a la página de login sin autenticación
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Obtener token de la cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // No hay sesión → redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar token
    const user = await verifyToken(token);

    if (!user) {
      // Token inválido → redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Usuario autenticado - validar permisos según rol
    if (user.role === 'SUPERADMIN') {
      // SUPERADMIN tiene acceso a todo
      return NextResponse.next();
    }

    if (user.role === 'MOTEL_ADMIN') {
      // MOTEL_ADMIN solo puede acceder a rutas de su propio motel
      // Por ahora permitimos acceso general al admin
      // TODO: Implementar validación por motelId en rutas específicas
      return NextResponse.next();
    }

    // Rol USER no tiene acceso al admin
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 7. Protección de rutas de usuario autenticado
  const protectedUserRoutes = ['/perfil', '/mis-favoritos'];
  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    // Obtener token de la cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // No hay sesión → redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar token
    const user = await verifyToken(token);

    if (!user) {
      // Token inválido → redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Usuario autenticado - permitir acceso
    return NextResponse.next();
  }

  // 8. CORS para API responses
  const response = NextResponse.next();
  if (origin && allowedOrigins.includes(origin) && pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
