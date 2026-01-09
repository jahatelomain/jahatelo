import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Nota: Instalar dependencias con: npm install jose bcryptjs @types/bcryptjs

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface UserPayload extends JWTPayload {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
  motelId?: string;
  name?: string;
  modulePermissions?: string[];
}

/**
 * Crea un JWT token para el usuario
 */
export async function createToken(payload: UserPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 días
    .sign(secret);
}

/**
 * Verifica y decodifica un JWT token
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserPayload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Obtiene el usuario actual desde las cookies
 */
export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  return await verifyToken(token);
}

/**
 * Obtiene el token desde el request
 */
export async function getTokenFromRequest(
  request: NextRequest
): Promise<string | null> {
  // Intenta obtener de cookie
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;

  // Intenta obtener de header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(
  user: UserPayload | null,
  roles: Array<'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER'>
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Verifica si el usuario puede acceder a un motel específico
 */
export function canAccessMotel(
  user: UserPayload | null,
  motelId: string
): boolean {
  if (!user) return false;
  if (user.role === 'SUPERADMIN') return true;
  if (user.role === 'MOTEL_ADMIN' && user.motelId === motelId) return true;
  return false;
}
