import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, motelId } = body;

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password no cumple requisitos', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Si se proporciona motelId, verificar que existe
    if (motelId) {
      const motel = await prisma.motel.findUnique({
        where: { id: motelId },
      });

      if (!motel) {
        return NextResponse.json(
          { error: 'Motel no encontrado' },
          { status: 404 }
        );
      }
    }

    // Hashear password
    const passwordHash = await hashPassword(password);

    // Crear usuario (por defecto USER, o MOTEL_ADMIN si tiene motelId)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name || null,
        role: motelId ? 'MOTEL_ADMIN' : 'USER',
        motelId: motelId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        motelId: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
