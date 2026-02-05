import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createEmailVerificationToken } from '@/lib/emailVerification';
import { sendEmail } from '@/lib/email';
import { sanitizeObject } from '@/lib/sanitize';

const RequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = RequestSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isEmailVerified: true },
    });

    // No revelar si existe o no; respuesta siempre exitosa
    if (!user || user.isEmailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = await createEmailVerificationToken(email);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const verifyUrl = `${baseUrl}/api/auth/email/verify?token=${encodeURIComponent(token)}`;

    const name = user.name || 'Hola';
    const subject = 'Verifica tu correo - Jahatelo';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Verifica tu correo</h2>
        <p>${name}, gracias por registrarte en Jahatelo.</p>
        <p>Para activar tu cuenta, hacé clic en el siguiente botón:</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
            Verificar correo
          </a>
        </p>
        <p>Si no solicitaste esto, podés ignorar este mensaje.</p>
      </div>
    `;
    const text = `Verifica tu correo: ${verifyUrl}`;

    await sendEmail({ to: email, subject, html, text });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email verification request error:', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el correo' },
      { status: 500 }
    );
  }
}
