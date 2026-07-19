import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { z } from 'zod';

const ExportTypeSchema = z.enum(['prospects', 'motels', 'financiero', 'analytics']);

// Escapa un valor para CSV: envuelve en comillas si contiene coma, comilla o salto de línea
function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-PY');
}

/**
 * GET /api/admin/export?type=prospects|motels|financiero|analytics
 * Exporta datos en formato CSV. Solo SUPERADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'export');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const typeResult = ExportTypeSchema.safeParse(searchParams.get('type'));
    if (!typeResult.success) {
      return NextResponse.json(
        { error: 'Tipo de exportación inválido. Usar: prospects | motels | financiero | analytics' },
        { status: 400 }
      );
    }
    const type = typeResult.data;

    let csv = '';
    let filename = '';

    // ── PROSPECTS ──────────────────────────────────────────────────────────
    if (type === 'prospects') {
      filename = `prospects_${dateSlug()}.csv`;

      const rows = await prisma.motelProspect.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const header = toRow([
        'ID', 'Nombre Contacto', 'Teléfono', 'Email', 'Motel', 'Canal',
        'Estado', 'Notas', 'Fecha Registro',
      ]);

      const body = rows.map((r) =>
        toRow([
          r.id,
          r.contactName,
          r.phone,
          r.email ?? '',
          r.motelName,
          r.channel,
          r.status,
          r.notes ?? '',
          formatDate(r.createdAt),
        ])
      );

      csv = [header, ...body].join('\r\n');
    }

    // ── MOTELS ─────────────────────────────────────────────────────────────
    else if (type === 'motels') {
      filename = `moteles_${dateSlug()}.csv`;

      const rows = await prisma.motel.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          isActive: true,
          city: true,
          address: true,
          phone: true,
          whatsapp: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      const header = toRow([
        'ID', 'Nombre', 'Slug', 'Plan', 'Estado', 'Activo',
        'Ciudad', 'Dirección', 'Teléfono', 'WhatsApp',
        'Rating Promedio', 'Cantidad Reseñas', 'Fecha Registro',
      ]);

      const body = rows.map((r) =>
        toRow([
          r.id,
          r.name,
          r.slug,
          r.plan,
          r.status,
          r.isActive ? 'Sí' : 'No',
          r.city ?? '',
          r.address ?? '',
          r.phone ?? '',
          r.whatsapp ?? '',
          r.ratingAvg?.toFixed(2) ?? '0',
          r.ratingCount ?? 0,
          formatDate(r.createdAt),
        ])
      );

      csv = [header, ...body].join('\r\n');
    }

    // ── FINANCIERO ─────────────────────────────────────────────────────────
    else if (type === 'financiero') {
      filename = `financiero_${dateSlug()}.csv`;

      const rows = await prisma.motel.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          financialStatus: true,
          paymentType: true,
          billingDay: true,
          billingCompanyName: true,
          billingTaxId: true,
          adminContactName: true,
          adminContactEmail: true,
          adminContactPhone: true,
        },
        orderBy: { name: 'asc' },
      });

      // Último pago por motel
      const motelIds = rows.map((r) => r.id);
      const lastPayments = await prisma.paymentHistory.findMany({
        where: { motelId: { in: motelIds } },
        select: { motelId: true, amount: true, currency: true, status: true, paidAt: true },
        orderBy: { paidAt: 'desc' },
        distinct: ['motelId'],
      });
      const paymentMap = new Map(lastPayments.map((p) => [p.motelId, p]));

      const header = toRow([
        'ID', 'Motel', 'Plan', 'Estado Financiero', 'Tipo Pago',
        'Día Facturación', 'Razón Social', 'RUC/CI',
        'Contacto Admin', 'Email Admin', 'Teléfono Admin',
        'Último Pago', 'Monto', 'Moneda', 'Estado Pago',
      ]);

      const body = rows.map((r) => {
        const lastPayment = paymentMap.get(r.id);
        return toRow([
          r.id,
          r.name,
          r.plan,
          r.financialStatus ?? '',
          r.paymentType ?? '',
          r.billingDay ?? '',
          r.billingCompanyName ?? '',
          r.billingTaxId ?? '',
          r.adminContactName ?? '',
          r.adminContactEmail ?? '',
          r.adminContactPhone ?? '',
          lastPayment ? formatDate(lastPayment.paidAt) : '',
          lastPayment?.amount?.toString() ?? '',
          lastPayment?.currency ?? '',
          lastPayment?.status ?? '',
        ]);
      });

      csv = [header, ...body].join('\r\n');
    }

    // ── ANALYTICS ──────────────────────────────────────────────────────────
    else if (type === 'analytics') {
      filename = `analytics_${dateSlug()}.csv`;

      // Últimos 90 días agrupados por motel y tipo de evento
      const since = new Date();
      since.setDate(since.getDate() - 90);

      const rows = await prisma.motelAnalytics.groupBy({
        by: ['motelId', 'eventType'],
        _count: { _all: true },
        where: { timestamp: { gte: since } },
        orderBy: { motelId: 'asc' },
      });

      // Resolver nombres de motel
      const motelIds = [...new Set(rows.map((r) => r.motelId))];
      const motels = await prisma.motel.findMany({
        where: { id: { in: motelIds } },
        select: { id: true, name: true },
      });
      const motelMap = new Map(motels.map((m) => [m.id, m.name]));

      const header = toRow(['Motel ID', 'Motel', 'Tipo Evento', 'Cantidad (últimos 90 días)']);

      const body = rows.map((r) =>
        toRow([
          r.motelId,
          motelMap.get(r.motelId) ?? r.motelId,
          r.eventType,
          r._count._all,
        ])
      );

      csv = [header, ...body].join('\r\n');
    }

    // BOM para que Excel abra correctamente con caracteres especiales
    const bom = '\uFEFF';

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[export] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al generar exportación' }, { status: 500 });
  }
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10);
}
