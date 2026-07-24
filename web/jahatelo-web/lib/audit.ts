import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type AuditPayload = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  module?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

export async function logAuditEvent(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        module: payload.module ?? null,
        method: payload.method ?? null,
        path: payload.path ?? null,
        statusCode: payload.statusCode ?? null,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
        requestId: payload.requestId ?? null,
        before: (payload.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (payload.after ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}
