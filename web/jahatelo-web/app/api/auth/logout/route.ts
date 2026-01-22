import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function POST() {
  try {
    EmptySchema.parse({});
    const cookieStore = await cookies();

    // Eliminar cookie de autenticación
    cookieStore.delete('auth_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
