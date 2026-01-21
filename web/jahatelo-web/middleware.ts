import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Rate limiting storage (in-memory para edge runtime)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// CORS allowed origins
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'exp://localhost:8081', // Expo dev
  'http://localhost:8081', // Expo dev
  'http://localhost:19000', // Expo web
  'http://localhost:19006', // Expo web alternative
];

/**
 * Rate limiting function
 * @param ip - IP address
 * @param limit - Max requests
 * @param windowMs - Time window in milliseconds
 */
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

// Limpiar cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const origin = request.headers.get('origin');

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

  // 2.1. Health check sin rate limiting
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // 3. Rate Limiting para autenticación
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    if (process.env.E2E_MODE === '1') {
      return NextResponse.next();
    }
    const { success, remaining } = rateLimit(ip, 5, 15 * 60 * 1000); // 5 requests per 15 min

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
    const { success, remaining } = rateLimit(ip, 30, 60 * 1000); // 30 requests per minute

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
    const { success, remaining } = rateLimit(ip, 20, 60 * 60 * 1000); // 20 uploads per hour

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
    '/admin/:path*',
    '/api/:path*',
    '/perfil/:path*',
    '/mis-favoritos/:path*',
  ],
};
