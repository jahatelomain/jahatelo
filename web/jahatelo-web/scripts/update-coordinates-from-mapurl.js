/**
 * Actualiza latitude/longitude desde mapUrl (Google Maps) para moteles.
 * Uso:
 *   node scripts/update-coordinates-from-mapurl.js        (solo sin coords)
 *   node scripts/update-coordinates-from-mapurl.js --force (sobrescribe coords)
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const prisma = new PrismaClient();

const normalizeMapUrl = (value) => {
  const trimmed = (value || '').trim();
  if (trimmed === '') return null;
  if (!trimmed.toLowerCase().startsWith('<iframe')) return trimmed;
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
};

const extractLatLngFromMapUrl = (value) => {
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const patterns = [
    {
      regex: /!3d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[2], match[1]],
    },
    {
      regex: /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /[?&]daddr=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
    {
      regex: /[?&]destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      getCoords: (match) => [match[1], match[2]],
    },
  ];

  for (const { regex, getCoords } of patterns) {
    const match = decoded.match(regex);
    if (match) {
      const [latRaw, lngRaw] = getCoords(match);
      const latitude = Number.parseFloat(latRaw);
      const longitude = Number.parseFloat(lngRaw);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
};

const shouldResolveUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host.includes('maps.app.goo.gl')) return true;
    if (host.includes('goo.gl')) return true;
    if (host.includes('bit.ly') || host.includes('t.co')) return true;
    if (host.includes('maps.google.com') && url.searchParams.has('cid')) return true;
    if (host.includes('google.com') && url.searchParams.has('cid')) return true;
    return false;
  } catch {
    return false;
  }
};

const resolveMapUrl = async (value) => {
  if (!value || !shouldResolveUrl(value)) return value;
  try {
    const res = await fetch(value, { redirect: 'follow' });
    return res.url || value;
  } catch (error) {
    return value;
  }
};

async function main() {
  const force = process.argv.includes('--force');
  console.log(`🔍 Buscando moteles con mapUrl${force ? ' (sobrescribiendo coords)' : ''}...`);

  const motels = await prisma.motel.findMany({
    where: {
      mapUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      mapUrl: true,
      latitude: true,
      longitude: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  let noCoords = 0;

  for (const motel of motels) {
    const normalized = normalizeMapUrl(motel.mapUrl);
    if (!normalized) {
      skipped++;
      continue;
    }

    let coords = extractLatLngFromMapUrl(normalized);
    if (!coords) {
      const resolved = await resolveMapUrl(normalized);
      if (resolved && resolved !== normalized) {
        coords = extractLatLngFromMapUrl(resolved);
      }
    }
    if (!coords) {
      noCoords++;
      continue;
    }

    const hasCoords = motel.latitude !== null && motel.longitude !== null;
    if (!force && hasCoords) {
      skipped++;
      continue;
    }

    if (
      motel.latitude === coords.latitude &&
      motel.longitude === coords.longitude
    ) {
      skipped++;
      continue;
    }

    await prisma.motel.update({
      where: { id: motel.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    updated++;
    console.log(`✅ ${motel.name}: ${coords.latitude}, ${coords.longitude}`);
  }

  console.log('\nResumen:');
  console.log(`  ✅ Actualizados: ${updated}`);
  console.log(`  ⏭️  Omitidos: ${skipped}`);
  console.log(`  ⚠️  Sin coords extraibles: ${noCoords}`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
