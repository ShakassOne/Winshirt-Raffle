import {AuditActionType, Prisma, TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';
import {invalidateValidTicketsByOrder} from './ticket-invalidation.js';

type DbClient = typeof prisma;

export type HandleRefundCreatedResult =
  | 'processed'
  | 'duplicate_no_valid_tickets'
  | 'order_not_found'
  | 'refund_ignored_partial_unhandled'
  | 'invalid_payload';

export function parseRefundCreatedPayload(payload: unknown): {shopifyOrderId: string; isFullRefund: boolean} | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const orderId = p.order_id;
  if (!orderId) return null;

  const hasLineItems = Array.isArray(p.refund_line_items) && p.refund_line_items.length > 0;
  return {shopifyOrderId: String(orderId), isFullRefund: !hasLineItems};
}

export async function handleRefundCreated(shopDomain: string, payload: unknown, db: DbClient = prisma): Promise<HandleRefundCreatedResult> {
  const parsed = parseRefundCreatedPayload(payload);
  if (!parsed) return 'invalid_payload';

  const shop = await db.shop.findUnique({where: {shopDomain}});
  if (!shop) return 'order_not_found';

  if (!parsed.isFullRefund) {
    await db.auditLog.create({data: {shopId: shop.id, action: AuditActionType.UPDATE, entityType: 'ShopifyOrder', entityId: 'unknown', payloadJson: {
      shopifyOrderId: parsed.shopifyOrderId,
      reason: 'refund_ignored_partial_unhandled',
      limitation: 'line_item_id_not_tracked_for_ticket_mapping',
    } as Prisma.InputJsonValue}});
    return 'refund_ignored_partial_unhandled';
  }

  const result = await invalidateValidTicketsByOrder(shopDomain, parsed.shopifyOrderId, TicketStatus.REFUNDED, 'refund_total', 'refund_processed', db);
  if (result === 'no_valid_tickets') return 'duplicate_no_valid_tickets';
  return result;
}
