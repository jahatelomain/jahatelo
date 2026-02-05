import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitize';
import { createEmailVerificationToken } from '@/lib/emailVerification';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const MobileRegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  provider: z.enum(['email', 'google', 'apple']).optional().default('email'),
  providerId: z.string().max(255).optional().nullable(),
});

/**
 * POST /api/mobile/auth/register
 *
 * Registro de nuevos usuarios móviles
 * Body: { email, password, name?, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = MobileRegisterSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de registro inválidos' },
        { status: 400 }
      );
    }
    const { email, password, name, phone, provider, providerId } = parsed.data;

    // Para registro con email, password es requerido
    if (provider === 'email' && !password) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const emailNormalized = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash del password (solo para registro con email)
    let passwordHash = null;
    if (provider === 'email' && password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        passwordHash,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        provider,
        providerId,
        role: 'USER',
        isEmailVerified: provider !== 'email', // OAuth users son verificados automáticamente
        isActive: true,
      },
    });

    // Crear preferencias de notificaciones por defecto
    await prisma.userNotificationPreferences.create({
      data: {
        userId: user.id,
      },
    });

    // Generar token JWT
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    // Enviar email de verificación si corresponde (no bloquear)
    let emailVerificationSent = false;
    if (provider === 'email') {
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
        console.error('Mobile email verification send error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      emailVerificationSent,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/mobile/auth/register:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
