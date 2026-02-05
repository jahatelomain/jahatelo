import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsappOtpVerifySchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { hashOtp, isValidPhone, normalizePhone } from '@/lib/otp';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const OTP_LOCK_MINUTES = 15;
const OTP_MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = WhatsappOtpVerifySchema.parse(sanitized);
    if (!isValidPhone(validated.phone)) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }

    const phone = normalizePhone(validated.phone);
    const now = new Date();

    const otp = await prisma.whatsappOtp.findFirst({
      where: {
        phone,
        verifiedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      );
    }

    if (otp.lockedUntil && otp.lockedUntil > now) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + OTP_LOCK_MINUTES * 60 * 1000);
      await prisma.whatsappOtp.update({
        where: { id: otp.id },
        data: { lockedUntil },
      });
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const codeHash = hashOtp(validated.code);
    if (codeHash !== otp.codeHash) {
      const nextAttempts = otp.attempts + 1;
      const updates: { attempts: number; lockedUntil?: Date } = { attempts: nextAttempts };
      if (nextAttempts >= OTP_MAX_ATTEMPTS) {
        updates.lockedUntil = new Date(now.getTime() + OTP_LOCK_MINUTES * 60 * 1000);
      }
      await prisma.whatsappOtp.update({
        where: { id: otp.id },
        data: updates,
      });
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    await prisma.whatsappOtp.update({
      where: { id: otp.id },
      data: { verifiedAt: now },
    });

    const phoneNoPlus = phone.replace(/^\+/, '');
    const rawName = (sanitized as { name?: unknown }).name;
    const desiredName =
      typeof rawName === 'string' && rawName.trim().length >= 2
        ? rawName.trim()
        : null;
    const users = await prisma.user.findMany({
      where: {
        OR: [{ phone }, { phone: phoneNoPlus }],
      },
      select: { id: true, email: true, name: true, role: true, motelId: true, isActive: true, modulePermissions: true },
    });

    if (users.length > 1) {
      return NextResponse.json({ error: 'Hay múltiples cuentas con este teléfono' }, { status: 409 });
    }

    let user = users[0];
    if (!user) {
      const phoneDigits = phone.replace(/\D/g, '');
      const email = `${phoneDigits}@sms.jahatelo`;
      user = await prisma.user.create({
        data: {
          email,
          phone,
          name: desiredName,
          provider: 'sms',
          providerId: phoneDigits,
          role: 'USER',
          isActive: true,
          isEmailVerified: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          motelId: true,
          isActive: true,
          modulePermissions: true,
        },
      });
    } else if (desiredName && (!user.name || user.name.trim().length < 2)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: desiredName },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          motelId: true,
          isActive: true,
          modulePermissions: true,
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      motelId: user.motelId || undefined,
      name: user.name || undefined,
      modulePermissions: user.modulePermissions ?? [],
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error verifying SMS OTP:', error);
    return NextResponse.json(
      { error: 'Error al verificar OTP' },
      { status: 500 }
    );
  }
}
