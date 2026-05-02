import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '@shopify/shopify-api';
import {PrismaSessionStorage} from '../lib/session-storage.js';

test('PrismaSessionStorage stores and loads a session', async () => {
  const records = new Map<string, any>();
  const storage = new PrismaSessionStorage({
    upsert: async ({create}) => { records.set(create.id, create); },
    findUnique: async ({where}) => records.get(where.id) ?? null,
    delete: async ({where}) => { records.delete(where.id); },
    findMany: async ({where}) => Array.from(records.values()).filter((r) => r.shop === where.shop).map((r) => ({id: r.id})),
    deleteMany: async ({where}) => { for (const [id, value] of records.entries()) if (value.shop === where.shop) records.delete(id); }
  });

  const session = new Session({id: 'offline_test-shop.myshopify.com', shop: 'test-shop.myshopify.com', state: 'state', isOnline: false});
  session.accessToken = 'token';

  assert.equal(await storage.storeSession(session), true);
  const loaded = await storage.loadSession(session.id);
  assert.equal(loaded?.id, session.id);
  assert.equal(loaded?.shop, session.shop);

  const ids = await storage.findSessionsByShop('test-shop.myshopify.com');
  assert.deepEqual(ids, [session.id]);
});
