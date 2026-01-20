import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== TEST: Filtro de moteles por ciudad ===\n');

  // Simular el query que hace /motels/page.tsx
  const cityParam = 'Asunción';

  console.log(`1. Parámetro recibido: "${cityParam}"`);
  console.log(`2. URL encoded: "${encodeURIComponent(cityParam)}"`);

  // Test 1: Filtro con "contains" (como está en el código)
  const motelsWithContains = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { contains: cityParam, mode: 'insensitive' },
    },
    select: {
      name: true,
      city: true,
    },
  });

  console.log(`\n3. Moteles encontrados con "contains" (actual): ${motelsWithContains.length}`);
  motelsWithContains.forEach(m => {
    console.log(`   - ${m.name} | Ciudad: "${m.city}"`);
  });

  // Test 2: Filtro con "equals" para comparar
  const motelsWithEquals = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { equals: cityParam, mode: 'insensitive' },
    },
    select: {
      name: true,
      city: true,
    },
  });

  console.log(`\n4. Moteles encontrados con "equals": ${motelsWithEquals.length}`);
  motelsWithEquals.forEach(m => {
    console.log(`   - ${m.name} | Ciudad: "${m.city}"`);
  });

  // Test 3: Sin tilde
  const cityParamSinTilde = 'Asuncion';
  const motelsSinTilde = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { contains: cityParamSinTilde, mode: 'insensitive' },
    },
    select: {
      name: true,
      city: true,
    },
  });

  console.log(`\n5. Moteles encontrados con "Asuncion" (sin tilde): ${motelsSinTilde.length}`);

  // Test 4: Ver qué devuelve el API de ciudades
  console.log('\n6. Testing API de ciudades...');
  const citiesRaw = await prisma.motel.groupBy({
    by: ['city'],
    where: {
      status: 'APPROVED',
      isActive: true,
      city: {
        not: '',
      },
    },
    _count: {
      city: true,
    },
    orderBy: {
      city: 'asc',
    },
  });

  const aggregated = new Map();
  citiesRaw.forEach((item) => {
    const trimmed = (item.city || '').trim();
    if (!trimmed) return;
    aggregated.set(trimmed, (aggregated.get(trimmed) || 0) + item._count.city);
  });

  const cities = Array.from(aggregated.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('\n7. Ciudades devueltas por API:');
  cities.forEach(city => {
    console.log(`   - "${city.name}": ${city.count} moteles`);
  });

  // Test 5: Verificar caracteres especiales
  const asuncionCity = cities.find(c => c.name.toLowerCase().includes('asun'));
  if (asuncionCity) {
    console.log(`\n8. Análisis de caracteres en "${asuncionCity.name}":`);
    for (let i = 0; i < asuncionCity.name.length; i++) {
      const char = asuncionCity.name[i];
      const code = char.charCodeAt(0);
      console.log(`   [${i}] '${char}' = U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }

  console.log('\n=== FIN DEL TEST ===\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
