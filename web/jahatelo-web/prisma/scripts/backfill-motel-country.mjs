import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.motel.updateMany({
    where: {
      OR: [{ country: null }, { country: '' }],
    },
    data: {
      country: 'Paraguay',
    },
  });

  console.log(`Updated motels: ${result.count}`);
}

main()
  .catch((error) => {
    console.error('Error backfilling motel country:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
