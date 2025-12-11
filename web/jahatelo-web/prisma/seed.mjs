import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const motelsData = [
  {
    name: 'Maximus Motel',
    city: 'Mariano Roque Alonso',
    address: 'Ruta 3, Gral. Elizardo Aquino',
    phones: '+595985597167, +59521760573-5',
    rooms: 'Suite Presidencial, Master Suite, Junior Suite',
    amenities: 'Piscina climatizada, Jacuzzi, Sillón de masajes, Cama de agua, Garaje privado',
  },
  {
    name: 'Pausa Motel',
    city: 'Mariano Roque Alonso',
    address: 'Ruta 3 - Km 14',
    phones: '+595991742852',
    rooms: 'Suite Ejecutiva, Suite Presidencial, Habitaciones Temáticas',
    amenities: 'Jacuzzi, Sauna, Garaje privado',
  },
  {
    name: 'The One Motel',
    city: 'Mariano Roque Alonso',
    address: 'Ruta 3 Gral. Elizardo Aquino',
    phones: '+59521752235, +595983444064',
    rooms: 'Habitación Básica, Suite de Lujo',
    amenities: 'Ambientación moderna, Garaje privado',
  },
  {
    name: 'Motel First Class',
    city: 'Mariano Roque Alonso',
    phones: '+595991208042, +59521753383',
  },
  {
    name: 'Motel Deluxe by Encuentros',
    city: 'Asunción',
    address: 'Avda. Eusebio Ayala 4118',
    phones: '+59521905529',
    rooms: 'Deluxe Plus, Premium, Presidencial',
    amenities: 'Jacuzzi, Pantalla grande, Garaje privado',
  },
  {
    name: 'Sunset Motel Boutique',
    city: 'Asunción',
    address: 'Mcal. Estigarribia c/ Cap. Bado',
    phones: '+59521909070',
    rooms: 'Suite Básica, Habitación VIP',
    amenities: 'Diseño Boutique, Garaje privado',
  },
  {
    name: 'Motel 007',
    city: 'Asunción',
    phones: '+59521200069',
  },
  {
    name: 'Motel Chocolate',
    city: 'Asunción',
    phones: '+59521909202',
  },
  {
    name: 'Container Inn',
    city: 'Asunción',
    phones: '+595981451456',
  },
  {
    name: 'B-INN Motel',
    city: 'Asunción',
    phones: '+595994606969',
  },
  {
    name: 'Platinum Motel',
    city: 'Fernando de la Mora',
    neighborhood: 'Zona Norte',
    address: 'Cerca de la UNA',
    phones: '+595984444579, +59521680494-5',
    rooms: 'Suite Presidencial, Suite Master, Suite Platinum',
    amenities: 'Jacuzzi, Cama de agua, Sauna, Garaje privado',
  },
  {
    name: 'Motel Studio A',
    city: 'Fernando de la Mora',
    phones: '+59521680936, +59521674257',
  },
  {
    name: 'Motel Crucero del Amor',
    city: 'San Lorenzo',
    address: 'Ruta Mcal. Estigarribia 2390',
    phones: '+59521570300, +595983802486',
    amenities: 'Garaje privado',
  },
  {
    name: 'Motel Del Rey',
    city: 'San Lorenzo',
    phones: '+59521582040',
  },
  {
    name: 'Motel Le Barón',
    city: 'San Lorenzo',
    phones: '+59521505754',
  },
  {
    name: 'Motel Cascavel',
    city: 'San Lorenzo',
    phones: '+59521510058',
  },
  {
    name: 'Motel Cascada',
    city: 'San Lorenzo',
    phones: '+59521590209',
  },
  {
    name: 'Delirium New Motel',
    city: 'San Lorenzo',
    phones: '+59521580353',
  },
  {
    name: 'Motel La Isla',
    city: 'Lambaré',
    phones: '+59521900824',
  },
  {
    name: "Il Palazzo de los Koko's Motel",
    city: 'Lambaré',
    phones: '+59521920623',
  },
  {
    name: 'Motel Cataratas',
    city: 'Ciudad del Este',
    address: 'Ruta Internacional N°7 - Km 8 1/2 Lado Monday',
    phones: '+59561575472-4, +595983680815',
    amenities: 'Garaje privado',
  },
  {
    name: 'Motel Samoa',
    city: 'Ciudad del Este',
    neighborhood: 'Barrio San Miguel',
    address: 'Avda. Carlos A. López',
    phones: '+59561500651, +59561514913, +59561566667',
  },
  {
    name: 'Afrodita Motel',
    city: 'Ciudad del Este',
    address: 'Km 6,5 a 2 cuadras de la Ruta Internacional',
    phones: '+59561574586',
  },
  {
    name: 'Motel Los Leones',
    city: 'Ciudad del Este',
    neighborhood: 'Barrio Che La Reina',
    phones: '+59561572998',
  },
  {
    name: 'Motel Las Palmeras',
    city: 'Ciudad del Este',
    address: 'Km 7',
    phones: '+59561577221',
  },
  {
    name: 'Melos Motel',
    city: 'Ciudad del Este',
    address: 'Km 6,5 a una cuadra de la Ruta Internacional',
    phones: '+59561574178',
  },
  {
    name: 'Motel Oasis',
    city: 'Presidente Franco',
    address: 'Supercarretera Area 5',
    phones: '+59561551277, +59561550304',
  },
  {
    name: 'Motel París',
    city: 'Presidente Franco',
    phones: '+595982442681, +595983100508',
  },
  {
    name: 'Motel New HAWAI',
    city: 'Presidente Franco',
    phones: '+595992278519',
  },
  {
    name: 'Asiduo Motel',
    city: 'Minga Guazú',
    address: 'Km 13 a 1 cuadra de la Ruta Internacional N°7',
    phones: '+59561583400, +595993518382',
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const cleanList = (value) =>
  value
    ? value
        .split(',')
        .map((item) => item.replace(/\(.*?\)/g, '').trim())
        .filter(Boolean)
    : [];

const getPhoneInfo = (value) => {
  const numbers = cleanList(value);
  return {
    phone: numbers[0] ?? null,
    whatsapp: numbers[1] ?? numbers[0] ?? null,
  };
};

async function main() {
  console.log('🌱 Iniciando seed para moteles de Paraguay...');

  await prisma.photo.deleteMany();
  await prisma.roomAmenity.deleteMany();
  await prisma.motelAmenity.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.socialLink.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.motel.deleteMany();

  const amenitiesSet = new Set();
  motelsData.forEach((motel) => {
    cleanList(motel.amenities).forEach((amenity) => amenitiesSet.add(amenity));
  });

  const amenitiesMap = new Map();
  for (const amenity of amenitiesSet) {
    const record = await prisma.amenity.create({
      data: {
        name: amenity,
        type: 'BOTH',
      },
    });
    amenitiesMap.set(amenity, record.id);
  }

  let index = 0;
  for (const motelData of motelsData) {
    const slug = slugify(motelData.name);
    const { phone, whatsapp } = getPhoneInfo(motelData.phones);

    const motel = await prisma.motel.create({
      data: {
        name: motelData.name,
        slug,
        description: `Motel ${motelData.name} ubicado en ${motelData.city}, Paraguay.`,
        city: motelData.city,
        neighborhood: motelData.neighborhood || motelData.city,
        address:
          motelData.address && motelData.address !== '(No especificada)'
            ? motelData.address
            : 'Dirección no especificada',
        mapUrl: null,
        latitude: null,
        longitude: null,
        phone,
        whatsapp,
        website: null,
        instagram: null,
        status: 'APPROVED',
        isActive: true,
        contactName: 'Jahatelo',
        contactEmail: null,
        contactPhone: phone,
        plan: null,
        isFeatured: index < 6,
        ratingAvg: 0,
        ratingCount: 0,
        photos: {
          create: [
            {
              url: `https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1200&q=80&sig=${index}`,
              kind: 'FACADE',
              order: 1,
            },
            {
              url: `https://images.unsplash.com/photo-1505692794400-5e41bc8c87d5?auto=format&fit=crop&w=1200&q=80&sig=${index + 100}`,
              kind: 'ROOM',
              order: 2,
            },
          ],
        },
      },
    });

    const motelAmenities = cleanList(motelData.amenities);
    if (motelAmenities.length > 0) {
      await prisma.motelAmenity.createMany({
        data: motelAmenities
          .map((amenity) => amenitiesMap.get(amenity))
          .filter(Boolean)
          .map((amenityId) => ({
            motelId: motel.id,
            amenityId,
          })),
      });
    }

    const roomNames = cleanList(motelData.rooms);
    const roomsToCreate = roomNames.length > 0 ? roomNames : ['Suite Estándar'];

    for (const [roomIndex, roomName] of roomsToCreate.entries()) {
      await prisma.roomType.create({
        data: {
          motelId: motel.id,
          name: roomName,
          slug: slugify(`${slug}-${roomName}-${roomIndex}`),
          description: `Habitación disponible en ${motelData.name}.`,
          basePrice: null,
          priceLabel: motelData.prices || 'Consultar tarifas',
          isActive: true,
          photos: {
            create: [
              {
                url: `https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80&sig=${index + roomIndex}`,
                kind: 'ROOM',
                order: 1,
              },
            ],
          },
        },
      });
    }

    index += 1;
    console.log(`✅ ${motelData.name} creado`);
  }

  console.log(`\n🌟 Seed completado: ${motelsData.length} moteles registrados`);
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
