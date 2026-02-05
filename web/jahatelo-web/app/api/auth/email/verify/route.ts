import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmailVerificationToken } from '@/lib/emailVerification';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL('/login?verified=0', baseUrl));
  }

  const email = await verifyEmailVerificationToken(token);
  if (!email) {
    return NextResponse.redirect(new URL('/login?verified=0', baseUrl));
  }

  try {
    await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
  } catch (error) {
    console.error('Email verification update error:', error);
    return NextResponse.redirect(new URL('/login?verified=0', baseUrl));
  }

  return NextResponse.redirect(new URL('/login?verified=1', baseUrl));
}
