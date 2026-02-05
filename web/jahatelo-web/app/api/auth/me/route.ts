import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET() {
  try {
    EmptySchema.parse({});
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        modulePermissions: true,
        role: true,
        name: true,
        email: true,
        motelId: true,
        isEmailVerified: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        role: dbUser?.role || user.role,
        name: dbUser?.name || user.name,
        email: dbUser?.email || user.email,
        motelId: dbUser?.motelId || user.motelId,
        modulePermissions: dbUser?.modulePermissions ?? user.modulePermissions ?? [],
        isEmailVerified: dbUser?.isEmailVerified ?? (user as any).isEmailVerified ?? false,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Auth me error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ user: null }, { status: 400 });
    }
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
