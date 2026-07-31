import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const normalize = (value) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('es');
const clean = (value) => value.trim().replace(/\s+/g, ' ');

async function main() {
  const motels = await prisma.motel.findMany({ select: { country: true, city: true } });
  for (const motel of motels) {
    const countryName = clean(motel.country || 'Paraguay');
    const cityName = clean(motel.city || 'Sin ciudad');
    const country = await prisma.countryCatalog.upsert({
      where: { normalizedName: normalize(countryName) },
      update: {},
      create: { name: countryName, normalizedName: normalize(countryName) },
    });
    await prisma.cityCatalog.upsert({
      where: { countryId_normalizedName: { countryId: country.id, normalizedName: normalize(cityName) } },
      update: {},
      create: { countryId: country.id, name: cityName, normalizedName: normalize(cityName) },
    });
  }
  console.log(`Catálogo actualizado con ${motels.length} moteles.`);
}

main().finally(() => prisma.$disconnect());
