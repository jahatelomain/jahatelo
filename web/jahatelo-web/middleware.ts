import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas /admin (excepto /admin/login)
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

  // Permitir todas las demás rutas
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
