import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublicProspectSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = PublicProspectSchema.parse(sanitized);
    const { contactName, phone, email, motelName, channel } = validated;
    const finalChannel = channel || 'WEB';
    const contactEmail = email && email.trim() !== '' ? email.trim() : null;

    // Crear prospect
    const prospect = await prisma.motelProspect.create({
      data: {
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: contactEmail,
        motelName: motelName.trim(),
        channel: finalChannel,
      },
    });

    // Enviar emails en background (no bloquea la respuesta)
    const adminEmail = process.env.SMTP_USER || process.env.EMAIL_FROM_ADDRESS;
    if (adminEmail) {
      const emailPromises: Promise<void>[] = [];

      // Email al admin
      emailPromises.push(
        sendEmail({
          to: adminEmail,
          subject: `🏨 Nuevo prospect: ${motelName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #7c3aed; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Nuevo Prospect Registrado</h1>
              </div>
              <div style="background: #f8f7ff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Motel</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${motelName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contacto</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${contactName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Teléfono</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${phone}</td>
                  </tr>
                  ${contactEmail ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${contactEmail}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Canal</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${finalChannel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${new Date().toLocaleString('es-PY')}</td>
                  </tr>
                </table>
                <div style="margin-top: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com'}/admin/prospects"
                     style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Ver en el panel →
                  </a>
                </div>
              </div>
            </div>
          `,
          text: `Nuevo prospect: ${motelName} | Contacto: ${contactName} | Tel: ${phone}${contactEmail ? ` | Email: ${contactEmail}` : ''}`,
        }).catch(() => {}) // silencioso si falla
      );

      // Email de confirmación al prospect (si tiene email)
      if (contactEmail) {
        emailPromises.push(
          sendEmail({
            to: contactEmail,
            subject: '¡Recibimos tu solicitud! - Jahatelo',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7c3aed; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">¡Gracias, ${contactName}!</h1>
                </div>
                <div style="background: #f8f7ff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Recibimos tu solicitud para registrar <strong>${motelName}</strong> en Jahatelo.
                  </p>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Nuestro equipo se va a comunicar con vos al <strong>${phone}</strong>
                    a la brevedad posible para contarte todos los detalles.
                  </p>
                  <div style="margin-top: 32px; padding: 20px; background: #ede9fe; border-radius: 10px;">
                    <p style="color: #7c3aed; font-weight: 600; margin: 0; font-size: 14px;">
                      ¿Tenés alguna pregunta? Escribinos a info@jahatelo.com
                    </p>
                  </div>
                </div>
              </div>
            `,
            text: `Hola ${contactName}, recibimos tu solicitud para ${motelName}. Nos contactaremos pronto al ${phone}.`,
          }).catch(() => {}) // silencioso si falla
        );
      }

      // Ejecutar en background
      Promise.all(emailPromises).catch(() => {});
    }

    // SMS de alerta interna al admin
    const adminSmsPhone = process.env.ADMIN_SMS_PHONE;
    if (adminSmsPhone) {
      const smsMessage = `Nuevo prospect en Jahatelo: ${motelName} | Contacto: ${contactName} | Tel: ${phone}`;
      sendSms(adminSmsPhone, smsMessage).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: '¡Gracias por tus datos! Nos contactaremos en la brevedad posible.',
        prospect: {
          id: prospect.id,
          contactName: prospect.contactName,
          motelName: prospect.motelName,
          channel: prospect.channel,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error al crear prospect:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
