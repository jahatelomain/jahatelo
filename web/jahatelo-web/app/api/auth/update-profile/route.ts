import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeObject } from '@/lib/sanitize';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = UpdateProfileSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de perfil inválidos' },
        { status: 400 }
      );
    }
    const { name, phone } = parsed.data;

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
