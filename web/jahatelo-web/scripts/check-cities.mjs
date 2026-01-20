import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all distinct cities with count
  const motels = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
    },
    select: {
      city: true,
      name: true,
    },
  });

  console.log('\n=== Todos los moteles APROBADOS y ACTIVOS ===');
  console.log(`Total: ${motels.length}`);

  // Group by city
  const cities = {};
  motels.forEach(motel => {
    if (!cities[motel.city]) {
      cities[motel.city] = [];
    }
    cities[motel.city].push(motel.name);
  });

  console.log('\n=== Moteles por ciudad ===');
  Object.keys(cities).sort().forEach(city => {
    console.log(`\n${city} (${cities[city].length} moteles):`);
    cities[city].forEach(name => {
      console.log(`  - ${name}`);
    });
  });

  // Check for "Asuncion" variations
  console.log('\n=== Buscando variaciones de Asunción ===');
  const asuncionVariations = await prisma.motel.findMany({
    where: {
      city: {
        contains: 'asun',
        mode: 'insensitive',
      },
    },
    select: {
      name: true,
      city: true,
      status: true,
      isActive: true,
    },
  });

  console.log(`Encontrados ${asuncionVariations.length} moteles con "asun" en ciudad:`);
  asuncionVariations.forEach(motel => {
    console.log(`  - ${motel.name} | Ciudad: "${motel.city}" | Status: ${motel.status} | Active: ${motel.isActive}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
