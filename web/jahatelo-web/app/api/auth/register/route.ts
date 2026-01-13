import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { RegisterSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación con Zod (ya incluye validación de password fuerte)
    const validated = RegisterSchema.parse(body);
    const { email, password, name, telefono, phone } = validated;

    // Sanitizar nombre
    const sanitizedName = name ? sanitizeText(name) : null;

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

    // Hashear password
    const passwordHash = await hashPassword(password);

    // Crear usuario (por defecto USER)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: sanitizedName,
        phone: telefono || phone || null,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
