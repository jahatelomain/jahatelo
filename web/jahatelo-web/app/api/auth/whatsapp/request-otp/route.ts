import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsappOtpRequestSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { generateOtpCode, hashOtp, isValidPhone, normalizePhone } from '@/lib/otp';
import { sendSmsOtp } from '@/lib/sms';
import { z } from 'zod';

const OTP_EXPIRY_MINUTES = 5;
const OTP_SEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = WhatsappOtpRequestSchema.parse(sanitized);
    if (!isValidPhone(validated.phone)) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }

    const phone = normalizePhone(validated.phone);
    const now = new Date();

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sentLastHour = await prisma.whatsappOtp.count({
      where: {
        phone,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (sentLastHour >= OTP_MAX_PER_HOUR) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de envíos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const latest = await prisma.whatsappOtp.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (latest?.lockedUntil && latest.lockedUntil > now) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (latest) {
      const diffSeconds = Math.floor((now.getTime() - latest.createdAt.getTime()) / 1000);
      if (diffSeconds < OTP_SEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { error: 'Espera antes de solicitar otro código.' },
          { status: 429, headers: { 'Retry-After': `${OTP_SEND_COOLDOWN_SECONDS - diffSeconds}` } }
        );
      }
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otpRecord = await prisma.whatsappOtp.create({
      data: {
        phone,
        codeHash,
        expiresAt,
        attempts: 0,
        lockedUntil: latest?.lockedUntil && latest.lockedUntil > now ? latest.lockedUntil : null,
      },
    });

    const sendResult = await sendSmsOtp(phone, code);
    if (!sendResult.ok) {
      await prisma.whatsappOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { error: sendResult.error || 'No se pudo enviar el OTP' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      ...(process.env.NODE_ENV === 'development' ? { debugCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error requesting SMS OTP:', error);
    return NextResponse.json(
      { error: 'Error al solicitar OTP' },
      { status: 500 }
    );
  }
}
