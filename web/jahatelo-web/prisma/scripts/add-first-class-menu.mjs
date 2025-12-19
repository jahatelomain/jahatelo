import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), 'web/jahatelo-web/.env') });

const prisma = new PrismaClient();

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const menuData = [
  {
    name: 'Ensaladas',
    items: [
      {
        name: 'Ensalada Cesar con Pollo',
        description: 'Lechuga, pollo, panceta, queso y pan',
        price: 35000,
      },
      {
        name: 'Ensalada de Lechuga & Atún',
        description: 'Lechuga, tomate, cebolla roja, huevos de codorniz y atún',
        price: 20000,
      },
      {
        name: 'Ensalada de Rúcula',
        description: 'Rúcula, zanahoria, jamón crudo y queso',
        price: 20000,
      },
    ],
  },
  {
    name: 'Para compartir',
    items: [
      {
        name: 'Picada Mexica',
        description: 'Mix de burritos, quesadillas y nachos',
        price: 35000,
      },
      {
        name: 'Huevos Rotos',
        description: 'Papas con jamón crudo y huevo frito',
        price: 25000,
      },
      {
        name: 'Papas Bravas',
        description: 'Papas fritas con salsa picante especial',
        price: 20000,
      },
      {
        name: 'Papas Fritas con Cheddar',
        description: 'Papas fritas con cheddar y panceta',
        price: 20000,
      },
      {
        name: 'Mandioca Frita con Muzzarela',
        description: 'Mandiocas fritas con cheddar y panceta',
        price: 12000,
      },
    ],
  },
  {
    name: 'Postres',
    items: [
      { name: 'Brownie & Helado', description: 'Brownie tibio con helado', price: 15000 },
      { name: 'Torta Tres Leches', description: 'Porción de torta tres leches', price: 15000 },
      { name: 'Creppe DDL & Banana', description: 'Crepe con dulce de leche y banana', price: 15000 },
      { name: 'Frutas & Helado', description: 'Frutas frescas con helado', price: 15000 },
      { name: 'Helado & Obleas', description: 'Helado acompañado de obleas', price: 15000 },
    ],
  },
  {
    name: 'Carnes',
    items: [
      { name: 'Pechuga Romana', description: 'Pechuga frita marinada', price: 30000 },
      { name: 'Mila de Pollo al Panko', description: 'Milanesa de pollo apanada en panko', price: 35000 },
      { name: 'Cazuela de Pollo Gratinado', description: 'Pollo gratinado', price: 38000 },
      {
        name: 'Pollo a la Singara',
        description: 'Salteado de pollo con jamón crudo, cebolla y crema con ensalada',
        price: 30000,
      },
      { name: 'Mila de Carne al Panko', description: 'Milanesa de carne al panko', price: 42000 },
      {
        name: 'Gran Sandwich de Lomito',
        description: 'Roquefort, muzzarella, lechuga, tomate, panceta y huevo',
        price: 48000,
      },
      { name: 'Salteado Oriental', description: 'Carne, verduras y arroz', price: 40000 },
      {
        name: 'Hamburguesa XL',
        description: 'Tomate, lechuga, cheddar, cebolla caramelizada, panceta y huevo frito',
        price: 45000,
      },
    ],
  },
  {
    name: 'Desayunos',
    items: [
      { name: 'Base', description: 'Café, jugo, croissant de jamón y queso, tostadas', price: 35000 },
      {
        name: 'Intermedio',
        description: 'Café, jugo, croissant, tostadas, frutas de estación y medialunas',
        price: 44000,
      },
      {
        name: 'Completo',
        description: 'Café, jugo, croissant, tostadas, frutas, medialunas y huevo revuelto',
        price: 50000,
      },
    ],
  },
  {
    name: 'Entradas',
    items: [
      { name: 'Empanadas', description: 'Trío de carne, pollo y queso', price: 30000 },
      {
        name: 'Papas Rellenas',
        description: 'Trío de papas rellenas con panceta, chorizo y cebolla',
        price: 25000,
      },
      { name: 'Hamburguesitas', description: 'Mini hamburguesas', price: 35000 },
    ],
  },
  {
    name: 'Pescados',
    items: [
      { name: 'Mila de Surubí al Panko', description: 'Acompañado con papas fritas o ensalada fresca', price: 45000 },
      { name: 'Cazuela de Surubí Gratinado', description: 'Acompañado con papas fritas o ensalada fresca', price: 60000 },
    ],
  },
];

async function main() {
  const motel = await prisma.motel.findFirst({ where: { slug: 'motel-first-class' } });

  if (!motel) {
    throw new Error('No se encontró el motel "Motel First Class"');
  }

  await prisma.menuCategory.deleteMany({ where: { motelId: motel.id } });

  for (const [index, category] of menuData.entries()) {
    await prisma.menuCategory.create({
      data: {
        motelId: motel.id,
        name: category.name,
        slug: slugify(category.name),
        order: index,
        items: {
          create: category.items.map((item, itemIndex) => ({
            name: item.name,
            slug: slugify(`${category.name}-${item.name}-${itemIndex}`),
            description: item.description,
            price: item.price,
          })),
        },
      },
    });
  }

  console.log('Menú actualizado para Motel First Class ✅');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
