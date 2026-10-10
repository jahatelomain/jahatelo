import { it } from 'node:test';
import assert from 'node:assert/strict';
import { claimRotationTicket } from '../lib/homeRotationTicket';

it('reserves one shared ticket per scope and reuses it on a repeated visit ID', async () => {
  const claims = new Map<string, bigint>();
  const counters = new Map<string, bigint>();
  const db = {
    $transaction: async (action: (tx: unknown) => Promise<unknown>) => action({
      $queryRaw: async (parts: TemplateStringsArray, ...values: unknown[]) => {
        const sql = parts.join('?');
        const scope = String(values[0]);
        if (sql.includes('INSERT INTO "HomeRotationClaim"')) {
          const key = `${scope}:${String(values[1])}`;
          if (claims.has(key)) return [];
          claims.set(key, BigInt(-1));
          return [{ visitId: values[1] }];
        }
        if (sql.includes('INSERT INTO "HomeRotationCounter"')) {
          const next = counters.get(scope) ?? BigInt(-1);
          const ticket = next + BigInt(1);
          counters.set(scope, ticket);
          return [{ nextTicket: ticket }];
        }
        if (sql.includes('SELECT "ticket"')) return [{ ticket: claims.get(`${scope}:${String(values[1])}`) }];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
      $executeRaw: async (_parts: TemplateStringsArray, ...values: unknown[]) => {
        claims.set(`${String(values[1])}:${String(values[2])}`, values[0] as bigint);
        return 1;
      },
    }),
  };
  const first = await claimRotationTicket(db as never, 'FEATURED_HOME', 'visit-a');
  const retry = await claimRotationTicket(db as never, 'FEATURED_HOME', 'visit-a');
  const second = await claimRotationTicket(db as never, 'FEATURED_HOME', 'visit-b');
  const popup = await claimRotationTicket(db as never, 'POPUP_HOME', 'visit-a');
  assert.deepEqual([first, retry, second, popup], [BigInt(0), BigInt(0), BigInt(1), BigInt(0)]);
  assert.equal(claims.size, 3);
});
