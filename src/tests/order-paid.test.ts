import test from 'node:test';
import assert from 'node:assert/strict';
import {RaffleStatus} from '@prisma/client';
import {handleOrderPaid, parseOrderPaidPayload} from '../lib/order-paid.js';

function makeDb() {
  const state: any = {
    shop: {id: 'shop1', shopDomain: 'test.myshopify.com'},
    orders: [] as any[],
    raffles: [
      {id: 'r1', shopId: 'shop1', status: RaffleStatus.ACTIVE, drawLockedAt: null, drawnAt: null, soldTicketsCount: 0, remainingTicketsCount: 10, maxTickets: 10},
      {id: 'r2', shopId: 'shop1', status: RaffleStatus.DRAFT, drawLockedAt: null, drawnAt: null, soldTicketsCount: 0, remainingTicketsCount: 10, maxTickets: 10},
    ],
    raffleProducts: [
      {raffleId: 'r1', shopifyProductId: '111', shopifyVariantId: null, ticketsPerUnit: 2, enabled: true, raffle: null},
      {raffleId: 'r1', shopifyProductId: '111', shopifyVariantId: 'v1', ticketsPerUnit: 3, enabled: true, raffle: null},
      {raffleId: 'r2', shopifyProductId: '222', shopifyVariantId: null, ticketsPerUnit: 1, enabled: true, raffle: null}
    ],
    tickets: [] as any[],
    logs: [] as any[]
  };
  state.raffleProducts.forEach((rp: any) => rp.raffle = state.raffles.find((r: any) => r.id === rp.raffleId));

  const tx: any = {
    shopifyOrder: {
      findUnique: async ({where}: any) => state.orders.find((o: any) => o.shopifyOrderId === where.shopifyOrderId) ?? null,
      create: async ({data}: any) => { const o = {id: `o${state.orders.length + 1}`, ...data}; state.orders.push(o); return o; }
    },
    raffleProduct: {findMany: async ({where}: any) => state.raffleProducts.filter((rp: any) => where.OR.some((o: any) => o.shopifyProductId === rp.shopifyProductId) && rp.enabled && rp.raffle.status === RaffleStatus.ACTIVE)},
    raffle: {
      findUnique: async ({where}: any) => state.raffles.find((r: any) => r.id === where.id) ?? null,
      update: async ({where, data}: any) => { const r = state.raffles.find((x: any) => x.id === where.id); Object.assign(r, data); return r; }
    },
    ticket: {
      aggregate: async ({where}: any) => ({_max: {ticketNumber: Math.max(0, ...state.tickets.filter((t: any) => t.raffleId === where.raffleId).map((t: any) => t.ticketNumber)) || null}}),
      createMany: async ({data}: any) => { state.tickets.push(...data); return {count: data.length}; }
    },
    auditLog: {create: async ({data}: any) => {state.logs.push(data); return data;}}
  };

  return {
    state,
    db: {
      shop: {findUnique: async ({where}: any) => where.shopDomain === state.shop.shopDomain ? state.shop : null},
      $transaction: async (fn: any) => fn(tx)
    }
  };
}

const payload: any = {id: '9001', name: '#1001', email: 'a@test.com', line_items: [{product_id: '111', variant_id: 'v1', quantity: 2, title: 'A', variant_title: 'B'}]};

test('parse payload ok', () => {
  const p = parseOrderPaidPayload(payload);
  assert.equal(p?.shopifyOrderId, '9001');
  assert.equal(p?.lineItems[0].quantity, 2);
});

test('create tickets with ticketsPerUnit x quantity and variant+global matching', async () => {
  const {db, state} = makeDb();
  const result = await handleOrderPaid('test.myshopify.com', payload, db as any);
  assert.equal(result, 'created');
  assert.equal(state.tickets.length, 10); // 2* (2 global + 3 variant) = 10
  assert.equal(state.raffles.find((r:any)=>r.id==='r1').soldTicketsCount, 10);
});

test('duplicate webhook skipped', async () => {
  const {db} = makeDb();
  await handleOrderPaid('test.myshopify.com', payload, db as any);
  const second = await handleOrderPaid('test.myshopify.com', payload, db as any);
  assert.equal(second, 'skipped_duplicate');
});

test('no matching products', async () => {
  const {db} = makeDb();
  const result = await handleOrderPaid('test.myshopify.com', {id: 'x', line_items: [{product_id: '999', quantity: 1}]}, db as any);
  assert.equal(result, 'no_matching_products');
});

test('inactive raffle ignored', async () => {
  const {db} = makeDb();
  const result = await handleOrderPaid('test.myshopify.com', {id: 'x2', line_items: [{product_id: '222', quantity: 1}]}, db as any);
  assert.equal(result, 'no_matching_products');
});

test('capacity exceeded', async () => {
  const {db, state} = makeDb();
  state.raffles[0].maxTickets = 3;
  const result = await handleOrderPaid('test.myshopify.com', payload, db as any);
  assert.equal(result, 'raffle_full_or_capacity_exceeded');
  assert.equal(state.tickets.length, 0);
});
