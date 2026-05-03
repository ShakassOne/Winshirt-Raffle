import test from 'node:test';
import assert from 'node:assert/strict';
import {TicketStatus} from '@prisma/client';
import {findCustomerTicketsByOrder} from '../lib/customer-tickets.js';

test('email + commande valide -> tickets retournés', async () => {
  const db: any = {
    shop: {findUnique: async () => ({id: 'shopA'})},
    shopifyOrder: {findFirst: async ({where}: any) => {assert.equal(where.customerEmail, 'a@b.com'); return {id: 'o1', shopifyOrderId: '1001', shopifyOrderNumber: '#1001'};}},
    ticket: {findMany: async () => ([{ticketNumber: 1, status: 'VALID', source: 'PURCHASE', createdAt: new Date('2026-01-01'), raffle: {title: 'L1'}, order: {shopifyOrderId: '1001', shopifyOrderNumber: '#1001'}}])},
  };
  const result = await findCustomerTicketsByOrder('a.myshopify.com', ' A@B.com ', ' #1001 ', db);
  assert.equal(result.length, 1);
  assert.equal(result[0].raffleTitle, 'L1');
});

test('mauvais email -> aucun ticket', async () => {
  const db: any = {shop: {findUnique: async () => ({id: 'shopA'})}, shopifyOrder: {findFirst: async () => null}, ticket: {findMany: async () => []}};
  const result = await findCustomerTicketsByOrder('a.myshopify.com', 'wrong@b.com', '#1001', db);
  assert.deepEqual(result, []);
});

test('mauvaise commande -> aucun ticket', async () => {
  const db: any = {shop: {findUnique: async () => ({id: 'shopA'})}, shopifyOrder: {findFirst: async () => null}, ticket: {findMany: async () => []}};
  const result = await findCustomerTicketsByOrder('a.myshopify.com', 'a@b.com', 'unknown', db);
  assert.deepEqual(result, []);
});

test('tickets autre shop non accessibles', async () => {
  const db: any = {
    shop: {findUnique: async ({where}: any) => where.shopDomain === 'a.myshopify.com' ? ({id: 'shopA'}) : null},
    shopifyOrder: {findFirst: async ({where}: any) => {assert.equal(where.shopId, 'shopA'); return null;}},
    ticket: {findMany: async () => []},
  };
  const result = await findCustomerTicketsByOrder('a.myshopify.com', 'a@b.com', '#1001', db);
  assert.deepEqual(result, []);
});

test('tickets CANCELLED / REFUNDED conservés pour affichage statut', async () => {
  const db: any = {
    shop: {findUnique: async () => ({id: 'shopA'})},
    shopifyOrder: {findFirst: async () => ({id: 'o1', shopifyOrderId: '1001', shopifyOrderNumber: '#1001'})},
    ticket: {findMany: async () => ([
      {ticketNumber: 2, status: TicketStatus.CANCELLED, source: 'PURCHASE', createdAt: new Date('2026-01-01'), raffle: {title: 'L1'}, order: {shopifyOrderId: '1001', shopifyOrderNumber: '#1001'}},
      {ticketNumber: 3, status: TicketStatus.REFUNDED, source: 'PURCHASE', createdAt: new Date('2026-01-01'), raffle: {title: 'L1'}, order: {shopifyOrderId: '1001', shopifyOrderNumber: '#1001'}},
    ])},
  };
  const result = await findCustomerTicketsByOrder('a.myshopify.com', 'a@b.com', '1001', db);
  assert.equal(result[0].status, TicketStatus.CANCELLED);
  assert.equal(result[1].status, TicketStatus.REFUNDED);
});

test('recherche email seul impossible/retour vide', async () => {
  const db: any = {shop: {findUnique: async () => ({id: 'shopA'})}, shopifyOrder: {findFirst: async () => {throw new Error('should not query order');}}, ticket: {findMany: async () => []}};
  const result = await findCustomerTicketsByOrder('a.myshopify.com', 'a@b.com', '   ', db);
  assert.deepEqual(result, []);
});
