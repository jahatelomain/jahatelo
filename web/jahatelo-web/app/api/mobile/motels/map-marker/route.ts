import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
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
const MARKER_FONT_FILE = path.join(process.cwd(), 'assets/fonts/NotoSans-Regular.ttf');

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
  const normalized = name.trim();
  return normalized.length > 24 ? `${normalized.slice(0, 23).trimEnd()}…` : normalized;
}

const PLAN_SCALE: Record<string, number> = {
  FREE: 0.72,
  BASIC: 0.82,
  GOLD: 0.94,
  DIAMOND: 1.06,
};

function markerDimensions(label: string, plan: string, platform: string) {
  const characterCount = Array.from(label).length;
  const viewWidth = Math.max(80, Math.min(176, Math.ceil(characterCount * 8 + 28)));
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
  const { viewWidth, outputWidth, outputHeight } = markerDimensions(label, motel.plan, platform);
  const center = viewWidth / 2;
  const svg = `<svg width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${viewWidth} 94" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#111827" flood-opacity=".24"/></filter>
    </defs>
    <g filter="url(#shadow)">
      <rect x="4" y="4" width="${viewWidth - 8}" height="34" rx="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M${center} 87 C${center - 5} 80 ${center - 30} 65 ${center - 30} 49 C${center - 30} 40 ${center - 23} 34 ${center - 14} 34 C${center - 8} 34 ${center - 3} 37 ${center} 42 C${center + 3} 37 ${center + 8} 34 ${center + 14} 34 C${center + 23} 34 ${center + 30} 40 ${center + 30} 49 C${center + 30} 65 ${center + 5} 80 ${center} 87 Z" fill="${color}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
    </g>
  </svg>`;
  const png = await sharp(Buffer.from(svg))
    .composite([{
      input: {
        text: {
          text: `<span foreground="#FFFFFF">${text}</span>`,
          font: 'Noto Sans',
          fontfile: MARKER_FONT_FILE,
          width: outputWidth - 24,
          height: 31,
          align: 'centre',
          rgba: true,
        },
      },
      left: 12,
      top: 13,
    }])
    .png()
    .toBuffer();
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}
