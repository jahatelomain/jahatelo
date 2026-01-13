import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { LoginSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const body = await request.json();

    // Validación con Zod
    const validated = LoginSchema.parse(body);
    const { email, password } = validated;

    // Buscar usuario activo
    const normalizedEmail = email.toLowerCase().trim();
    if (isDev) console.log('[LOGIN] Attempt:', normalizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (isDev) console.log('[LOGIN] User found?', !!user, 'isActive?', user?.isActive);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (isDev) console.log('[LOGIN] Password valid?', isValid);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Crear JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      motelId: user.motelId || undefined,
      name: user.name || undefined,
      modulePermissions: user.modulePermissions ?? [],
    });

    // Setear cookie httpOnly
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    // Retornar payload (sin password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        motelId: user.motelId,
        modulePermissions: user.modulePermissions ?? [],
      },
    });
  } catch (error) {
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error al procesar login' },
      { status: 500 }
    );
  }
}
