import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomTypeId, url, order } = body;

    if (!roomTypeId || !url) {
      return NextResponse.json(
        { error: 'roomTypeId and url are required' },
        { status: 400 }
      );
    }

    const roomPhoto = await prisma.roomPhoto.create({
      data: {
        roomTypeId,
        url,
        order: order ?? 0,
      },
    });

    return NextResponse.json(roomPhoto);
  } catch (error) {
    console.error('Error creating room photo:', error);
    return NextResponse.json(
      { error: 'Failed to create room photo' },
      { status: 500 }
    );
  }
}
