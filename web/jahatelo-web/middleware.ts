import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PATHS = ['/admin', '/api/admin'];
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/whatsapp/request-otp', '/api/auth/whatsapp/verify-otp', '/api/auth/email/request-verification'];
const PUBLIC_API_PATHS = ['/api/health', '/api/contact', '/api/prospects', '/api/advertisements', '/api/mobile'];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p);
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Admin routes require auth token cookie
  if (isAdminPath(pathname)) {
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rate limit headers for auth endpoints (informational; real limiting is in lib/authRateLimit)
  if (isAuthPath(pathname)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  // Public API paths get CORS-safe headers
  if (isPublicApiPath(pathname)) {
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }

  // Mobile API: explicit CORS for app requests (fixes CSRF-like rejections from proxies/WAFs)
  if (pathname.startsWith('/api/mobile/')) {
    const origin = request.headers.get('origin') || '*';
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/:path*',
    '/api/health',
    '/api/contact',
    '/api/prospects',
    '/api/advertisements',
    '/api/mobile/:path*',
  ],
};