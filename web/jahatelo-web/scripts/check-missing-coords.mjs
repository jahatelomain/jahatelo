import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const missing = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      name: true,
      mapUrl: true,
    },
  });

  console.log(`Moteles aprobados sin coordenadas: ${missing.length}`);
  missing.forEach((m) => {
    console.log(`- ${m.name} (${m.mapUrl || 'Sin mapUrl'})`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);