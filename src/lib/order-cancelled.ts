import {TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';
import {invalidateValidTicketsByOrder} from './ticket-invalidation.js';

type DbClient = typeof prisma;
export type HandleOrderCancelledResult = 'processed' | 'duplicate_no_valid_tickets' | 'order_not_found' | 'invalid_payload';

export function parseOrderCancelledPayload(payload: unknown): {shopifyOrderId: string} | null {
  if (!payload || typeof payload !== 'object') return null;
  const id = (payload as Record<string, unknown>).id;
  if (!id) return null;
  return {shopifyOrderId: String(id)};
}

export async function handleOrderCancelled(shopDomain: string, payload: unknown, db: DbClient = prisma): Promise<HandleOrderCancelledResult> {
  const parsed = parseOrderCancelledPayload(payload);
  if (!parsed) return 'invalid_payload';
  const result = await invalidateValidTicketsByOrder(shopDomain, parsed.shopifyOrderId, TicketStatus.CANCELLED, 'order_cancelled', 'order_cancelled_processed', db);
  if (result === 'no_valid_tickets') return 'duplicate_no_valid_tickets';
  return result;
}
