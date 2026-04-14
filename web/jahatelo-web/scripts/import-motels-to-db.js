/**
 * Script para importar moteles desde Google Maps a la base de datos
 * Uso: node scripts/import-motels-to-db.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Función para generar slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Función para extraer vecindario de dirección
function extractNeighborhood(address) {
  // Intenta extraer el barrio de la dirección
  // Formato típico: "Calle 123, Barrio, Ciudad, Paraguay"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3]; // Tercer elemento desde el final
  }
  return 'Centro'; // Default
}

// Función para limpiar número de teléfono
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  // Remover espacios y caracteres especiales, mantener solo números y +
  return phone.replace(/[^\d+]/g, '');
}

async function importMotels() {
  console.log('🚀 Iniciando importación de moteles a la base de datos\n');

  // Leer archivo JSON
  const jsonPath = path.join(__dirname, '../data/motels-paraguay-google.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Error: Archivo no encontrado');
    console.log('💡 Primero ejecuta: node scripts/scrape-motels-google.js');
    process.exit(1);
  }

  const motelsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📊 Total de moteles a importar: ${motelsData.length}\n`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const motelData of motelsData) {
    try {
      const slug = generateSlug(motelData.name);
      const neighborhood = extractNeighborhood(motelData.address);
      const phone = cleanPhoneNumber(motelData.phone);
      const whatsapp = phone ? phone.replace(/^\+/, '') : null;

      // Verificar si ya existe
      const existing = await prisma.motel.findFirst({
        where: {
          OR: [
            { slug },
            { name: motelData.name, city: motelData.city }
          ]
        }
      });

      const motelPayload = {
        name: motelData.name,
        slug,
        city: motelData.city,
        neighborhood,
        address: motelData.address,
        latitude: motelData.latitude,
        longitude: motelData.longitude,
        phone,
        whatsapp,
        website: motelData.website,
        mapUrl: motelData.googleMapsUrl,
        ratingAvg: motelData.rating || 0,
        ratingCount: motelData.totalRatings || 0,
        status: 'PENDING', // Requiere revisión manual
        isActive: false, // Desactivado hasta verificar
        plan: 'BASIC',
      };

      if (existing) {
        // Actualizar solo si hay datos nuevos
        await prisma.motel.update({
          where: { id: existing.id },
          data: {
            ...motelPayload,
            updatedAt: new Date(),
          }
        });
        updated++;
        console.log(`🔄 Actualizado: ${motelData.name} (${motelData.city})`);
      } else {
        // Crear nuevo
        await prisma.motel.create({
          data: motelPayload
        });
        imported++;
        console.log(`✅ Importado: ${motelData.name} (${motelData.city})`);
      }

    } catch (error) {
      errors++;
      console.error(`❌ Error con ${motelData.name}:`, error.message);
    }
  }

  console.log('\n📈 Resumen de importación:');
  console.log(`   ✅ Nuevos: ${imported}`);
  console.log(`   🔄 Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📊 Total procesados: ${imported + updated + skipped + errors}`);

  console.log('\n⚠️  IMPORTANTE:');
  console.log('   - Todos los moteles importados tienen status=PENDING');
  console.log('   - Debes revisar y aprobar cada motel manualmente en el admin');
  console.log('   - Verificar que sean realmente moteles (no hoteles genéricos)');
  console.log('   - Completar información faltante (precios, amenidades, fotos)');
}

// Ejecutar
importMotels()
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
