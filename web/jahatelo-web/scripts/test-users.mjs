import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Admin123!';
const TEST_USERS = [
  {
    email: 'test-superadmin@jahatelo.com',
    name: 'Super Admin Test',
    role: 'SUPERADMIN',
  },
  {
    email: 'test-moteladmin-maximus@jahatelo.com',
    name: 'Admin Maximus Test',
    role: 'MOTEL_ADMIN',
    motelSlug: 'maximus-motel',
  },
  {
    email: 'test-moteladmin-pausa@jahatelo.com',
    name: 'Admin Pausa Test',
    role: 'MOTEL_ADMIN',
    motelSlug: 'pausa-motel',
  },
  {
    email: 'test-user1@jahatelo.com',
    name: 'Usuario Test 1',
    role: 'USER',
  },
  {
    email: 'test-user2@jahatelo.com',
    name: 'Usuario Test 2',
    role: 'USER',
  },
];

const getMotelIdBySlug = async (slug) => {
  if (!slug) return null;
  const motel = await prisma.motel.findFirst({ where: { slug } });
  if (!motel) {
    console.warn(`⚠️ Motel no encontrado para slug "${slug}". Se creara el usuario sin motelId.`);
    return null;
  }
  return motel.id;
};

const createTestUsers = async () => {
  console.log('🔧 Creando usuarios de prueba...');
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const user of TEST_USERS) {
    const motelId = await getMotelIdBySlug(user.motelSlug);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        motelId,
        isActive: true,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        motelId,
        isActive: true,
        passwordHash,
      },
    });
    console.log(`✅ ${user.role} ${user.email}`);
  }

  console.log('\n🔑 Credenciales de prueba (password: Admin123!):');
  TEST_USERS.forEach((user) => console.log(`- ${user.role} ${user.email}`));
};

const cleanupTestUsers = async () => {
  console.log('🧹 Eliminando usuarios de prueba...');
  const emails = TEST_USERS.map((user) => user.email);
  const result = await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });
  console.log(`✅ Usuarios eliminados: ${result.count}`);
};

const run = async () => {
  const mode = process.argv[2];
  if (!mode || !['create', 'cleanup'].includes(mode)) {
    console.error('Uso: node scripts/test-users.mjs create|cleanup');
    process.exit(1);
  }

  if (mode === 'create') {
    await createTestUsers();
  } else {
    await cleanupTestUsers();
  }
};

run()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
