import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, name, price, description } = body;

    if (!categoryId || !name || !price) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: categoryId, name, price' },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        price: parseInt(price),
        description,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    );
  }
}
