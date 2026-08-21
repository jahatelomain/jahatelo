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
  const normalized = name.trim();
  return normalized.length > 24 ? `${normalized.slice(0, 23).trimEnd()}…` : normalized;
}

export async function GET(request: NextRequest) {
  const motelId = request.nextUrl.searchParams.get('id');
  if (!motelId) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const motel = await prisma.motel.findFirst({
    where: { id: motelId, status: 'APPROVED', isActive: true },
    select: { name: true, plan: true },
  });
  if (!motel) return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });

  const color = PLAN_COLORS[motel.plan] ?? PLAN_COLORS.BASIC;
  const text = escapeXml(labelFor(motel.name));
  const svg = `<svg width="176" height="94" viewBox="0 0 176 94" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#111827" flood-opacity=".24"/></filter>
    </defs>
    <g filter="url(#shadow)">
      <rect x="4" y="4" width="168" height="34" rx="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <text x="88" y="26" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700">${text}</text>
      <path d="M88 87 C83 80 58 65 58 49 C58 40 65 34 74 34 C80 34 85 37 88 42 C91 37 96 34 102 34 C111 34 118 40 118 49 C118 65 93 80 88 87 Z" fill="${color}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
    </g>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}
