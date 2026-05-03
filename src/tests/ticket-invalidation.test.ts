import test from 'node:test';
import assert from 'node:assert/strict';
import {TicketStatus} from '@prisma/client';
import {handleOrderCancelled} from '../lib/order-cancelled.js';
import {handleRefundCreated} from '../lib/refund-created.js';

function makeDb() {
  const state: any = {
    shop: {id: 'shop1', shopDomain: 'test.myshopify.com'},
    orders: [{id: 'o1', shopId: 'shop1', shopifyOrderId: '9001'}],
    raffles: [{id: 'r1', maxTickets: 10, soldTicketsCount: 2, remainingTicketsCount: 8}],
    tickets: [
      {id: 't1', orderId: 'o1', raffleId: 'r1', status: TicketStatus.VALID},
      {id: 't2', orderId: 'o1', raffleId: 'r1', status: TicketStatus.VALID},
      {id: 't3', orderId: 'o1', raffleId: 'r1', status: TicketStatus.REFUNDED},
      {id: 't4', orderId: 'o1', raffleId: 'r1', status: TicketStatus.WINNER},
    ],
    logs: [] as any[],
  };

  const tx: any = {
    shopifyOrder: {findFirst: async ({where}: any) => state.orders.find((o: any) => o.shopId === where.shopId && o.shopifyOrderId === where.shopifyOrderId) ?? null},
    ticket: {
      findMany: async ({where}: any) => state.tickets.filter((t: any) => t.orderId === where.orderId && t.status === where.status),
      updateMany: async ({where, data}: any) => {
        for (const t of state.tickets) if (where.id.in.includes(t.id)) t.status = data.status;
        return {count: where.id.in.length};
      },
      count: async ({where}: any) => state.tickets.filter((t: any) => t.raffleId === where.raffleId && t.status === where.status).length,
    },
    raffle: {
      findUnique: async ({where}: any) => state.raffles.find((r: any) => r.id === where.id) ?? null,
      update: async ({where, data}: any) => { const r = state.raffles.find((x:any) => x.id === where.id); Object.assign(r, data); return r; }
    },
    auditLog: {create: async ({data}: any) => { state.logs.push(data); return data; }}
  };

  return {
    state,
    db: {
      shop: {findUnique: async ({where}: any) => where.shopDomain === state.shop.shopDomain ? state.shop : null},
      shopifyOrder: {findFirst: tx.shopifyOrder.findFirst},
      auditLog: tx.auditLog,
      $transaction: async (fn: any) => fn(tx),
    },
  };
}

test('order cancelled invalidates only VALID and recalculates counters', async () => {
  const {db, state} = makeDb();
  const result = await handleOrderCancelled('test.myshopify.com', {id: '9001'}, db as any);
  assert.equal(result, 'processed');
  assert.equal(state.tickets.filter((t:any)=>t.status===TicketStatus.CANCELLED).length, 2);
  assert.equal(state.tickets.find((t:any)=>t.id==='t3').status, TicketStatus.REFUNDED);
  assert.equal(state.raffles[0].soldTicketsCount, 0);
  assert.equal(state.raffles[0].remainingTicketsCount, 10);
});

test('order cancelled duplicate has no double effect', async () => {
  const {db} = makeDb();
  await handleOrderCancelled('test.myshopify.com', {id: '9001'}, db as any);
  const second = await handleOrderCancelled('test.myshopify.com', {id: '9001'}, db as any);
  assert.equal(second, 'duplicate_no_valid_tickets');
});

test('full refund invalidates VALID to REFUNDED', async () => {
  const {db, state} = makeDb();
  const result = await handleRefundCreated('test.myshopify.com', {order_id: '9001'}, db as any);
  assert.equal(result, 'processed');
  assert.equal(state.tickets.filter((t:any)=>t.status===TicketStatus.REFUNDED).length, 3);
});

test('partial refund unhandled creates warning without invalidation', async () => {
  const {db, state} = makeDb();
  const result = await handleRefundCreated('test.myshopify.com', {order_id: '9001', refund_line_items: [{line_item_id: 'li1'}]}, db as any);
  assert.equal(result, 'refund_ignored_partial_unhandled');
  assert.equal(state.tickets.filter((t:any)=>t.status===TicketStatus.VALID).length, 2);
});

test('unknown order returns explicit result', async () => {
  const {db} = makeDb();
  const result = await handleOrderCancelled('test.myshopify.com', {id: 'does-not-exist'}, db as any);
  assert.equal(result, 'order_not_found');
});
