import test from 'node:test';
import assert from 'node:assert/strict';
import {RaffleStatus} from '@prisma/client';
import {validateRaffleInput, validateRaffleProductInput} from '../lib/raffle-admin.js';

test('validate slug format', () => {
  const errors = validateRaffleInput({title: 'A', slug: 'Bad Slug', status: RaffleStatus.DRAFT, maxTickets: 10, freeEntryEnabled: false});
  assert.equal(errors.some((e) => e.includes('slug')), true);
});

test('validate maxTickets > 0', () => {
  const errors = validateRaffleInput({title: 'A', slug: 'ok-slug', status: RaffleStatus.DRAFT, maxTickets: 0, freeEntryEnabled: false});
  assert.equal(errors.some((e) => e.includes('maxTickets')), true);
});

test('validate endDate after startDate', () => {
  const errors = validateRaffleInput({title: 'A', slug: 'ok-slug', status: RaffleStatus.DRAFT, maxTickets: 10, freeEntryEnabled: false, startDate: new Date('2026-01-02'), endDate: new Date('2026-01-01')});
  assert.equal(errors.some((e) => e.includes('endDate')), true);
});

test('validate raffle product ticketsPerUnit', () => {
  const ok = validateRaffleProductInput({shopifyProductId: 'gid://shopify/Product/1', ticketsPerUnit: 1, enabled: true});
  assert.equal(ok.length, 0);
  const ko = validateRaffleProductInput({shopifyProductId: 'gid://shopify/Product/1', ticketsPerUnit: 0, enabled: true});
  assert.equal(ko.some((e) => e.includes('ticketsPerUnit')), true);
});
