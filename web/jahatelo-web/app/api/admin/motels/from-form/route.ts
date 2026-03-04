import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/utils/coordinates';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils';

// Schema de validación para el formulario completo
const RoomFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  pricePerHour: z.string().min(1, 'Precio requerido'),
  additionalPrice: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()),
  otherAmenity: z.string().optional(),
});

const PromoFormSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  discount: z.string().optional(),
  validUntil: z.string().optional(),
  applicableDays: z.string().optional(),
});

const MotelFormSchema = z.object({
  // Datos básicos
  name: z.string().min(1, 'Nombre del motel requerido'),
  contactName: z.string().min(1, 'Nombre del contacto requerido'),
  contactPosition: z.string().optional(),

  // Contacto
  phone: z.string().min(1, 'Teléfono requerido'),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),

  // Ubicación
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  neighborhood: z.string().optional(),
  reference: z.string().optional(),
  googleMapsUrl: z.string().url('URL de Google Maps inválida'),

  // Operación
  scheduleWeekdays: z.string().optional(),
  scheduleSaturday: z.string().optional(),
  scheduleSunday: z.string().optional(),
  is24Hours: z.boolean().optional(),

  // Descripción
  description: z.string().min(10, 'Descripción muy corta (mínimo 10 caracteres)'),

  // Habitaciones
  rooms: z.array(RoomFormSchema).min(1, 'Debe haber al menos 1 habitación'),

  // Promociones
  promos: z.array(PromoFormSchema).optional(),

  // Plan
  plan: z.enum(['BASIC', 'GOLD', 'DIAMOND']),

  // Pago
  paymentMethod: z.enum(['transfer', 'card']),
  paymentFrequency: z.enum(['monthly', 'quarterly']),
  ruc: z.string().optional(),
  businessName: z.string().optional(),
  fiscalAddress: z.string().optional(),
});

/**
 * POST /api/admin/motels/from-form
 * Crea un motel completo desde el formulario de captura
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    if (!user || (user.role !== 'MOTEL_ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Parsear y validar datos
    const body = await request.json();
    const validated = MotelFormSchema.parse(body);

    // 3. Extraer coordenadas del Google Maps URL
    const coordinates = extractCoordinatesFromGoogleMapsUrl(validated.googleMapsUrl);

    if (!coordinates) {
      return NextResponse.json(
        { error: 'No se pudieron extraer coordenadas del link de Google Maps' },
        { status: 400 }
      );
    }

    // 4. Generar slug único
    const baseSlug = generateSlug(validated.name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.motel.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 5. Construir horarios
    const schedule = [
      validated.scheduleWeekdays ? `Lunes a Viernes: ${validated.scheduleWeekdays}` : null,
      validated.scheduleSaturday ? `Sábados: ${validated.scheduleSaturday}` : null,
      validated.scheduleSunday ? `Domingos: ${validated.scheduleSunday}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    // 6. Crear motel en la DB
    const motel = await prisma.motel.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        address: validated.address,
        city: validated.city,
        neighborhood: validated.neighborhood || null,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        phone: validated.phone,
        whatsapp: validated.whatsapp || null,
        instagram: validated.instagram || null,
        facebook: validated.facebook || null,
        email: validated.email || null,
        schedule: schedule || '24 horas',
        plan: validated.plan as 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND',
        status: 'PENDING', // Por defecto PENDING hasta que sea aprobado
        isFeatured: validated.plan === 'GOLD' || validated.plan === 'DIAMOND',
        amenities: [],
      },
    });

    // 7. Crear habitaciones
    for (const room of validated.rooms) {
      await prisma.roomType.create({
        data: {
          motelId: motel.id,
          name: room.name,
          description: room.description || null,
          pricePerHour: parseFloat(room.pricePerHour.replace(/[^\d.]/g, '')),
          amenities: [
            ...room.amenities,
            room.otherAmenity,
          ].filter(Boolean) as string[],
        },
      });
    }

    // 8. Crear promociones (si hay)
    if (validated.promos && validated.promos.length > 0) {
      for (const promo of validated.promos) {
        await prisma.promo.create({
          data: {
            motelId: motel.id,
            title: promo.title,
            description: promo.description,
            discountPercentage: promo.discount ? parseInt(promo.discount) : null,
            validUntil: promo.validUntil ? new Date(promo.validUntil) : null,
            isActive: true,
          },
        });
      }
    }

    // 9. Registrar información de pago (en metadata o tabla separada si existe)
    // Por ahora lo guardamos en un campo JSON o tabla relacionada
    // Esto depende de tu schema actual

    // 10. Retornar motel creado
    return NextResponse.json({
      success: true,
      motel: {
        id: motel.id,
        slug: motel.slug,
        name: motel.name,
      },
      message: 'Motel creado exitosamente. Ahora puedes agregar fotos desde el perfil del motel.',
    });
  } catch (error) {
    console.error('Error creating motel from form:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear motel' },
      { status: 500 }
    );
  }
}
