import { prisma } from '@/lib/prisma';

type AuditPayload = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}
