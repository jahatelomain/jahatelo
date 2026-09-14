import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_COLORS: Record<string, string> = {
  DIAMOND: '#06B6D4',
  GOLD: '#D97706',
  FREE: '#64748B',
  BASIC: '#8B2BE2',
};
function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] ?? character));
}

function labelFor(name: string) {
  return name.trim().replace(/\s+/g, ' ') || 'Motel';
}

function estimateLabelWidth(label: string) {
  return Array.from(label).reduce((width, character) => {
    if (/\s/.test(character)) return width + 4;
    if (/[ilI1.,'`]/.test(character)) return width + 4.5;
    if (/[MW@#%&]/.test(character)) return width + 11;
    if (character === character.toUpperCase() && character !== character.toLowerCase()) {
      return width + 9;
    }
    return width + 7.5;
  }, 0);
}

const PLAN_SCALE: Record<string, number> = {
  FREE: 0.72,
  BASIC: 0.82,
  GOLD: 0.94,
  DIAMOND: 1.06,
};

function markerDimensions(viewWidth: number, plan: string, platform: string) {
  // Android interpreta estos PNG nativos a mayor tamaño visual que iOS.
  // La escala base por plataforma corrige esa diferencia y el multiplicador
  // de plan recupera la jerarquía comercial sin alterar el área de toque.
  const platformScale = platform === 'android' ? 0.82 : 1;
  const outputScale = platformScale * (PLAN_SCALE[plan] ?? PLAN_SCALE.BASIC);
  return {
    viewWidth,
    outputWidth: Math.max(58, Math.round(viewWidth * outputScale)),
    outputHeight: Math.max(68, Math.round(94 * outputScale)),
  };
}

export async function GET(request: NextRequest) {
  const motelId = request.nextUrl.searchParams.get('id');
  const platform = request.nextUrl.searchParams.get('platform') === 'android' ? 'android' : 'ios';
  if (!motelId) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const motel = await prisma.motel.findFirst({
    where: { id: motelId, status: 'APPROVED', isActive: true },
    select: { name: true, plan: true },
  });
  if (!motel) return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });

  const color = PLAN_COLORS[motel.plan] ?? PLAN_COLORS.BASIC;
  const label = labelFor(motel.name);
  const text = escapeXml(label);
  // SVG mantiene el nombre como una única línea. El lienzo se calcula según
  // sus caracteres y después se escala completo para conservar la jerarquía
  // de planes sin separar el texto de su etiqueta.
  const textWidth = Math.ceil(estimateLabelWidth(label));
  const viewWidth = Math.max(80, textWidth + 28);
  const { outputWidth, outputHeight } = markerDimensions(viewWidth, motel.plan, platform);
  const center = viewWidth / 2;
  const svg = `<svg width="${viewWidth}" height="94" viewBox="0 0 ${viewWidth} 94" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#111827" flood-opacity=".24"/></filter>
    </defs>
    <g filter="url(#shadow)">
      <rect x="4" y="4" width="${viewWidth - 8}" height="34" rx="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M${center} 87 C${center - 5} 80 ${center - 30} 65 ${center - 30} 49 C${center - 30} 40 ${center - 23} 34 ${center - 14} 34 C${center - 8} 34 ${center - 3} 37 ${center} 42 C${center + 3} 37 ${center + 8} 34 ${center + 14} 34 C${center + 23} 34 ${center + 30} 40 ${center + 30} 49 C${center + 30} 65 ${center + 5} 80 ${center} 87 Z" fill="${color}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
      <text x="${center}" y="21" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="15" font-weight="600" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${text}</text>
    </g>
  </svg>`;
  const png = await sharp(Buffer.from(svg))
    .resize(outputWidth, outputHeight)
    .png()
    .toBuffer();
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}
