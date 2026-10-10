import type { PrismaClient } from '@prisma/client';

export type HomeRotationScope = 'POPUP_HOME' | 'FEATURED_HOME';

// The unique claim makes retries idempotent. PostgreSQL serializes concurrent
// updates to the same counter row; no in-memory state lives on Vercel instances.
export async function claimRotationTicket(db: PrismaClient, scope: HomeRotationScope, visitId: string): Promise<bigint> {
  return db.$transaction(async (tx) => {
    const inserted = await tx.$queryRaw<Array<{ visitId: string }>>`
      INSERT INTO "HomeRotationClaim" ("scope", "visitId")
      VALUES (${scope}, ${visitId})
      ON CONFLICT ("scope", "visitId") DO NOTHING
      RETURNING "visitId"
    `;
    if (!inserted.length) {
      const existing = await tx.$queryRaw<Array<{ ticket: bigint }>>`
        SELECT "ticket" FROM "HomeRotationClaim"
        WHERE "scope" = ${scope} AND "visitId" = ${visitId}
      `;
      if (!existing[0] || existing[0].ticket === null) throw new Error('Rotation claim missing its ticket');
      return existing[0].ticket;
    }

    const rows = await tx.$queryRaw<Array<{ nextTicket: bigint }>>`
      INSERT INTO "HomeRotationCounter" ("scope", "nextTicket")
      VALUES (${scope}, 0)
      ON CONFLICT ("scope") DO UPDATE
      SET "nextTicket" = "HomeRotationCounter"."nextTicket" + 1
      RETURNING "nextTicket"
    `;
    const ticket = rows[0].nextTicket;
    await tx.$executeRaw`
      UPDATE "HomeRotationClaim" SET "ticket" = ${ticket}
      WHERE "scope" = ${scope} AND "visitId" = ${visitId}
    `;
    // Opaque visit IDs are only needed for short-lived network retries.
    // Keep the idempotency table bounded without storing users or devices.
    if (ticket > BigInt(0) && ticket % BigInt(500) === BigInt(0)) {
      await tx.$executeRaw`
        DELETE FROM "HomeRotationClaim" WHERE "createdAt" < NOW() - INTERVAL '7 days'
      `;
    }
    return ticket;
  }, { timeout: 10000 });
}
