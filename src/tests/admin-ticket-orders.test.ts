import test from 'node:test';
import assert from 'node:assert/strict';
import {getOrderDetailsForShop, listOrdersForShop, listTicketsForShop} from '../lib/admin-ticket-orders.js';

const resolveShopId = async (shop: string) => shop === 'a.myshopify.com' ? 'shopA' : 'shopB';

test('tickets filtered by shop and status/email', async () => {
  const captured: any = {};
  const db: any = {ticket: {findMany: async ({where}: any) => {captured.where = where; return [];}, count: async () => 0}};
  await listTicketsForShop('a.myshopify.com', {status: 'VALID' as any, email: 'john@', ticketNumber: 12}, db, resolveShopId);
  assert.equal(captured.where.raffle.shopId, 'shopA');
  assert.equal(captured.where.status, 'VALID');
  assert.equal(captured.where.customerEmail.contains, 'john@');
  assert.equal(captured.where.ticketNumber, 12);
});

test('orders filtered by shop and email and ticket stats computed', async () => {
  const db: any = {shopifyOrder: {findMany: async ({where}: any) => {assert.equal(where.shopId, 'shopA'); assert.equal(where.customerEmail.contains, 'a@'); return [{id:'o1', shopifyOrderId:'1', tickets:[{status:'VALID'},{status:'REFUNDED'},{status:'CANCELLED'}], _count:{tickets:3}}];}, count: async () => 1}};
  const result = await listOrdersForShop('a.myshopify.com', {email:'a@'}, db, resolveShopId);
  assert.equal(result.items[0].ticketStats.total, 3);
  assert.equal(result.items[0].ticketStats.valid, 1);
  assert.equal(result.items[0].ticketStats.refundedOrCancelled, 2);
});

test('cannot retrieve order details from another shop', async () => {
  const db: any = {shopifyOrder: {findFirst: async ({where}: any) => {assert.equal(where.shopId, 'shopA'); return null;}}, auditLog: {findMany: async () => []}};
  const result = await getOrderDetailsForShop('a.myshopify.com', 'order-belongs-to-b', db, resolveShopId);
  assert.equal(result, null);
});
