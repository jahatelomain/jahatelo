import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { RegisterSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { createEmailVerificationToken } from '@/lib/emailVerification';
import { sendEmail } from '@/lib/email';
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
        isEmailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isEmailVerified: true,
      },
    });

    // Enviar email de verificación (no bloquear el registro si falla)
    let emailVerificationSent = false;
    try {
      const token = await createEmailVerificationToken(user.email);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const verifyUrl = `${baseUrl}/api/auth/email/verify?token=${encodeURIComponent(token)}`;
      const subject = 'Verifica tu correo - Jahatelo';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Verifica tu correo</h2>
          <p>${user.name || 'Hola'}, gracias por registrarte en Jahatelo.</p>
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
      await sendEmail({ to: user.email, subject, html, text });
      emailVerificationSent = true;
    } catch (err) {
      console.error('Email verification send error:', err);
    }

    return NextResponse.json({ user, emailVerificationSent, autoLogin: false }, { status: 201 });
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
